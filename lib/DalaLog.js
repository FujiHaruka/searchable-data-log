const Model = require('./Model')

class DalaLog {
  constructor ({baseDir}) {
    this.resources = {}
    this.baseDir = baseDir
  }

  load (name, columns) {
    const {baseDir} = this
    this.resources[name] = new Model({baseDir, name, columns})
  }
}

module.exports = DalaLog
