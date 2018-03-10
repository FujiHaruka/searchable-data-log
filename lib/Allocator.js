const {join} = require('path')
const File = require('./File')
const FileDescriptionFactory = require('./FileDescriptionFactory')
const ALLOC_FILE = 'allocation.json'
const MAX_LINES = 1000

// データを適切なファイルに振り分ける人
class Allocator {
  constructor ({dir, csv, indexedField, maxLines}) {
    this.indexedField = indexedField
    this.dir = dir
    this.maxLines = maxLines || MAX_LINES
    this.allocFile = new File(join(dir, ALLOC_FILE))
    this.FileDescription = FileDescriptionFactory(dir, {fileSettings: {csv}})
    this._initialized = false
  }

  async initialize () {
    // lowerBound の小さい順に並んでいる
    const descriptionsRaw = await this.allocFile.readJson() || []
    this.descriptions = descriptionsRaw.map((desc) => this.FileDescription.fromJSON(desc))
    this._initialized = true
  }

  async allocateAppropriately (comparingValue) {
    this.assertInitiaized()
    let description
    const index = this._findMaxIndexLowerBoundLessThan(comparingValue)
    if (index > -1) {
      description = this.descriptions[index]
    } else {
      const isEmpty = this.descriptions.length === 0
      if (isEmpty) {
        description = this.FileDescription.create({
          lowerBound: comparingValue,
        })
        await this._insertDescription(description)
      } else {
        // 最小の lowerBound を更新する
        description = this.descriptions[0]
        await this._updateDescription(description.id, {
          lowerBound: comparingValue,
        })
      }
    }

    const shouldDevide = description.lines > this.maxLines
    if (shouldDevide) {
      const descriptions = await this._devideDescription(description)
      for (const desc of descriptions) {
        await this._insertDescription(desc)
      }
      await this._removeDescription(description)

      description = descriptions[1] // 必ず後者になる
    }

    return description
  }

  async countUpLines (description) {
    this.assertInitiaized()
    await this._updateDescription(description.id, {
      lines: description.lines + 1
    })
  }

  assertInitiaized () {
    if (!this._initialized) {
      throw new Error(`Allocation need be initialized`)
    }
  }

  // --- descriptions と allocFile の操作

  async _updateDescription (id, props = {}) {
    const index = this.descriptions.findIndex((a) => a.id === id)
    if (index === -1) {
      throw new Error(`Not found description ID ("${id}")`)
    }

    this.descriptions[index].update(props)
    await this.allocFile.saveJson(this.descriptions)
  }

  async _insertDescription (description) {
    const descriptions = [...this.descriptions]
    const found = descriptions.find((d) => d.id === description.id)
    if (found) {
      throw new Error(`ID duplication: "${found.id}"`)
    }
    let newIndex = this._findNewIndex(description)
    descriptions.splice(newIndex, 0, description) // Insert

    this.descriptions = descriptions
    await this.allocFile.saveJson(descriptions)
  }

  async _removeDescription (description) {
    const descriptions = [...this.descriptions]
    const index = descriptions.findIndex((d) => d.id === description.id)
    if (index === -1) {
      console.error(`description ID "${description.id}" not found`)
      return
    }
    descriptions.splice(index, 1)

    this.descriptions = descriptions
    await this.allocFile.saveJson(descriptions)
  }

  async _devideDescription (description) {
    const field = this.indexedField
    const dataList = await description.file.readCsv()
    dataList.sort((d1, d2) => d1[field] - d2[field])
    const median = Math.floor(dataList.length / 2)
    const firstHalf = dataList.slice(0, median)
    const lastHalf = dataList.slice(median)

    // ここでログファイル操作をするのは嫌だが
    const firstDesc = this.FileDescription.create({lowerBound: firstHalf[0][field], lines: firstHalf.length})
    const lastDesc = this.FileDescription.create({lowerBound: lastHalf[0][field], lines: lastHalf.length})

    await firstDesc.file.appendCsvLines(firstHalf)
    await lastDesc.file.appendCsvLines(lastHalf)

    await description.file.remove()

    return [firstDesc, lastDesc]
  }

  _findNewIndex (description) {
    const {descriptions} = this
    if (descriptions.length === 0) {
      return 0
    }
    let index = this._findMinIndexLowerBoundGreaterThan(description.lowerBound)
    if (index === -1) {
      return descriptions.length - 1
    } else {
      return index
    }
  }

  _findMinIndexLowerBoundGreaterThan (value) {
    // TODO Improve algorithm
    return this.descriptions.findIndex(
      (d) => d.lowerBound > value
    )
  }

  _findMaxIndexLowerBoundLessThan (value) {
    // TODO Improve algorithm
    const index = this._findMinIndexLowerBoundGreaterThan(value)
    if (index === -1) {
      return this.descriptions.length - 1
    } else {
      return index - 1
    }
  }
}

module.exports = Allocator
