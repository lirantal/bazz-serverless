'use strict'

const Token = require('./src/Tokens')
const { responseError, responseSuccess } = require('./src/helpers')
const Logger = require('./src/Logger')

module.exports.createToken = (event, context, callback) => {
  const token = new Token()
  const logger = new Logger({ name: 'Tokens' })

  return token
    .create()
    .then(function (result) {
      logger.info(result)

      const bodyRespone = {
        data: {
          sub_id: result.id,
          token: result.token,
          nonce: result.nonce
        }
      }

      return responseSuccess({ statusCode: 200, body: bodyRespone }, callback)
    })
    .catch(function (error) {
      const errorResponse = {}
      if (error && error.statusCode) {
        errorResponse.statusCode = error.statusCode
      } else {
        errorResponse.statusCode = 404
      }

      if (error && error.message) {
        errorResponse.message = error.message
        errorResponse.stack = error.stack
      }

      return responseError(errorResponse, callback)
    })
}
