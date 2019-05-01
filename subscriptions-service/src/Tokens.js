'use strict'

const crypto = require('crypto')
const ApiError = require('boom')

const subscriptionsRepository = require('./SubscriptionsRepo')
const LoggerService = require('./Logger')
const Logger = new LoggerService()

class Token {
  constructor() {
    this.tokenBytes = 48
  }

  create() {
    Logger.log.info('generating api token:')

    return this.generateApiToken()
      .then(token => {
        // check if a subscription by this token exists already
        // if it does, we abort, otherwise providing back the token
        return subscriptionsRepository.getByToken(token).then(subscription => {
          return {
            token,
            subscription
          }
        })
      })
      .then(data => {
        if (!data || !data.subscription || !data.token) {
          throw new ApiError.notImplemented('Unable to create token')
        }

        if (data.subscription && data.subscription.Count === 0) {
          return subscriptionsRepository.reserveSubscription(data.token)
        } else {
          throw new ApiError.conflict('Token already exists')
        }
      })
  }

  generateApiToken() {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(this.tokenBytes, (err, buffer) => {
        if (err) {
          return reject(err)
        }

        return resolve(buffer.toString('hex'))
      })
    })
  }
}

module.exports = Token
