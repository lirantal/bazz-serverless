'use strict'
const Token = require('./src/Token')

module.exports.createToken = (event, context, callback) => {
  const token = new Token()
  const result = {
    data: {
      token: token.get()
    }
  }

  const response = {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' // Required for CORS support to work
    },
    body: JSON.stringify(result)
  }

  callback(null, response)
}
