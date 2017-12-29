'use strict'
const uuid = require('uuid/v4')
const Logger = require('./Logger')

const logger = new Logger({ name: 'Token' })

class Token {
  constructor () {
    this.token = uuid()
  }

  get () {
    logger.info(`sending token: ${this.token}`)
    return this.token
  }
}

module.exports = Token
