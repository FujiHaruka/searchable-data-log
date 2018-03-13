import assert from 'power-assert'
import { remove } from 'fs-extra'
import DataLog from '../lib/DataLog'

describe('DataLog', function () {
  this.timeout(60000)
  const dataDir = 'tmp/DataLogTest'

  before(async () => {
    await remove(dataDir)
  })

  after(async () => {
    // await remove(dataDir)
  })

  it('works with single colum', async () => {
    const dataLog = new DataLog({ dataDir, maxLines: 100 })
    dataLog.load('Position', [{
      field: 'x',
      type: 'number',
      index: true,
    }])
    const { Position } = dataLog.resources

    {
      const dataList = new Array(100).fill(null).map(() => ({ x: Math.random() * 1000 }))
      for (const data of dataList) {
        await Position.append(data)
      }
      const results = await Position.search({
        x: {
          greaterThan: -Infinity,
          lessThan: Infinity,
        },
      })
      assert.equal(results.length, 100)
    }
    {
      const dataList = new Array(1000).fill(null).map(() => ({ x: Math.random() * 1000 }))
      for (const data of dataList) {
        await Position.append(data)
      }
      const results = await Position.search({
        x: {
          greaterThan: 100,
          lessThan: 200,
        },
      })
      assert.ok(results.length > 0)
    }

    await dataLog.close()
  })

  it('works with multiple columns', async () => {
    const dataLog = new DataLog({ dataDir, maxLines: 50 })
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
    const { Coordinate } = dataLog.resources

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
          greaterThan: -Infinity,
          lessThan: Infinity,
        },
      })
      assert.equal(results.length, 200)
    }
    {
      const greaterThan = 20
      const lessThan = 50
      const results = await Coordinate.search({
        z: {
          greaterThan,
          lessThan,
        },
      })
      assert.ok(results.length > 0)
      results.forEach(({ z }) => greaterThan < z && z < lessThan)
    }

    await dataLog.close()
  })

  it('is fast enough', async () => {
    const dataLog = new DataLog({ dataDir, maxLines: 5000 })
    dataLog.load('LatLng', [{
      field: 'lat',
      type: 'number',
      index: true,
      required: true,
    }, {
      field: 'lng',
      type: 'number',
      index: true,
      required: true,
    }, {
      field: 'alt',
      type: 'number',
      index: true,
      required: true,
    }])

    const { LatLng } = dataLog.resources

    for (const count of [100, 200, 500, 1000]) {
      const dataList = new Array(count).fill(null).map(() => ({
        lat: Math.random() * 1000,
        lng: Math.random() * 1000,
        alt: Math.random() * 1000,
      }))
      const start = Date.now()
      for (const data of dataList) {
        await LatLng.append(data)
      }
      const end = Date.now()
      const time = end - start
      console.log(`Append ${count} items in ${time} ms. ${time / count} ms / count`)
    }

    await dataLog.close()
  })
})

/* global describe, it, before, after */
