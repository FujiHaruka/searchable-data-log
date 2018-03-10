const fs = require('fs-extra')
const Csv = require('./Csv')
const Allocator = require('./Allocator')
const {join} = require('path')

class Model {
  constructor ({baseDir, name, columns}) {
    this.baseDir = baseDir
    this.name = name
    this.csv = new Csv(columns)
    const fields = columns
      .filter((c) => c.indexed)
      .map((c) => c.field)
    this.allocators = fields
      .map((field) => new Allocator({
        dir: join(baseDir, name, field),
        indexedField: field,
        csv: this.csv,
      }))
      .map((alloc) => ({[alloc.indexedField]: alloc}))
      .reduce((a, b) => Object.assign(a, b), {})
  }

  async append (data) {
    for (const alloc of Object.values(this.allocators)) {
      if (!alloc.initialized) {
        await alloc.initialize()
      }
      const description = await alloc.allocateAppropriately(data[alloc.indexedField])
      await description.file.appendCsvLine(data)
    }
  }

  async search (condition = {}) {
    const keys = Object.keys(condition)
    if (keys.length > 2) {
      // TODO
      throw new Error('Not implemnted yet')
    }
    const field = keys[0]
    const {$gt: greaterThan, $lt: lessThan, skip = 2} = condition
    const allocator = this.allocators[field]
    if (!allocator) {
      throw new Error(`Field "${field} is not indexed`)
    }
    const descriptions = allocator.descriptions.filter(
      (desc) => greaterThan < desc.lowerBound && lessThan < desc.upperBound
    )
    if (descriptions.length === 0) {
      return []
    }
    let dataList = []
    for (const description of descriptions) {
      const list = await description.file.readCsv()
      dataList = dataList.concat(list)
    }
    const filtered = dataList.filter(
      (data, i) => greaterThan < data[field] && data[field] < lessThan && i % skip === 0
    )
    return filtered
  }
}

module.exports = Model
