'use strict'

const Subscriptions = require('./src/Subscriptions')
const { responseError, responseSuccess } = require('./src/helpers')
const Logger = require('./src/Logger')

module.exports.saveSubscription = (event, context, callback) => {
  const logger = new Logger('saveSubscription')
  const subscription = new Subscriptions()

  let requestBody
  try {
    requestBody = JSON.parse(event.body)
  } catch (error) {
    return responseError({ statusCode: 400, message: error.message }, callback)
  }

  return Promise.resolve()
    .then(function () {
      logger.info('checking subscription object validity')
      logger.info(requestBody)
      return subscription.isValid(requestBody)
    })
    .catch(function (error) {
      throw {
        statusCode: 422,
        message: error ? error.message : ''
      }
    })
    .then(function () {
      logger.info('creating a subscription from this request payload')
      return subscription.create(requestBody)
    })
    .catch(function (error) {
      logger.info('create subscription error')
      logger.info(error)
      if (error && error.statusCode) {
        throw error
      }

      throw {
        statusCode: 500,
        message: error ? error.message : '',
        stack: error ? error.stack : null
      }
    })
    .then(function (result) {
      const bodyRespone = {
        data: {
          success: true
        }
      }

      return responseSuccess({ statusCode: 201, body: bodyRespone }, callback)
    })
    .catch(function (error) {
      const errorResponse = {}
      if (error && error.statusCode) {
        errorResponse.statusCode = error.statusCode
      }

      if (error && error.message) {
        errorResponse.message = error.message
        errorResponse.stack = error.stack
      }

      return responseError(errorResponse, callback)
    })
}

module.exports.getSubscriptions = (event, context, callback) => {
  const logger = new Logger('getSubscriptions')
  const subscription = new Subscriptions()

  const token = event.headers['Authorization'] || event.headers['authorization']
  return Promise.resolve()
    .then(function () {
      return subscription.getByToken(token)
    })
    .then(function (result) {
      const bodyRespone = {
        data: {
          success: true
        }
      }

      return responseSuccess({ statusCode: 200, body: result }, callback)
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

module.exports.triggerSubscriptionByToken = (event, context, callback) => {
  const logger = new Logger('triggerSubscriptionByToken')
  const subscription = new Subscriptions()

  const token = event.headers['Authorization'] || event.headers['authorization']

  return Promise.resolve()
    .then(function () {
      logger.info('triggering subscription notification for request')
      logger.info(token)
      return subscription.triggerSubscriptionNotification(token)
    })
    .then(function (result) {
      logger.info('notification service result')
      logger.info(result)
      return result
    })
    .then(function (result) {
      const bodyRespone = {
        data: {
          success: true
        }
      }

      return responseSuccess({ statusCode: 201, body: result }, callback)
    })
    .catch(function (error) {
      const errorResponse = {}
      if (error && error.statusCode) {
        errorResponse.statusCode = error.statusCode
      }

      if (error && error.message) {
        errorResponse.message = error.message
        errorResponse.stack = error.stack
      }

      return responseError(errorResponse, callback)
    })
}
