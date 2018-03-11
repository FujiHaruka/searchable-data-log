import {
  copy,
  pathExists,
  outputFile,
  outputFileSync,
  readFile,
  remove,
} from 'fs-extra'
import withBlocking, {block} from '../misc/withBlocking'

@withBlocking
class JsonFile {

  path: string
  pretty: boolean

  constructor (path: string, options: {[key: string]: any} = {}) {
    this.path = path
    const {pretty = true} = options
    this.pretty = pretty
  }

  async read () {
    const exists = await pathExists(this.path)
    if (exists) {
      const text = (await readFile(this.path)).toString()
      return JSON.parse(text || 'null')
    } else {
      return null
    }
  }

  @block
  async save (obj: {}) {
    const text = JSON.stringify(obj, null, this.pretty && '  ')
    const { path } = this
    const exists = await pathExists(path)
    const backupPath = path + '.bk'
    if (exists) {
      await copy(path, backupPath)
    }
    try {
      await outputFile(path, text)
    } catch (e) {
      if (exists) {
        await copy(backupPath, path)
      }
      throw e
    }
  }

  saveSync (obj: {}) {
    const text = JSON.stringify(obj, null, '  ')
    outputFileSync(this.path, text)
  }

  async deleteSelf () {
    await remove(this.path)
  }
}

export default JsonFile
