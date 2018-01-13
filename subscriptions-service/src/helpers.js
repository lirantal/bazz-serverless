'use strict'

const Boom = require('boom')
const httpStatus = require('statuses')
const Logger = require('./Logger')
const logger = new Logger()

/**
 * lambda api gateway error handle
 *
 * @param {object.message} An error message that will be returned in the payload
 * @param {function} lambda function callback
 */
module.exports.responseError = function responseError (error, callback) {
  logger.info('request ended with error response')

  const internalError = !error.hasOwnProperty('isBoom')

  const statusCode = error && error.output && error.output.statusCode
    ? error.output.statusCode
    : httpStatus['Internal Server Error']

  const message = error && error.message && !internalError
    ? error.message
    : 'Internal server error'

  const res = {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' // Required for CORS support to work
    },
    body: JSON.stringify({
      error: {
        statusCode: error && error.output && error.output.statusCode
          ? error.output.statusCode
          : httpStatus['Internal Server Error'],
        message
      }
    })
  }

  logger.info(error.stack)
  logger.info(res)
  return callback(null, res)
}

/**
 * lambda api gateway success handler
 *
 * @param {object.body.data} A response payload
 * @param {function} lambda function callback
 */
module.exports.responseSuccess = function responseSuccess (response, callback) {
  logger.info('request ended with success response')

  const statusCode = response && response.statusCode
    ? response.statusCode
    : httpStatus['OK']

  const res = {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' // Required for CORS support to work
    },
    body: JSON.stringify({
      statusCode,
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
