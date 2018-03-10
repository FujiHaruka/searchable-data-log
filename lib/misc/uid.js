const uuid = require('uuid')
const uid = () => uuid.v4().split('-').join('').slice(-20)

module.exports = uid
