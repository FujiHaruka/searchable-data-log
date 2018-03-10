const Model = require('./Model')

class DalaLog {
  constructor ({baseDir, maxLines}) {
    this.resources = {}
    this.baseDir = baseDir
    this.maxLines = maxLines
  }

  load (name, columns) {
    const {baseDir, maxLines} = this
    this.resources[name] = new Model({baseDir, name, columns, maxLines})
  }
}

module.exports = DalaLog
