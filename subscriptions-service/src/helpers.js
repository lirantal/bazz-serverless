'use strict'
const Logger = require('./Logger')
const logger = new Logger()

/**
 *
 * @param {number} error.statusCode
 * @param {string} error.message
 * @param {function} callback
 */
module.exports.responseError = function responseError (error, callback) {
  logger.info('request ended with error response')
  const res = {
    statusCode: error && error.statusCode ? error.statusCode : 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' // Required for CORS support to work
    },
    body: JSON.stringify({
      error: {
        message: error && error.message ? error.message : 'Server error'
      }
    })
  }

  logger.info(error.stack)
  logger.info(res)
  return callback(null, res)
}

module.exports.responseSuccess = function responseSuccess (response, callback) {
  logger.info('request ended with success response')
  const res = {
    statusCode: response.statusCode || 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' // Required for CORS support to work
    },
    body: JSON.stringify({
      data: response && response.body && response.body.data
        ? response.body.data
        : {
          success: true
        }
    })
  }

  logger.info(res)
  return callback(null, res)
}
