const assert = require('assert')
const Allocator = require('../lib/Allocator')
const fs = require('fs-extra')

describe('Allocator', function () {
  const dir = 'tmp/allocatorTest'

  before(async () => {
    await fs.remove(dir)
  })

  after(async () => {
    await fs.remove(dir)
  })

  it('works', async () => {
    const alloc = new Allocator({dir})
    assert.ok(alloc)
  })
})

/* global describe, it, before, after */
