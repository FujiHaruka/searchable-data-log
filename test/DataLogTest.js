const assert = require('assert')
const fs = require('fs-extra')
const DataLog = require('../lib')

describe('DataLog', function () {
  this.timeout(10000)
  const baseDir = 'tmp/DataLogTest'

  before(async () => {
    await fs.remove(baseDir)
  })

  after(async () => {
    // await fs.remove(baseDir)
  })

  it('works with single colum', async () => {
    const dataLog = new DataLog({baseDir, maxLines: 100})
    dataLog.load('Position', [{
      field: 'x',
      type: 'number',
      index: true,
    }])
    const {Position} = dataLog.resources

    {
      const dataList = new Array(100).fill(null).map(() => ({x: Math.random() * 1000}))
      for (const data of dataList) {
        await Position.append(data)
      }
      const results = await Position.search({
        x: {
          $gt: -Infinity,
          $lt: Infinity,
        }
      })
      assert.equal(results.length, 100)
    }
    {
      const dataList = new Array(1000).fill(null).map(() => ({x: Math.random() * 1000}))
      for (const data of dataList) {
        await Position.append(data)
      }
      const results = await Position.search({
        x: {
          $gt: 100,
          $lt: 200,
        }
      })
      assert.ok(results.length > 0)
    }
  })

  it('works with multiple columns', async () => {
    const dataLog = new DataLog({baseDir, maxLines: 50})
    dataLog.load('Coordinate', [{
      field: 'x',
      type: 'number',
      index: true,
      required: true,
    }, {
      field: 'y',
      type: 'number',
      index: true,
      required: true,
    }, {
      field: 'z',
      type: 'number',
      index: true,
      required: true,
    }])
    const {Coordinate} = dataLog.resources

    {
      const dataList = new Array(200).fill(null).map(() => ({
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        z: Math.random() * 1000,
      }))
      for (const data of dataList) {
        await Coordinate.append(data)
      }
      const results = await Coordinate.search({
        y: {
          $gt: -Infinity,
          $lt: Infinity,
        }
      })
      assert.equal(results.length, 200)
    }
    {
      const greaterThan = 20
      const lessThan = 50
      const results = await Coordinate.search({
        z: {
          $gt: greaterThan,
          $lt: lessThan,
        }
      })
      assert.ok(results.length > 0)
      results.forEach(({z}) => greaterThan < z && z < lessThan)
    }
  })
})

/* global describe, it, before, after */
