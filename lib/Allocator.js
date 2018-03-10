const {join} = require('path')
const File = require('./File')
const FileDescriptionFactory = require('./FileDescriptionFactory')
const SETTING_FILE = 'allocation.json'
const MAX_LINES = 1000

class Allocator {
  constructor ({dir, field, csv}) {
    this.field = field
    this.dir = dir
    this.allocFile = new File(join(dir, SETTING_FILE))
    this.csv = csv
    this.FileDescription = FileDescriptionFactory(dir)
  }

  async initialize () {
    // lowerBound の小さい順に並んでいる
    const descriptionsRaw = await this.allocFile.readJson() || []
    this.descriptions = descriptionsRaw.map((desc) => this.FileDescription.fromJSON(desc))
  }

  async appendAppropriately (data) {
    const line = this.csv.stringify(data) // assert も行っている
    const comparingValue = data[this.field]

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

    await this._appendLine(line, description)

    if (description.lines > MAX_LINES) {
      // ファイルを分割すべき
      // TODO
    }
  }

  async _appendLine (line, description) {
    await description.file.append(line)
    await this._updateDescription(description.id, {
      lines: description.lines + 1
    })
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
    descriptions.splice(description, 0, newIndex) // Insert

    this.descriptions = descriptions
    await this.allocFile.saveJson(descriptions)
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
