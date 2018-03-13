import { v4 as uuid } from 'uuid'
const uid = () => uuid().split('-').join('').slice(0, 20)

export default uid
