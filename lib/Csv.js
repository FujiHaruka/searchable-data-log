const Columns = require('./Columns')

class Csv {
  constructor (columns) {
    this.columns = Columns(columns)
  }

  header () {
    return this.columns.fields.join(',') + '\n'
  }

  stringify (obj) {
    this.columns.assert(obj)
    return this.columns.fields.map((f) => obj[f]).join(',') + '\n'
  }

  parse (line) {
    const splited = line.split(',')
    return this.columns.parse(splited)
  }

  validate (data) {
  }
}

module.exports = Csv
