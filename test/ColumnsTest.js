const assert = require('assert')
const Colums = require('../lib/csv/Columns')

describe('Columns', () => {
  it('works column', () => {
    const columns = Colums([{
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
    assert.ok(columns)

    assert.throws(() => {
      Colums([{field: undefined}])
    })
    assert.throws(() => {
      Colums([{field: 1}])
    })
    assert.throws(() => {
      Colums([{field: 'a', type: undefined}])
    })
    assert.throws(() => {
      Colums([{field: 'a', type: String}])
    })
    assert.throws(() => {
      Colums([{field: undefined, type: 'string'}])
    })
    assert.throws(() => {
      Colums([{field: 'a', type: 'string', required: 10}])
    })
    assert.throws(() => {
      Colums([{field: 'a', type: 'string', index: true}])
    })
  })

  it('works columns', () => {
    const columns = Colums([{
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

    columns.assert({
      x: 10,
    })
    columns.assert({
      x: 10,
      message: 'a'
    })
    columns.assert({
      x: 10,
      flag: false
    })

    assert.throws(() => {
      columns.assert({
        x: '10',
      })
    })
    assert.throws(() => {
      columns.assert({
        message: '100'
      })
    })
    assert.throws(() => {
      columns.assert({
        x: 10,
        message: 10
      })
    })
    assert.throws(() => {
      columns.assert({
        x: 10,
        fooo: 1
      })
    })
  })
})

/* global describe, it */
