import Queue = require('queue')

const QueueEvents = {
  END: 'end',
}

function withBlocking <C extends {new(...args: any[]): {}}> (Class: C) {
  return class WithQueue extends Class {
    _queue = Queue({ autostart: true, concurrency: 1 })
  }
}

export const block = (target: any, key: string, descriptor: PropertyDescriptor) => {
  const { value: method } = descriptor
  descriptor.value = async function waitTaskWrap (...args: any[]) {
    this._queue.push(async () => method.apply(this, args))
    if (this._queue.length === 0) {
      return
    }
    return new Promise((resolve) => {
      this._queue.once(QueueEvents.END, resolve)
    })
  }
}

export default withBlocking
