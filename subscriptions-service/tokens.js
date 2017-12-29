'use strict'

const Token = require('./src/Tokens')
const { responseError, responseSuccess } = require('./src/helpers')

module.exports.createToken = (event, context, callback) => {
  const token = new Token()

  return token
    .create()
    .then(function (result) {
      const bodyRespone = {
        data: {
          token: result
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
