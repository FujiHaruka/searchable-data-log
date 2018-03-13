
import CsvSchema, { CsvRow } from './CsvSchema'
import { ColumnDefinition } from './Column'

class CsvConverter {

  schema: CsvSchema

  constructor (columns: ColumnDefinition[]) {
    this.schema = new CsvSchema(columns)
  }

  stringify (obj: CsvRow): string {
    this.schema.verify(obj)
    return this.schema.fields.map((f) => obj[f]).join(',') + '\n'
  }

  parse (line: string): CsvRow {
    const splited = line.split(',')
    return this.schema.parse(splited)
  }
}

export default CsvConverter
