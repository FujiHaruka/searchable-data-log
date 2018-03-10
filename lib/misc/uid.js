const uuid = require('uuid')
const uid = () => uuid.v4().split('-').join('').slice(0, 20)

module.exports = uid
