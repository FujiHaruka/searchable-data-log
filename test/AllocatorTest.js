const assert = require('assert')
const Allocator = require('../lib/Allocator')
const fs = require('fs-extra')
const Csv = require('../lib/csv/Csv')
const assertThrows = require('assert-throws-async')

describe('Allocator', function () {
  const dirs = [
    'tmp/allocationTest0',
    'tmp/allocationTest1',
    'tmp/allocationTest2',
    'tmp/allocationTest3',
  ]

  before(async () => {
    for (const dir of dirs) {
      await fs.remove(dir)
    }
  })

  after(async () => {
    for (const dir of dirs) {
      await fs.remove(dir)
    }
  })

  it('works new', async () => {
    const alloc = new Allocator({dir: dirs[0]})
    assert.ok(alloc)

    assertThrows(async () => {
      await alloc.allocateAppropriately(10)
    })

    await alloc.initialize()

    const desc1 = await alloc.allocateAppropriately(10)
    const desc2 = await alloc.allocateAppropriately(30)
    const desc3 = await alloc.allocateAppropriately(25)
    const desc4 = await alloc.allocateAppropriately(5)
    assert.equal(desc1.id, desc2.id)
    assert.equal(desc1.id, desc3.id)
    assert.equal(desc1.id, desc4.id)
    assert.equal(desc1.lowerBound, 5)

    await alloc.countUpLines(desc1)
    assert.equal(desc1.lines, 1)
  })

  it('works existing 1', async () => {
    const dir = dirs[1]
    await fs.copy('assets/allocations/1', dir)

    const alloc = new Allocator({dir})
    await alloc.initialize()

    const desc = await alloc.allocateAppropriately(10)
    assert.equal(desc.lowerBound, 5)
  })

  it('works existing 2', async () => {
    const dir = dirs[2]
    await fs.copy('assets/allocations/2', dir)

    // lowerBounds: 0, 10, 20
    const alloc = new Allocator({dir})
    await alloc.initialize()

    {
      const desc = await alloc.allocateAppropriately(15)
      assert.equal(desc.lowerBound, 10)
    }
    {
      const desc = await alloc.allocateAppropriately(25)
      assert.equal(desc.lowerBound, 20)
    }
    {
      const desc = await alloc.allocateAppropriately(5)
      assert.equal(desc.lowerBound, 0)
    }
    {
      const desc = await alloc.allocateAppropriately(-5)
      assert.equal(desc.lowerBound, -5)
    }
  })

  it('works with files', async () => {
    const dir = dirs[3]
    await fs.copy('assets/allocations/3', dir)

    const csv = new Csv([{
      field: 'x',
      type: 'number',
    }])

    const alloc = new Allocator({
      dir,
      csv,
      indexedField: 'x',
      maxLines: 4,
    })
    await alloc.initialize()

    {
      // Just max lines
      const desc = await alloc.allocateAppropriately(5)
      assert.equal(desc.id, 'a')
    }
    {
      // Over max lines, and devide
      const desc = await alloc.allocateAppropriately(20)
      assert.notEqual(desc.id, 'b')
    }
  })
})

/* global describe, it, before, after */
