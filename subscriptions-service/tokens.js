'use strict'

const httpStatus = require('statuses')

const Logger = require('./src/Logger')({
  token: process.env.LOG_TOKEN,
  subdomain: process.env.LOG_SUBDOMAIN,
  tags: ['bazz']
})
const Token = require('./src/Tokens')
const {responseError, responseSuccess} = require('./src/helpers')

module.exports.createToken = (event, context, callback) => {
  Logger.extendWithMeta({
    meta: {
      event,
      context
    }
  })

  const token = new Token()

  return token
    .create()
    .then(function(result) {
      Logger.log.debug(result)

      const bodyRespone = {
        data: {
          sub_id: result.id,
          token: result.token,
          nonce: result.nonce
        }
      }

      return responseSuccess({body: bodyRespone}, callback)
    })
    .catch(function(error) {
      return responseError(error, callback)
    })
}
