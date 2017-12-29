'use strict'

const pino = require('pino')

class Logger {
  constructor (options = {}) {
    return pino({
      base: null,
      name: options.name
    })
  }
}

module.exports = Logger
