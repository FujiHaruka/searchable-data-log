import Allocator from './Allocator'
import Column, { ColumnDefinition } from './csv/Column'
import CsvConverter from './csv/CsvConverter'
import { CsvRow } from './csv/CsvSchema'
import CsvFile from './file/CsvFile'
import CsvFileDescription from './CsvFileDescription'
import withBlocking, { block } from './misc/withBlocking'
import withRunning, { startRunningGuard, stopRunningGuard, onlyRunning } from './misc/withRunning'
import { bind } from 'bind-decorator'
import { join } from 'path'

const INDEXED_FIELD_NAME = '$$indexed'

export interface ModelEntityArg {
  dataDir: string
  csvDefinition: ColumnDefinition[]
  indexedField: string
  maxLines: number
}

export interface ModelEntitySearchArg {
  greaterThan: number
  lessThan: number
  skip?: number
}

@withRunning
@withBlocking
class ModelEntity {

  dataDir: string
  csvDefinition: ColumnDefinition[]
  indexedField: string
  maxLines: number
  runnining: boolean

  indexedFieldColumn: ColumnDefinition
  customedCsvDefinition: ColumnDefinition[]
  csvConverter: CsvConverter
  allocator: Allocator
  csvFiles: Map<string, CsvFile>

  constructor (settings: ModelEntityArg) {
    const {
      dataDir,
      csvDefinition,
      indexedField, // TODO multiple fields
      maxLines,
    } = settings
    Object.assign(this, settings)
    this.indexedFieldColumn = {
      field: INDEXED_FIELD_NAME,
      type: Column.Types.NUMBER,
    }
    this.customedCsvDefinition = this.csvDefinition.concat(this.indexedFieldColumn)
    this.csvConverter = new CsvConverter(this.customedCsvDefinition)
    this.allocator = new Allocator({ dir: dataDir, maxLines })
    this.csvFiles = new Map()
  }

  @startRunningGuard
  async run () {
    await this.allocator.run()
    const { descriptions } = this.allocator
    for (const description of descriptions) {
      const { id, file } = description
      this.csvFiles.set(id, this.createCsvFile(file))
    }
  }

  @stopRunningGuard
  async stop () {
    await this.allocator.stop()
    this.csvFiles = new Map()
  }

  @block
  @onlyRunning
  async append (data: CsvRow) {
    data[INDEXED_FIELD_NAME] = data[this.indexedField]
    const comparingValue = data[this.indexedField] as number
    const description = await this.allocator.requestAppropriateDescription(comparingValue)
    const { id, file } = description
    if (!this.csvFiles.get(id)) {
      this.csvFiles.set(id, this.createCsvFile(file))
    }
    const csvFile = this.csvFiles.get(id) as CsvFile
    await csvFile.appendLines([data])
    const lines = description.lines + 1
    await this.allocator.updateDescription(id, { lines })

    if (lines > this.maxLines) {
      // ファイル分割
      const { created, deleted } = await this.devideCsvFile(description)
      for (const description of created) {
        await this.allocator.insertDescription(description)
      }
      for (const description of deleted) {
        await this.allocator.removeDescription(description)
      }
    }
  }

  @onlyRunning
  async search ({ greaterThan, lessThan, skip = 1 }: ModelEntitySearchArg): Promise<CsvRow[]> {
    const upperLimit = { lowerBound: Infinity }
    const descriptions = this.allocator.descriptions.filter(
      (desc, i, descs) => greaterThan < (descs[i + 1] || upperLimit).lowerBound && desc.lowerBound < lessThan,
    )
    if (descriptions.length === 0) {
      return []
    }
    let dataList: CsvRow[] = []
    for (const description of descriptions) {
      const csvFile = this.csvFiles.get(description.id)
      if (!csvFile) {
        continue
      }
      const list = await csvFile.read()
      list.sort(this.compareByIndexedField)
      dataList = dataList.concat(list)
      // ソート済みのリストを再保存しておく
      await csvFile.deleteSelf()
      await csvFile.appendLines(list)
    }
    const filtered = dataList.filter(
      (data, i) => greaterThan < (data[INDEXED_FIELD_NAME] as number) && (data[INDEXED_FIELD_NAME] as number) < lessThan && i % skip === 0,
    )
    filtered.sort(this.compareByIndexedField)
    return filtered
  }

  private async devideCsvFile (description: CsvFileDescription) {
    const { id } = description
    const csvFile = this.csvFiles.get(id)
    if (csvFile === undefined) {
      throw new Error(`Not found csv file of id = "${id}"`)
    }
    const dataList = await csvFile.read()
    dataList.sort(this.compareByIndexedField)
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
      (this.csvFiles.get(firstDesc.id) as CsvFile).appendLines(firstHalf),
      (this.csvFiles.get(lastDesc.id) as CsvFile).appendLines(lastHalf),
    ])
    await csvFile.deleteSelf()
    this.csvFiles.delete(id)
    return {
      created: [firstDesc, lastDesc],
      deleted: [description],
    }
  }

  @bind
  private compareByIndexedField (d1: CsvRow, d2: CsvRow) {
    return (d1[INDEXED_FIELD_NAME] as number) - (d2[INDEXED_FIELD_NAME] as number)
  }

  private createCsvFile (file: string) {
    const path = join(this.dataDir, file)
    return new CsvFile(path, { definition: this.customedCsvDefinition })
  }
}

export default ModelEntity
