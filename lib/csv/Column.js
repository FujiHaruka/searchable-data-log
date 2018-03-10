const REQUIRED_KEYS = ['field', 'type']
const KEY_TYPES = [{
  key: 'field',
  is: String
}, {
  key: 'type',
  is: String
}, {
  key: 'required',
  is: Boolean
}, {
  key: 'index',
  is: Boolean
}]

const errMessage = (text, entity) => `[COLUMN_VALIDATION_ERROR] ${text} ${entity ? JSON.stringify(entity) : ''}`
const mustExists = (column, key) => {
  if (!column[key]) {
    throw new Error(errMessage(`Key "${key}" is required.`, column))
  }
}
const instanceOf = (value, Class) => {
  return Object.prototype.toString.call(value) === `[object ${Class.name}]`
}
const mustBeInstance = (column, key, Class) => {
  if (!instanceOf(column[key], Class)) {
    throw new Error(errMessage(`Key "${key}" must be ${Class.name}`, column))
  }
}
const indexedColumnTypeMustBeNumber = (column) => {
  if (column.index && column.type !== 'number') {
    throw new Error(errMessage(`Indexed column type must be number`, column))
  }
}

class Column {
  constructor (column) {
    Column._validate(column)
    const {field, type, required = false, index = false} = column
    Object.assign(this, {
      field, type, required, index
    })
  }

  parse (text) {
    switch (this.type) {
      // TODO not literal
      case 'string':
        return text || ''
      case 'number':
        return text ? Number(text) : null
      case 'boolean':
        return text === 'true' || false
    }
  }

  static _validate (column) {
    for (const key of Column.REQUIRED_KEYS) {
      mustExists(column, key)
    }
    for (const {key, is} of Column.KEY_TYPES) {
      if (typeof column[key] !== 'undefined') {
        mustBeInstance(column, key, is)
      }
    }
    indexedColumnTypeMustBeNumber(column)
  }
}

Column.REQUIRED_KEYS = REQUIRED_KEYS
Column.KEY_TYPES = KEY_TYPES

module.exports = Column
