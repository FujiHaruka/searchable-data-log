import {isNil} from 'lodash'

export interface ColumnDefinition {
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

  rawColumn: ColumnDefinition
  field: string
  type: string
  required?: boolean
  index?: boolean

  constructor (column: ColumnDefinition) {
    this.rawColumn = column
    this.verifyDefinition()
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

  /**
   * パースするときに値が正しいことを検証する
   */
  verifyValue (value: any) {
    if (this.required && isNil(value)) {
      this.throws(`Invalid data. Key ${this.field} is required: ${value}`)
    }
    if (!isNil(value) && typeof value !== this.type) {
      this.throws(`Invalid data. Key ${this.field} must be ${this.type}: ${value}`)
    }
  }

  /**
   * 定義オブジェクトが正しいことを検証する
   */
  private verifyDefinition () {
    for (const key of Column.REQUIRED_KEYS) {
      this.verifyExists(key)
    }
    for (const {key, is} of Column.KEY_TYPES) {
      if (typeof this.rawColumn[key] !== 'undefined') {
        this.verifyInstanceOf(key, is)
      }
    }
    this.verifyIndexedColumnTypeMustBeNumber()
  }
  
  private throws (text: string) {
    const {rawColumn: column} = this
    throw new Error(`[COLUMN_ERROR] ${text} / Column definition: ${column ? JSON.stringify(column) : ''}`)
  }

  private verifyExists (key: string) {
    if (!this.rawColumn[key]) {
      this.throws(`Key "${key}" is required.`)
    }
  }

  private verifyInstanceOf (key: string, Class: Function) {
    if (!instanceOf(this.rawColumn[key], Class)) {
      this.throws(`Key "${key}" must be ${Class.name}`)
    }
  }

  private verifyIndexedColumnTypeMustBeNumber () {
    if (this.rawColumn.index && this.rawColumn.type !== Column.Types.NUMBER) {
      this.throws(`Indexed column type must be number`)
    }
  }
}

export default Column