import { ColumnDefinition } from './csv/Column'
import CsvSchema, { CsvRow } from './csv/CsvSchema'
import ModelEntity, { ModelEntitySearchArg } from './ModelEntity'
import { join } from 'path'
import withRunning, { startRunningGuard, stopRunningGuard } from './misc/withRunning'

export interface ModelArg {
  dataDir: string
  csvDefinition: ColumnDefinition[]
  maxLines: number
}

@withRunning
class Model {

  dataDir: string
  csvDefinition: ColumnDefinition[]
  maxLines: number

  csvSchema: CsvSchema
  running: boolean = false
  modelEntities: Map<string, ModelEntity> = new Map()

  constructor ({ dataDir, csvDefinition, maxLines }: ModelArg) {
    this.dataDir = dataDir
    this.csvDefinition = csvDefinition
    this.maxLines = maxLines
    this.csvSchema = new CsvSchema(csvDefinition)
    for (const indexedField of this.csvSchema.indexedFields) {
      this.modelEntities.set(
        indexedField,
        new ModelEntity({
          dataDir: join(dataDir, indexedField),
          csvDefinition,
          indexedField,
          maxLines,
        }),
      )
    }
  }

  @startRunningGuard
  async run () {
    for (const modelEntity of this.modelEntities.values()) {
      await modelEntity.run()
    }
  }

  @stopRunningGuard
  async stop () {
    for (const modelEntity of this.modelEntities.values()) {
      await modelEntity.stop()
    }
  }

  async append (data: CsvRow) {
    if (!this.running) {
      await this.run()
    }
    const promises: Promise<void>[] = []
    for (const modelEntity of this.modelEntities.values()) {
      promises.push(
        modelEntity.append(data),
      )
    }
    await Promise.all(promises)
  }

  async search (condition: {[field: string]: ModelEntitySearchArg}) {
    if (!this.running) {
      await this.run()
    }
    // TODO multiple condition
    const field = Object.keys(condition)[0] as string
    const modelEntity = this.modelEntities.get(field) as ModelEntity
    const list = await modelEntity.search(condition[field])
    return list
  }
}

export default Model
