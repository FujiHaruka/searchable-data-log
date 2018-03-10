const File = require('./File')
const uid = require('./misc/uid')
const {join} = require('path')

function FileDescriptionFactory (dir) {
  return class FileDescription {
    // Private
    constructor (arg) {
      const {
        id = uid(),
        lowerBound,
        lines = 0,
      } = arg
      const {
        file = id + '.csv'
      } = arg
      const path = join(dir, file)
      Object.assign(this, {
        id,
        file: new File(path),
        lowerBound,
        lines,
        _fileName: file,
      })
    }

    toJSON () {
      return {
        file: this._fileName,
        id: this.id,
        lines: this.lines,
        lowerBound: this.lowerBound,
      }
    }

    update (props = {}) {
      Object.assign(this, props)
    }

    static fromJSON (obj) {
      return new FileDescription(obj)
    }

    static create ({file, lowerBound}) {
      return new FileDescription({file, lowerBound})
    }
  }
}

module.exports = FileDescriptionFactory