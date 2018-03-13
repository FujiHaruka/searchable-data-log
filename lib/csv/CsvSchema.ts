import Column, { ColumnDefinition, ColumnFieldValue } from './Column'
import { zip } from 'lodash'

export type CsvRow = {[field: string]: ColumnFieldValue}

class CsvSchema {

  rawColumns: ColumnDefinition[]
  columns: Column[]
  fields: string[]
  indexedFields: string[]
  private fieldsSet: Set<string>

  // TODO 少なくとも1つ index が必要であることを確認する
  constructor (columns: ColumnDefinition[]) {
    this.rawColumns = columns
    if (!Array.isArray(columns)) {
      this.throws('Columns must be array.')
    }
    this.fields = columns.map((c) => c.field)
    this.columns = columns.map((c) => new Column(c))
    this.fieldsSet = new Set(this.fields)
    this.indexedFields = columns.filter((c) => c.index).map((c) => c.field)
    if (this.indexedFields.length === 0) {
      throw new Error(`At least one field must be "index" = true`)
    }
  }

  get header () {
    return this.fields.join(',') + '\n'
  }

  /**
   * CSV 行オブジェクトに変換する
   * @param row
   */
  parse (row: (string | null)[]): CsvRow {
    return zip(this.columns, row)
      .map(([column, item]: [Column, (string | null)]) => ({ [column.field]: column.parse(item) }))
      .reduce((a, b) => Object.assign(a, b), {})
  }

  /**
   * パース可能であることを検証する
   * @param obj
   */
  verify (obj: {}) {
    for (const column of this.columns) {
      const { field } = column
      column.verifyValue(obj[field])
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
