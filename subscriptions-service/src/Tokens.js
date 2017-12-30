'use strict'

const crypto = require('crypto')
const Logger = require('./Logger')
const subscriptionsRepository = require('./SubscriptionsRepo')

const logger = new Logger({ name: 'Token' })

class Token {
  constructor () {
    // this.token = uuid()
  }

  create () {
    logger.info('generating api token:')

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
          return new Error('Unable to create token')
        }

        if (data.subscription && data.subscription.Count === 0) {
          return subscriptionsRepository.reserveSubscription(data.token)
        } else {
          throw new Error('Token already exists')
        }
      })
  }

  generateApiToken () {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(48, (err, buffer) => {
        if (err) {
          return reject(err)
        }

        return resolve(buffer.toString('hex'))
      })
    })
  }
}

module.exports = Token
