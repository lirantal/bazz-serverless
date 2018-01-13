'use strict'

const httpStatus = require('statuses')
const ApiError = require('boom')

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
    throw new ApiError.badRequest('Missing or incorrect data')
  }

  logger.info(requestBody)

  return Promise.resolve()
    .then(function () {
      logger.info('creating a subscription from this request payload')
      return subscription.create(requestBody)
    })
    .then(function (result) {
      return responseSuccess({ statusCode: httpStatus['Created'] }, callback)
    })
    .catch(function (error) {
      return responseError(error, callback)
    })
}

module.exports.getSubscriptionsPending = (event, context, callback) => {
  const logger = new Logger('getSubscriptionsPending')
  const subscription = new Subscriptions()

  let data = {}
  try {
    data = {
      token: event.headers['Authorization'] || event.headers['authorization'],
      sub_id: event.queryStringParameters['sub_id'],
      nonce: event.queryStringParameters['nonce']
    }
  } catch (error) {
    throw new ApiError.badRequest('Missing or incorrect data')
  }

  return Promise.resolve()
    .then(function () {
      return subscription.getPendingApproval(data)
    })
    .then(function (subscriptionItem) {
      const bodyRespone = {
        data: subscriptionItem
      }

      return responseSuccess({ body: bodyRespone }, callback)
    })
    .catch(function (error) {
      return responseError(error, callback)
    })
}

module.exports.confirmSubscription = (event, context, callback) => {
  const logger = new Logger('confirmSubscription')
  const subscription = new Subscriptions()

  let data = {}
  try {
    const requestBody = JSON.parse(event.body)
    data = {
      token: event.headers['Authorization'] || event.headers['authorization'],
      sub_id: event.pathParameters['id'],
      nonce: requestBody && requestBody.nonce ? requestBody.nonce : null
    }
  } catch (error) {
    throw new ApiError.badRequest('Missing or incorrect data')
  }

  return Promise.resolve()
    .then(function () {
      return subscription.confirmSubscription(data)
    })
    .then(function (subscriptionItem) {
      return responseSuccess(null, callback)
    })
    .catch(function (error) {
      return responseError(error, callback)
    })
}

module.exports.getSubscriptions = (event, context, callback) => {
  const logger = new Logger('getSubscriptions')
  const subscription = new Subscriptions()

  let token = ''
  try {
    token = event.headers['Authorization'] || event.headers['authorization']
  } catch (error) {
    throw new ApiError.unauthorized('No token found')
  }

  return Promise.resolve()
    .then(function () {
      return subscription.getByToken(token)
    })
    .then(function (result) {
      const bodyRespone = {
        data: result
      }

      return responseSuccess({ body: bodyRespone }, callback)
    })
    .catch(function (error) {
      return responseError(error, callback)
    })
}

module.exports.triggerSubscriptionByToken = (event, context, callback) => {
  const logger = new Logger('triggerSubscriptionByToken')
  const subscription = new Subscriptions()

  let token = ''
  try {
    token = event.headers['Authorization'] || event.headers['authorization']
  } catch (error) {
    throw new ApiError.unauthorized('No token found')
  }

  return Promise.resolve()
    .then(function () {
      logger.info('triggering subscription notification for request')
      logger.info(token)
      return subscription.triggerSubscriptionNotification(token)
    })
    .then(function (result) {
      logger.info('notification service result')
      logger.info(result)

      return responseSuccess({ statusCode: httpStatus['Created'] }, callback)
    })
    .catch(function (error) {
      return responseError(error, callback)
    })
}
