const Column = require('./Column')

const UNDEFINED = 'undefined'
const isUndef = (value) => typeof value === UNDEFINED

const errMessage = (text, entity) => `[COLUMN_VALIDATION_ERROR] ${text} ${entity ? JSON.stringify(entity) : ''}`

class Columns {
  constructor (columns) {
    if (!Array.isArray(columns)) {
      throw new Error(errMessage('Must be array.', columns))
    }
    this.fields = columns.map((c) => c.field)
    this._columns = columns.map((c) => new Column(c))
    this._fieldSet = new Set(this.fields)
  }

  parse (array) {
    return this._columns.map((c, i) => ({[c.field]: c.parse(array[i])}))
      .reduce((a, b) => Object.assign(a, b), {})
  }

  assert (obj) {
    for (const column of this._columns) {
      const {field, type, required} = column
      const value = obj[field]
      if (
        (required && isUndef(value)) ||
        (!isUndef(value) && typeof value !== type)
      ) {
        throw new Error(errMessage(`Invalid data. Key ${field} must be ${type} : ${JSON.stringify(obj)}`))
      }
    }
    for (const key of Object.keys(obj)) {
      if (!this._fieldSet.has(key)) {
        throw new Error(`Data column "${key}" is invalid`, obj)
      }
    }
  }
}

function create (columns) {
  return new Columns(columns)
}

module.exports = create
