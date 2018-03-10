const assert = require('assert')
const File = require('../lib/File')
const Csv = require('../lib/csv/Csv')
const fs = require('fs-extra')

describe('File', function () {
  const textPath = 'tmp/FileTest/test.txt'
  const csvPath = 'tmp/FileTest/test.csv'
  const jsonPath = 'tmp/FileTest/test.json'

  before(async () => {
    await fs.remove('tmp/FileTest')
  })

  after(async () => {
    await fs.remove('tmp/FileTest')
  })

  it('works with text', async () => {
    const file = new File(textPath)

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

  it('works with csv', async () => {
    const csv = new Csv([{
      field: 'x',
      type: 'number',
    }, {
      field: 'y',
      type: 'number',
    }])
    const file = new File(csvPath, {csv})

    const empty = await file.readCsv()
    assert.equal(empty.length, 0)

    await file.appendCsvLine({x: 1, y: 2})
    await file.appendCsvLine({x: 2, y: 3})

    const data = await file.readCsv()
    assert.deepEqual(
      data,
      [{x: 1, y: 2}, {x: 2, y: 3}]
    )
  })
})

/* global describe, it, before, after */
