const assert = require('assert')
const FileDescriptionFactory = require('../lib/FileDescriptionFactory')

describe('FileDescription', () => {
  it('works', () => {
    const FileDescription = FileDescriptionFactory('tmp')

    const desc = FileDescription.create({
      lowerBound: 100,
    })
    assert.ok(desc)

    const json = desc.toJSON()

    assert.deepEqual(
      FileDescription.fromJSON(json).toJSON(),
      json,
    )

    desc.update({
      line: 100,
      lowerBound: 10
    })
    assert.equal(desc.line, 100)
    assert.equal(desc.lowerBound, 10)
  })
})

/* global describe, it */
