export interface ColumnObject {
  field: string
  type: string
  required?: boolean
  index?: boolean
}
export type ColumnFieldValue = string | number | boolean | null

const instanceOf = (value: any, Class: Function) => {
  return Object.prototype.toString.call(value) === `[object ${Class.name}]`
}

class Column {

  rawColumn: ColumnObject
  field: string
  type: string
  required?: boolean
  index?: boolean

  constructor (column: ColumnObject) {
    this.rawColumn = column
    const {field, type, required = false, index = false} = column
    Object.assign(this, {
      field, type, required, index
    })
  }

  parse (text: string | null): ColumnFieldValue {
    if (text === null || text === undefined) {
      return null
    }
    switch (this.type) {
      // TODO not literal
      case Column.Types.STRING:
        return text
      case Column.Types.NUMBER:
        return Number(text)
      case Column.Types.BOOLEAN:
        return text === 'true' || false
    }
  }

  static Types = {
    STRING: 'string',
    NUMBER: 'number',
    BOOLEAN: 'boolean'
  }

  private static REQUIRED_KEYS = ['field', 'type']
  private static KEY_TYPES = [{
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

  // --- Validations

  private validate () {
    for (const key of Column.REQUIRED_KEYS) {
      this.varifyExists(key)
    }
    for (const {key, is} of Column.KEY_TYPES) {
      if (typeof this.rawColumn[key] !== 'undefined') {
        this.varifyInstanceOf(key, is)
      }
    }
    this.varifyIndexedColumnTypeMustBeNumber()
  }
  
  private throws (text: string) {
    const {rawColumn: column} = this
    throw new Error(`[COLUMN_ERROR] ${text} / column: ${column ? JSON.stringify(column) : ''}`)
  }

  private varifyExists (key: string) {
    if (!this.rawColumn[key]) {
      this.throws(`Key "${key}" is required.`)
    }
  }

  private varifyInstanceOf (key: string, Class: Function) {
    if (!instanceOf(this.rawColumn[key], Class)) {
      this.throws(`Key "${key}" must be ${Class.name}`)
    }
  }

  private varifyIndexedColumnTypeMustBeNumber () {
    if (this.rawColumn.index && this.rawColumn.type !== Column.Types.NUMBER) {
      this.throws(`Indexed column type must be number`)
    }
  }
}

export default Column