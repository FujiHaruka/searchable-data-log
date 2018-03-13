function withChanged <C extends {new(...args: any[]): {}}> (Class: C) {
  return class WithRunning extends Class {
    hasChanged: boolean = false
  }
}

export const andChanged = (target: any, key: string, descriptor: PropertyDescriptor) => {
  const { value: method } = descriptor
  descriptor.value = async function startRunningWrap (...args: any[]) {
    const result = await method.apply(this, args)
    this.hasChanged = true
    return result
  }
}

export default withChanged
