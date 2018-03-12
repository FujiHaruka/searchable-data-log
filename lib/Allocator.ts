import {join} from 'path'
import JsonFile from './file/JsonFile'
import CsvFileDescription, { CsvFileDescriptionRaw } from './CsvFileDescription'
import bind from 'bind-decorator'
import withRunning, { startRunningGuard, stopRunningGuard, onlyRunning } from './misc/withRunning'
import CsvFile from './file/CsvFile';

const ALLOC_FILE = 'allocation.json'
const DEFAULT_MAX_LINES = 1000

export interface AllocatorSetting {
  dir: string
  maxLines?: number
}

/**
 * データを適切な csv ファイルに振り分ける人
 */
@withRunning
class Allocator {

  dir: string
  maxLines: number
  running: boolean = false
  hasChanged: boolean = false

  private allocFile: JsonFile
  private descriptions: CsvFileDescription[]
  private savingTimer: NodeJS.Timer | null

  constructor ({dir, maxLines = DEFAULT_MAX_LINES}: AllocatorSetting) {
    this.dir = dir
    this.maxLines = maxLines
    this.allocFile = new JsonFile(join(dir, ALLOC_FILE))
  }

  @startRunningGuard
  async run () {
    const descriptionsRaw: CsvFileDescriptionRaw[] = await this.allocFile.read() || []
    this.descriptions = descriptionsRaw.map((desc: CsvFileDescriptionRaw) => CsvFileDescription.fromJSON(desc))
    this.descriptions.sort((d1, d2) => d1.lowerBound - d2.lowerBound) // 念の為

    process.addListener('exit', this.onExit)
    this.savingTimer = setInterval(async () => {
      // TODO 変更を検知して保存
      await this.allocFile.save(this.descriptions)
    }, 100)
  }

  @stopRunningGuard
  async stop () {
    clearInterval(this.savingTimer)
    process.removeListener('exit', this.onExit)
    await this.allocFile.save(this.descriptions)
  }

  @onlyRunning
  async allocateAppropriately (comparingValue: number) {
    let description
    const index = this.findMaxIndexLowerBoundLessThan(comparingValue)
    if (index > -1) {
      description = this.descriptions[index]
    } else {
      const isEmpty = this.descriptions.length === 0
      if (isEmpty) {
        description = CsvFileDescription.fromJSON({
          lowerBound: comparingValue,
        })
        await this.insertDescription(description)
      } else {
        // 最小の lowerBound を更新する
        description = this.descriptions[0]
        await this.updateDescription(description.id, {
          lowerBound: comparingValue,
        })
      }
    }

    return description
  }

  // --- descriptions の操作

  @onlyRunning
  async findDescription (id: string) {
    return this.descriptions.find((desc) => desc.id === id)
  }

  @onlyRunning
  async updateDescription (id: string, props = {}) {
    const index = this.descriptions.findIndex((a) => a.id === id)
    if (index === -1) {
      throw new Error(`Not found description ID ("${id}")`)
    }

    this.descriptions[index].update(props)
  }

  @onlyRunning
  async insertDescription (description: CsvFileDescription) {
    const descriptions = [...this.descriptions]
    const found = descriptions.find((d) => d.id === description.id)
    if (found) {
      throw new Error(`ID duplication: "${found.id}"`)
    }
    const newIndex = this.findNewIndex(description)
    descriptions.splice(newIndex, 0, description) // Insert

    this.descriptions = descriptions
  }

  @onlyRunning
  async removeDescription (description: CsvFileDescription) {
    const descriptions = [...this.descriptions]
    const removingIndex = descriptions.findIndex((d) => d.id === description.id)
    if (removingIndex === -1) {
      console.error(`description ID "${description.id}" not found`)
      return
    }
    descriptions.splice(removingIndex, 1)

    this.descriptions = descriptions
  }

  // --- Private

  private findNewIndex (description: CsvFileDescription) {
    const {descriptions} = this
    if (descriptions.length === 0) {
      return 0
    }
    let index = this.findMinIndexLowerBoundGreaterThan(description.lowerBound)
    if (index === -1) {
      return descriptions.length - 1
    } else {
      return index
    }
  }

  private findMinIndexLowerBoundGreaterThan (value: number): number {
    // TODO Improve algorithm
    return this.descriptions.findIndex(
      (d) => d.lowerBound > value
    )
  }

  private findMaxIndexLowerBoundLessThan (value: number): number {
    const index = this.findMinIndexLowerBoundGreaterThan(value)
    if (index === -1) {
      return this.descriptions.length - 1
    } else {
      return index - 1
    }
  }

  @bind
  private onExit () {
    this.allocFile.saveSync(this.descriptions)
  }
}

export default Allocator
