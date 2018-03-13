function withRunning <C extends {new(...args: any[]): {}}> (Class: C) {
  return class WithRunning extends Class {
    running: boolean = false
  }
}

export const startRunningGuard = (target: any, key: string, descriptor: PropertyDescriptor) => {
  const { value: method } = descriptor
  descriptor.value = async function startRunningWrap (...args: any[]) {
    if (this.running) {
      return
    }
    this.running = true
    return method.apply(this, args)
  }
}

export const stopRunningGuard = (target: any, key: string, descriptor: PropertyDescriptor) => {
  const { value: method } = descriptor
  descriptor.value = async function stopRunningWrap (...args: any[]) {
    if (!this.running) {
      return
    }
    this.running = false
    await method.apply(this, args)
  }
}

export const onlyRunning = (target: any, key: string, descriptor: PropertyDescriptor) => {
  const { value: method } = descriptor
  descriptor.value = async function onlyRunningWrap (...args: any[]) {
    if (!this.running) {
      throw new Error(`Run before doing something`)
    }
    return method.apply(this, args)
  }
}

export default withRunning
