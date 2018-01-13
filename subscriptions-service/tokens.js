'use strict'

const httpStatus = require('statuses')

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

      return responseSuccess({ body: bodyRespone }, callback)
    })
    .catch(function (error) {
      return responseError(error, callback)
    })
}
