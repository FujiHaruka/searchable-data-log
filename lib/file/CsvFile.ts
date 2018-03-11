import {
  outputFile,
  pathExists,
  readFile,
  remove,
} from 'fs-extra'
import CsvConverter from '../csv/CsvConverter'
import withBlocking, {block} from '../misc/withBlocking'
import { ColumnDefinition } from '../csv/Column'
import { CsvRow } from '../csv/CsvSchema'

interface CsvFileSettings {
  definition: ColumnDefinition[]
}

@withBlocking
class CsvFile {

  converter: CsvConverter
  path: string

  constructor (path: string, settings: CsvFileSettings) {
    const {
      definition,
    } = settings
    this.converter = new CsvConverter(definition)
    this.path = path
  }

  @block
  async appendLine (row: CsvRow) {
    const line = this.converter.stringify(row)
    await this.append(line)
  }

  @block
  async appendLines (rows: CsvRow[]) {
    const text = rows.map(
      (row) => this.converter.stringify(row)
    ).join('')
    await this.append(text)
  }

  async read (): Promise<CsvRow[]> {
    const exists = await pathExists(this.path)
    if (!exists) {
      return []
    }
    const text = (await readFile(this.path)).toString()
    if (!text) {
      return []
    }
    const lines = text.trim().split('\n')
      .map((line) => this.converter.parse(line))
    return lines
  }

  async deleteSelf () {
    await remove(this.path)
  }

  private async append (text: string) {
    await outputFile(this.path, text, {flag: 'a'})
  }
}

export default CsvFile