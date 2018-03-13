import Allocator from './Allocator'
import Column, { ColumnDefinition } from './csv/Column'
import CsvConverter from './csv/CsvConverter';
import { CsvRow } from './csv/CsvSchema';
import CsvFile from './file/CsvFile';
import CsvFileDescription from './CsvFileDescription';
import withBlocking, { block } from './misc/withBlocking';

const INDEXED_FIELD_NAME = '$indexedField'

export interface ModelEntityArg {
  dataDir: string
  csvDifinition: ColumnDefinition[]
  indexedField: string
  maxLines?: number
}

@withBlocking
class ModelEntity {

  dataDir: string
  csvDifinition: ColumnDefinition[]
  indexedField: string
  maxLines?: number

  // appended indexedField
  indexedFieldColumn: ColumnDefinition
  customedCsvDefinition: ColumnDefinition[]
  csvConverter: CsvConverter
  allocator: Allocator
  csvFiles: {[descriptionId: string]: CsvFile}

  constructor (settings: ModelEntityArg) {
    const {
      dataDir,
      csvDifinition,
      indexedField, // TODO multiple fields
      maxLines
    } = settings
    Object.assign(this, settings)
    this.indexedFieldColumn = {
      field: INDEXED_FIELD_NAME,
      type: Column.Types.NUMBER,
    }
    this.customedCsvDefinition = this.csvDifinition.concat(this.indexedFieldColumn)
    this.csvConverter = new CsvConverter(this.customedCsvDefinition)
    this.allocator = new Allocator({dir: dataDir, maxLines})
    this.csvFiles = {}
  }

  async connect () {
    await this.allocator.run()
    const {descriptions} = this.allocator
    for (const description of descriptions) {
      const {id, file} = description
      this.csvFiles[id] = new CsvFile(file, {definition: this.customedCsvDefinition})
    }
  }

  async disconnect () {
    await this.allocator.stop()
    this.csvFiles = {}
  }

  @block
  async append (data: CsvRow) {
    data[INDEXED_FIELD_NAME] = data[this.indexedField]
    const comparingValue = data[this.indexedField] as number
    const description = await this.allocator.requestAppropriateDescription(comparingValue)
    const {id, file} = description
    this.csvFiles[id] = this.csvFiles[id] || new CsvFile(file, {definition: this.customedCsvDefinition})
    const csvFile = this.csvFiles[id]
    await csvFile.appendLines([data])
    const lines = description.lines + 1
    await this.allocator.updateDescription(id, {lines: lines + 1})

    if (lines > this.maxLines) {
      // ファイル分割
      const dataList = await csvFile.read()
      dataList.sort((d1, d2) => (d1[INDEXED_FIELD_NAME] as number) - (d2[INDEXED_FIELD_NAME] as number))
      const middleIndex = Math.floor(dataList.length / 2)
      const firstHalf = dataList.slice(0, middleIndex)
      const lastHalf = dataList.slice(middleIndex)

      const [firstDesc, lastDesc] = [firstHalf, lastHalf].map(
        (list) => CsvFileDescription.fromJSON({
          lowerBound: list[0][INDEXED_FIELD_NAME] as number,
          lines: list.length,
        })
      )
      this.csvFiles[firstDesc.id] = new CsvFile(firstDesc.file, {definition: this.customedCsvDefinition})
      this.csvFiles[lastDesc.id] = new CsvFile(lastDesc.id, {definition: this.customedCsvDefinition})
 
      await Promise.all([
        this.csvFiles[firstDesc.id].appendLines(firstHalf),
        this.csvFiles[lastDesc.id].appendLines(lastHalf),
      ])
      await this.csvFiles[id].deleteSelf()
      delete this.csvFiles[id]
    }
  }

  async search () {

  }
}

export default ModelEntity