import assert from 'power-assert'
import Allocator from '../lib/Allocator'
import { remove, copy } from 'fs-extra'
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
      await remove(dir)
    }
  })

  after(async () => {
    for (const dir of dirs) {
      await remove(dir)
    }
  })

  it('works new', async () => {
    const alloc = new Allocator({ dir: dirs[0] })
    assert.ok(alloc)

    assertThrows(async () => {
      await alloc.requestAppropriateDescription(10)
    })

    await alloc.run()

    const desc1 = await alloc.requestAppropriateDescription(10)
    const desc2 = await alloc.requestAppropriateDescription(30)
    const desc3 = await alloc.requestAppropriateDescription(25)
    const desc4 = await alloc.requestAppropriateDescription(5)
    assert.equal(desc1.id, desc2.id)
    assert.equal(desc1.id, desc3.id)
    assert.equal(desc1.id, desc4.id)
    {
      const desc = await alloc.findDescription(desc1.id)
      assert.equal(desc.lowerBound, 5)
    }

    {
      await alloc.updateDescription(desc1.id, {
        lines: desc1.lines + 1,
      })
      const desc = await alloc.findDescription(desc1.id)
      assert.equal(desc.lines, 1)
    }

    await alloc.stop()
  })

  it('works existing 1', async () => {
    const dir = dirs[1]
    await copy('assets/allocations/1', dir)

    const alloc = new Allocator({ dir })
    await alloc.run()

    const desc = await alloc.requestAppropriateDescription(10)
    assert.equal(desc.lowerBound, 5)

    await alloc.stop()
  })

  it('works existing 2', async () => {
    const dir = dirs[2]
    await copy('assets/allocations/2', dir)

    // lowerBounds: 0, 10, 20
    const alloc = new Allocator({ dir })
    await alloc.run()

    {
      const desc = await alloc.requestAppropriateDescription(15)
      assert.equal(desc.lowerBound, 10)
    }
    {
      const desc = await alloc.requestAppropriateDescription(25)
      assert.equal(desc.lowerBound, 20)
    }
    {
      const desc = await alloc.requestAppropriateDescription(5)
      assert.equal(desc.lowerBound, 0)
    }
    {
      const desc = await alloc.requestAppropriateDescription(-5)
      assert.equal(desc.lowerBound, -5)
    }

    await alloc.stop()
  })
})

/* global describe, it, before, after */
