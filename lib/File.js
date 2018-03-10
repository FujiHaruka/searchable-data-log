const fs = require('fs-extra')
const Queue = require('queue')

class File {
  constructor (path) {
    this.path = path
    this.queue = Queue({autostart: true})
  }

  // --- Save

  async save (text) {
    this.queue.push(async () => this._save(text))
    await this._waitUntilEnd()
  }

  async saveJson (obj) {
    const text = JSON.stringify(obj, null, '  ')
    await this.save(text)
  }

  async append (line) {
    this.queue.push(async () => this._append(line))
    await this._waitUntilEnd()
  }

  // --- Read

  async read () {
    const exists = await fs.pathExists(this.path)
    if (exists) {
      return (await fs.readFile(this.path)).toString()
    } else {
      return null
    }
  }

  async readJson () {
    const text = (await this.read())
    return JSON.parse(text || 'null')
  }

  // --- Private

  async _append (line) {
    await fs.outputFile(this.path, line, {flag: 'a'})
  }

  async _save (text) {
    const { path } = this
    const exists = await fs.exists(path)
    const backupPath = path + '.bk'
    if (exists) {
      await fs.copy(path, backupPath)
    }

    try {
      await fs.outputFile(path, text)
    } catch (e) {
      if (exists) {
        await fs.copy(backupPath, path)
      }
      throw e
    }
  }

  async _waitUntilEnd () {
    if (this.queue.length === 0) {
      return
    }
    return new Promise((resolve) => {
      this.queue.once('end', resolve)
    })
  }
}

module.exports = File
