import assert from 'power-assert'
import { remove } from 'fs-extra'
import ModelEntity from '../lib/ModelEntity'
import { times, random } from 'lodash'

describe('ModelEntity', function () {
  this.timeout(60000)
  const dataDir = 'tmp/ModelEntityTest'

  before(async () => {
    await remove(dataDir)
  })

  after(async () => {
    // await remove(dataDir)
  })

  it('works with single colum', async () => {
    const model = new ModelEntity({
      dataDir: dataDir + '/1',
      csvDefinition: [{
        field: 'x',
        type: 'number',
        index: true,
      }],
      indexedField: 'x',
      maxLines: 100,
    })
    await model.run()

    {
      const dataList = times(100, () => ({ x: Math.random() * 1000 }))
      for (const data of dataList) {
        await model.append(data)
      }
      const results = await model.search({
        greaterThan: -Infinity,
        lessThan: Infinity,
      })
      assert.equal(results.length, 100)
    }
    {
      const dataList = times(100, () => ({ x: Math.random() * 1000 }))
      for (const data of dataList) {
        await model.append(data)
      }
      const results = await model.search({
        greaterThan: 100,
        lessThan: 200,
      })
      assert.ok(results.length > 0)
    }

    await model.stop()
  })

  it('works correct search', async () => {
    const model = new ModelEntity({
      dataDir: dataDir + '/2',
      csvDefinition: [{
        field: 'x',
        type: 'number',
        index: true,
      }],
      indexedField: 'x',
      maxLines: 80,
    })
    await model.run()

    let dataList: {x: number}[] = []
    const ranges = [[2.1, 3], [4.1, 5], [3.1, 4], [1.1, 2]]
    for (const [from, to] of ranges) {
      dataList = dataList.concat(times(200, () => ({ x: random(from, to) })))
    }

    for (const data of dataList) {
      await model.append(data)
    }

    for (const [from, to] of ranges) {
      const list = await model.search({
        greaterThan: from,
        lessThan: to,
      })
      assert.equal(list.length, 200)
    }
    await model.stop()
  })

  it('works with multiple columns', async () => {
    const model = new ModelEntity({
      dataDir: dataDir + '/3',
      csvDefinition: [{
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
      }],
      indexedField: 'z',
      maxLines: 100,
    })

    await model.run()

    {
      const dataList = times(200, () => ({
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        z: Math.random() * 1000,
      }))
      for (const data of dataList) {
        await model.append(data)
      }
      const results = await model.search({
        greaterThan: -1,
        lessThan: 1001,
      })
      assert.equal(results.length, 200)
    }

    await model.stop()
  })
})

/* global describe, it, before, after */
