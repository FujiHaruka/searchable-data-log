const assert = require('assert')
const File = require('../lib/File')
const fs = require('fs-extra')
const {join} = require('path')

describe('File', function () {
  const csvFile = 'FileTest.csv'
  const jsonFile = 'FileTest.json'
  const dir = 'tmp'

  before(async () => {
    await fs.remove(join(dir, csvFile))
    await fs.remove(join(dir, jsonFile))
  })

  after(async () => {
    await fs.remove(join(dir, csvFile))
    await fs.remove(join(dir, jsonFile))
  })

  it('works with csv', async () => {
    const file = new File({dir, filename: csvFile})

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
    const file = new File({dir, filename: jsonFile})

    const empty = await file.readJson()
    assert.ok(!empty)

    await file.saveJson({foo: 1})
    await file.saveJson({foo: 2})

    const json = await file.readJson()
    assert.equal(json.foo, 2)
  })
})

/* global describe, it, before, after */
