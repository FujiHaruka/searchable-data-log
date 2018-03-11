import assert from 'power-assert'
import JsonFile from '../lib/file/JsonFile'
import CsvFile from '../lib/file/CsvFile'
import {remove} from 'fs-extra'

describe('File', function () {
  const csvPath = 'tmp/FileTest/test.csv'
  const jsonPath = 'tmp/FileTest/test.json'

  before(async () => {
    await remove('tmp/FileTest')
  })

  after(async () => {
    await remove('tmp/FileTest')
  })

  it('works with json', async () => {
    const file = new JsonFile(jsonPath)

    const empty = await file.read()
    assert.ok(!empty)

    await file.save({foo: 1})
    await file.save({foo: 2})

    const json = await file.read()
    assert.equal(json.foo, 2)
  })

  it('works with csv', async () => {
    const definition = [{
      field: 'x',
      type: 'number',
    }, {
      field: 'y',
      type: 'number',
    }]
    const file = new CsvFile(csvPath, {definition})

    const empty = await file.read()
    assert.equal(empty.length, 0)

    await file.appendLine({x: 1, y: 2})
    await file.appendLine({x: 2, y: 3})

    const data = await file.read()
    assert.deepEqual(
      data,
      [{x: 1, y: 2}, {x: 2, y: 3}]
    )
  })
})

/* global describe, it, before, after */
