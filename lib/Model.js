const Csv = require('./csv/Csv')
const Allocator = require('./Allocator')
const {join} = require('path')

const DEFAULT_MAX_LINES = 1000

class Model {
  constructor ({baseDir, name, columns, maxLines}) {
    this.baseDir = baseDir
    this.name = name
    this.csv = new Csv(columns)
    const fields = columns
      .filter((c) => c.index)
      .map((c) => c.field)
    this.allocators = fields
      .map((field) => new Allocator({
        dir: join(baseDir, name, field),
        indexedField: field,
        csv: this.csv,
        maxLines,
      }))
      .map((alloc) => ({[alloc.indexedField]: alloc}))
      .reduce((a, b) => Object.assign(a, b), {})
  }

  async append (data) {
    for (const alloc of Object.values(this.allocators)) {
      if (!alloc.running) {
        await alloc.run()
      }
      const description = await alloc.allocateAppropriately(data[alloc.indexedField])
      await alloc.countUpLines(description)
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
    const {$gt: greaterThan, $lt: lessThan, skip = 1} = condition[field]
    const allocator = this.allocators[field]
    if (!allocator) {
      throw new Error(`Field "${field} is not indexed`)
    }
    const upperLimit = {lowerBound: Infinity}
    const descriptions = allocator.descriptions.filter(
      (desc, i, descs) => greaterThan < (descs[i + 1] || upperLimit).lowerBound && desc.lowerBound < lessThan
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
    filtered.sort((a, b) => a[field] - b[field])
    return filtered
  }

  async _close () {
    for (const alloc of Object.values(this.allocators)) {
      await alloc.stop()
    }
  }
}

module.exports = Model
