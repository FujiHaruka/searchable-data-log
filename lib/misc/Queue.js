const _Queue = require('queue')
const Events = {
  END: 'end',
}

class Queue {
  constructor () {
    this._queue = _Queue({autostart: true})
  }

  // タスクをどんどん追加できるが、一度に実行されるのは一つのタスク
  async doTask (func) {
    this._queue.push(func)
    await this._waitUntilEnd()
  }

  async _waitUntilEnd () {
    if (this._queue.length === 0) {
      return
    }
    return new Promise((resolve) => {
      this._queue.once(Events.END, resolve)
    })
  }
}

function create (...args) {
  return new Queue(...args)
}

module.exports = create
