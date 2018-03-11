import assert from 'power-assert'
import CsvSchema from '../dist/csv/CsvSchema'

describe('Columns', () => {
  it('works column', () => {
    const schema = new CsvSchema([{
      field: 'x',
      index: true,
      required: true,
      type: 'number'
    }, {
      field: 'message',
      type: 'string'
    }, {
      field: 'flag',
      type: 'boolean'
    }])
    assert.ok(schema)

    assert.throws(() => {
      new CsvSchema([{field: undefined}])
    })
    assert.throws(() => {
      new CsvSchema([{field: 1}])
    })
    assert.throws(() => {
      new CsvSchema([{field: 'a', type: undefined}])
    })
    assert.throws(() => {
      new CsvSchema([{field: 'a', type: String}])
    })
    assert.throws(() => {
      new CsvSchema([{field: undefined, type: 'string'}])
    })
    assert.throws(() => {
      new CsvSchema([{field: 'a', type: 'string', required: 10}])
    })
    assert.throws(() => {
      new CsvSchema([{field: 'a', type: 'string', index: true}])
    })
  })

  it('works columns', () => {
    const schema = new CsvSchema([{
      field: 'x',
      index: true,
      required: true,
      type: 'number'
    }, {
      field: 'message',
      type: 'string'
    }, {
      field: 'flag',
      type: 'boolean'
    }])

    schema.verify({
      x: 10,
    })
    schema.verify({
      x: 10,
      message: 'a'
    })
    schema.verify({
      x: 10,
      flag: false
    })

    assert.throws(() => {
      schema.verify({
        x: '10',
      })
    })
    assert.throws(() => {
      schema.verify({
        message: '100'
      })
    })
    assert.throws(() => {
      schema.verify({
        x: 10,
        message: 10
      })
    })
    assert.throws(() => {
      schema.verify({
        x: 10,
        fooo: 1
      })
    })
  })
})

/* global describe, it */
