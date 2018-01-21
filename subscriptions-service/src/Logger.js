'use strict'

const winston = require('winston')
const logTransport = require('winston-loggly-bulk')

let logger = null

/**
 * Generic logger class
 *
 */
class Logger {
  /**
   *
   * @param {object.level} logger log level
   * @param {object.subdomain} logger domain for custom transport
   * @param {object.token} logger token for custom transport
   * @param {object.tags} logger tags array for custom transport
   */
  constructor (options = {}) {
    const logTransportOptions = {
      level: options && options.level ? options.level : 'silly',
      inputToken: options && options.token ? options.token : '',
      subdomain: options && options.subdomain ? options.subdomain : '',
      tags: options && options.tags ? options.tags : [],
      json: true,
      stripColors: true,
      isBulk: false,
      bufferOptions: {
        size: 1
      }
    }

    const logger = new winston.Logger({
      level: options && options.level ? options.level : 'silly',
      transports: [
        new logTransport.Loggly(logTransportOptions),
        new winston.transports.Console({
          formatter: options => {
            return `${options.level}: ${options.message} ${JSON.stringify(options.meta)}`
          }
        })
      ]
    })

    this.log = logger
  }

  /**
   * Flush any remaining logs in the buffer and gracefully shutdown
   * Specifically important on serverless platforms to remove any
   * remaining refs/timers and kill the node.js process
   */
  flush () {
    logTransport.flushLogsAndExit()
  }

  /**
   *
   * @param {options.meta.event} event data
   * @param {options.meta.context} context data
   */
  extendWithMeta (options = {}) {
    this.log.rewriters.push((level, message, meta) => {
      let eventParsed = {}
      if (options && options.meta && options.meta.event) {
        eventParsed = options.meta.event
        if (eventParsed.body) {
          try {
            eventParsed.body = JSON.parse(eventParsed.body)
          } catch (e) {}
        }
      }

      meta.event = eventParsed
      meta.context = options && options.context && options.meta.context
        ? options.meta.context
        : null

      return Object.assign(meta)
    })
  }
}

/**
 * Return a single insance of the Logger class
 * already instantiated with relevant configuration
 *
 * @param {*} options
 */
module.exports = function (options) {
  if (logger) {
    return logger
  }

  logger = new Logger(options)
  return logger
}
