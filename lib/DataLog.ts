import Model from './Model'
import { getMaxListeners } from 'cluster'
import { ColumnDefinition } from './csv/Column'
import { join } from 'path'

const DEFAULT_MAX_LINES = 1000

export interface DataLogArg {
  dataDir: string
  maxLines?: number
}

class DataLog {

  dataDir: string
  maxLines: number

  resources: {[name: string]: Model}

  constructor ({ dataDir, maxLines = DEFAULT_MAX_LINES }: DataLogArg) {
    this.dataDir = dataDir
    this.maxLines = maxLines
    this.resources = {}
  }

  load (name: string, csvDefinition: ColumnDefinition[]) {
    const { dataDir, maxLines } = this
    this.resources[name] = new Model({
      dataDir: join(dataDir, name),
      csvDefinition,
      maxLines,
    })
  }

  async close () {
    for (const name of Object.keys(this.resources)) {
      const Model = this.resources[name]
      await Model.stop()
    }
  }
}

export default DataLog
