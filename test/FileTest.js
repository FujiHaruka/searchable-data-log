const assert = require('assert')
const File = require('../lib/File')
const fs = require('fs-extra')

describe('BunnyonModel', function () {
  const csvPath = 'tmp/FileTest.csv'
  const jsonPath = 'tmp/FileTest.json'

  before(async () => {
    await fs.remove(csvPath)
    await fs.remove(jsonPath)
  })

  after(async () => {
    await fs.remove(csvPath)
    await fs.remove(jsonPath)
  })

  it('works with csv', async () => {
    const file = new File(csvPath)

    const empty = await file.read()
    assert.ok(!empty)

    await Promise.all([
      file.append('first\n'),
      file.append('second\n'),
      file.append('third\n')
    ])

    const text = await file.read()
    assert.equal(text.trim().split('\n').length, 3)
  })

  it('works with json', async () => {
    const file = new File(jsonPath)

    const empty = await file.readJson()
    assert.ok(!empty)

    await file.saveJson({foo: 1})
    await file.saveJson({foo: 2})

    const json = await file.readJson()
    assert.equal(json.foo, 2)
  })
})

/* global describe, it, before, after */
