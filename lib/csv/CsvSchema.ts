import Column, { ColumnObject, ColumnFieldValue } from './Column'
import {zip, isNil} from 'lodash'

export type CsvRow = {[field: string]: ColumnFieldValue}

class CsvSchema {

  rawColumns: ColumnObject[]
  columns: Column[]
  fields: string[]
  private fieldsSet: Set<string>

  constructor (columns: ColumnObject[]) {
    this.rawColumns = columns
    if (!Array.isArray(columns)) {
      this.throws('Columns must be array.')
    }
    this.fields = columns.map((c) => c.field)
    this.columns = columns.map((c) => new Column(c))
    this.fieldsSet = new Set(this.fields)
  }

  get header () {
    return this.fields.join(',') + '\n'
  }

  parse (row: (string | null)[]): CsvRow {
    return zip(this.columns, row)
      .map(([column, item]) => ({[column.field]: column.parse(item)}))
      .reduce((a, b) => Object.assign(a, b), {})
  }

  verify (obj: {}) {
    for (const column of this.columns) {
      const {field, type, required} = column
      const value = obj[field]
      if (required && isNil(value)) {
        this.throws(`Invalid data. Key ${field} is required: ${JSON.stringify(obj)}`)
      }
      if (!isNil(value) && typeof value !== type) {
        this.throws(`Invalid data. Key ${field} must be ${type}: ${JSON.stringify(obj)}`)
      }
    }
    for (const key of Object.keys(obj)) {
      if (!this.fieldsSet.has(key)) {
        this.throws(`Invalid data. Key "${key}" is unnecessary: ${JSON.stringify(obj)}`)
      }
    }
  }

  private throws (message: string) {
    throw new Error(`[CSV_SCHEMA_ERROR] ${message}`)
  }
}

export default CsvSchema