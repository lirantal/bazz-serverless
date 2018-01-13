'use strict'

const pino = require('pino')

/**
 * Generic logger class wrapping pino
 *
 * @param {object.name} logger name
 */
class Logger {
  constructor (options = {}) {
    return pino({
      base: null,
      name: options.name
    })
  }
}

module.exports = Logger
