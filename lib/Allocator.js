const {join} = require('path')
const File = require('./File')
const uuid = require('uuid')
const uid = () => uuid.v4().split('-').join('')
const SETTING_FILE = 'allocation.json'
const MAX_LINES = 1000

// alloc = { id: 'aaa' ,file: 'path.csv', lowerBound: 10, lines: 5}

class Allocator {
  constructor ({dir, field, csv}) {
    this.field = field
    this.dir = dir
    this.allocFile = new File(join(dir, SETTING_FILE))
    this.csv = csv
  }

  async initialize () {
    const allocsRaw = await this.allocFile.readJson() || []
    this.allocs = allocsRaw.map((alloc) => ({
      ...alloc,
      file: new File({filename: alloc.file, dir: this.dir})
    }))
  }

  async appendAppropriately (data) {
    const line = this.csv.stringify(data) // assert も行っている
    const comparingValue = data[this.field]

    // value > lowerBound な最小の alloc を探す。
    // TODO Improve algorithm
    let alloc = this.allocs.find((a) => comparingValue > a.lowerBound)
    if (alloc) {
      if (alloc.lines > MAX_LINES) {
        // ファイルを分割すべき
        // TODO
      }
    } else {
      if (this.allocs.length > 0) {
        // 最小の lowerBound を更新する
        alloc = {
          ...this.allocs[0],
          lowerBound: comparingValue,
        }
        await this.updateAlloc(alloc)
      } else {
        // create new
        const id = uid()
        const filename = id + '.csv'
        alloc = {
          id,
          file: new File({filename, dir: this.dir}),
          lowerBound: comparingValue,
          lines: 0,
        }
        await this.updateAlloc(alloc)
      }
    }

    await this.appendToAlloc(line, alloc)
  }

  async appendToAlloc (line, alloc) {
    await alloc.file.append(line)
    await this.updateAlloc({
      ...alloc,
      lines: alloc.lines + 1
    })
  }

  async updateAlloc (alloc) {
    let allocs = [...this.allocs]
    const index = this.allocs.findIndex((a) => a.id === alloc.id)
    if (index > -1) {
      allocs[index] = alloc
    } else {
      // TODO Improve algorithm
      let newIndex = this.allocs.length === 0
        ? 0
        : this.allocs.findIndex((a) => a.lowerBound > alloc.lowerBound)
      if (newIndex === -1) {
        newIndex = this.allocs.length - 1
      }
      allocs.splice(alloc, 0, newIndex) // Insert
    }
    this.allocs = allocs
    await this.allocFile.saveJson(allocs)
  }
}

module.exports = Allocator
