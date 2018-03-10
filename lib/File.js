const fs = require('fs-extra')
const Queue = require('./misc/Queue')

class File {
  constructor (path) {
    this.path = path
    this.queue = Queue()
  }

  // --- Save

  async save (text) {
    await this.queue.doTask(async () => this._save(text))
  }

  async saveJson (obj) {
    const text = JSON.stringify(obj, null, '  ')
    await this.save(text)
  }

  async append (line) {
    await this.queue.doTask(async () => this._append(line))
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
}

module.exports = File
