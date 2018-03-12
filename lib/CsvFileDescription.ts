import {join} from 'path'
import CsvFile from './file/CsvFile'
import uid from './misc/uid'
import CsvConverter from './csv/CsvConverter';

/**
 * CsvFileDescription constructor arg
 */
export interface CsvFileDescriptionRaw {
  id?: string
  file?: string
  lowerBound: number
  lines?: number
}

/**
 * CSV file description managed by allocator
 */
class CsvFileDescription {
  id: string
  file: string
  lowerBound: number
  lines: number

  private constructor (setting: CsvFileDescriptionRaw) {
    const {
      id = uid(),
      lowerBound,
      lines = 0,
    } = setting
    const {
      file = id + '.csv'
    } = setting
    Object.assign(this, {
      id, file, lowerBound, lines
    })
  }

  toJSON () {
    return {
      file: this.file,
      id: this.id,
      lines: this.lines,
      lowerBound: this.lowerBound,
    }
  }

  update (props: {} = {}) {
    Object.assign(this, props)
  }

  static fromJSON (setting: CsvFileDescriptionRaw) {
    return new CsvFileDescription(setting)
  }
}

export default CsvFileDescription