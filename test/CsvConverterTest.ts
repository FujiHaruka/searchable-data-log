import assert from 'power-assert'
import CsvConverter from '../lib/csv/CsvConverter'

describe('Csv', () => {
  it('works', () => {
    const columns = [{
      field: 'x',
      index: true,
      required: true,
      type: 'number',
    }, {
      field: 'y',
      index: true,
      required: true,
      type: 'number',
    }, {
      field: 'time',
      index: true,
      required: true,
      type: 'number',
    }, {
      field: 'message',
      type: 'string',
    }, {
      field: 'flag',
      type: 'boolean',
    }]
    const csv = new CsvConverter(columns)

    assert.deepEqual(
      csv.parse('1,2,3,,\n'),
      {x: 1, y: 2, time: 3, message: '', flag: false}
    )

    assert.equal(
      csv.stringify({time: 3, x: 1, y: 2}),
      '1,2,3,,\n'
    )

    assert.deepEqual(
      csv.parse(csv.stringify({x: 1, y: 2, time: 3, message: '1', flag: false})),
      {x: 1, y: 2, time: 3, message: '1', flag: false}
    )

    assert.throws(() => {
      csv.stringify({x: 1, y: 2, tttime: 3})
    })
    assert.throws(() => {
      csv.stringify({x: 1, y: 'string', time: 3})
    })
  })
})

/* global describe, it */
