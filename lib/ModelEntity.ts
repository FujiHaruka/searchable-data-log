import Allocator from './Allocator'
import Column, { ColumnDefinition } from './csv/Column'
import CsvConverter from './csv/CsvConverter'
import { CsvRow } from './csv/CsvSchema'
import CsvFile from './file/CsvFile'
import CsvFileDescription from './CsvFileDescription'
import withBlocking, { block } from './misc/withBlocking'

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
  csvFiles: Map<string, CsvFile>

  constructor (settings: ModelEntityArg) {
    const {
      dataDir,
      csvDifinition,
      indexedField, // TODO multiple fields
      maxLines,
    } = settings
    Object.assign(this, settings)
    this.indexedFieldColumn = {
      field: INDEXED_FIELD_NAME,
      type: Column.Types.NUMBER,
    }
    this.customedCsvDefinition = this.csvDifinition.concat(this.indexedFieldColumn)
    this.csvConverter = new CsvConverter(this.customedCsvDefinition)
    this.allocator = new Allocator({ dir: dataDir, maxLines })
    this.csvFiles = new Map()
  }

  async connect () {
    await this.allocator.run()
    const { descriptions } = this.allocator
    for (const description of descriptions) {
      const { id, file } = description
      this.csvFiles.set(id, new CsvFile(file, { definition: this.customedCsvDefinition }))
    }
  }

  async disconnect () {
    await this.allocator.stop()
    this.csvFiles = new Map()
  }

  @block
  async append (data: CsvRow) {
    data[INDEXED_FIELD_NAME] = data[this.indexedField]
    const comparingValue = data[this.indexedField] as number
    const description = await this.allocator.requestAppropriateDescription(comparingValue)
    const { id, file } = description
    this.csvFiles[id] = this.csvFiles[id] || this.createCsvFile(file)
    const csvFile = this.csvFiles[id]
    await csvFile.appendLines([data])
    const lines = description.lines + 1
    await this.allocator.updateDescription(id, { lines: lines + 1 })

    if (lines > this.maxLines) {
      // ファイル分割
    }
  }

  async search () {

  }

  private async devideCsvFile (description: CsvFileDescription) {
    const { id } = description
    const csvFile = this.csvFiles.get(id)
    if (csvFile === undefined) {
      throw new Error(`Not found csv file of id = "${id}"`)
    }
    const dataList = await csvFile.read()
    dataList.sort((d1, d2) => (d1[INDEXED_FIELD_NAME] as number) - (d2[INDEXED_FIELD_NAME] as number))
    const middleIndex = Math.floor(dataList.length / 2)
    const firstHalf = dataList.slice(0, middleIndex)
    const lastHalf = dataList.slice(middleIndex)

    const [firstDesc, lastDesc] = [firstHalf, lastHalf].map(
      (list) => CsvFileDescription.fromJSON({
        lowerBound: list[0][INDEXED_FIELD_NAME] as number,
        lines: list.length,
      }),
    )
    this.csvFiles.set(firstDesc.id, this.createCsvFile(firstDesc.file))
    this.csvFiles.set(lastDesc.id, this.createCsvFile(lastDesc.file))

    await Promise.all([
      this.csvFiles[firstDesc.id].appendLines(firstHalf),
      this.csvFiles[lastDesc.id].appendLines(lastHalf),
    ])
    await csvFile.deleteSelf()
    this.csvFiles.delete(id)
  }

  private createCsvFile (file: string) {
    return new CsvFile(file, { definition: this.customedCsvDefinition })
  }
}

export default ModelEntity
