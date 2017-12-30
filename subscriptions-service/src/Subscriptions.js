'use strict'

const subscriptionsRepository = require('./SubscriptionsRepo')
const webpush = require('web-push')
const Logger = require('./Logger')

const logger = new Logger('Subscriptions')

class Subscriptions {
  constructor () {
    const vapidKeys = {
      publicKey: process.env.WEB_PUSH_PUBKEY,
      privateKey: process.env.WEB_PUSH_PRVKEY
    }

    webpush.setVapidDetails(
      'mailto:noreply@example.com',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    )
  }

  /**
   *
   * @param {*} data
   */
  isValid (data) {
    // A valid subscription object should at least has a URL endpoint defined
    const subscriptionObject = data && data.subscription
    if (
      !subscriptionObject ||
      !subscriptionObject.endpoint ||
      !subscriptionObject.endpoint.length ||
      !subscriptionObject.keys ||
      !data.sub_id ||
      !data.nonce ||
      typeof subscriptionObject.endpoint !== 'string'
    ) {
      return Promise.reject(new Error('Invalid subscription object'))
    }

    return Promise.resolve(true)
  }

  create (data) {
    const sub = {
      subscription: {
        endpoint: String(data.subscription.endpoint),
        keys: data.subscription.keys
      },
      sub_id: String(data.sub_id),
      nonce: String(data.nonce)
    }

    return subscriptionsRepository.updateSubscription(sub)
  }

  confirmSubscription (data) {
    const sub = {
      token: String(data.token),
      sub_id: String(data.sub_id),
      nonce: String(data.nonce),
      status: 'new'
    }

    return this.getPendingApproval(sub)
      .then(subscriptionItem => {
        if (subscriptionItem.id && subscriptionItem.valid === true) {
          return subscriptionsRepository.confirmSubscription(subscriptionItem)
        } else {
          throw new Error('Invalid confirmation request')
        }
      })
      .then(resultSet => {
        // don't return the subcription object
        return true
      })
  }

  getPendingApproval (data) {
    if (!data || !data.token || !data.sub_id || !data.nonce || !data.status) {
      throw new Error('bad request')
    }

    logger.info(data)
    return subscriptionsRepository.getPendingApproval(data).then(resultSet => {
      logger.info(resultSet)

      if (!resultSet) {
        throw new Error('Malformed query response')
      }

      if (resultSet && resultSet.Count === 0) {
        throw new Error('Subscription not found')
      }

      if (resultSet.Items[0].token !== data.token) {
        throw new Error('Subscription not found')
      }

      const subscriptionItem = resultSet.Items[0]
      subscriptionItem.sub_id = subscriptionItem.id

      return this.isValid(subscriptionItem)
        .catch(err => {
          throw new Error('Subscription not found')
        })
        .then(() => {
          return {
            id: subscriptionItem.id,
            valid: true
          }
        })
    })
  }

  getByToken (token) {
    if (!token) {
      throw new Error('no token found in request')
    }

    return subscriptionsRepository
      .getByToken(token, { approved: true })
      .then(subscription => {
        if (subscription && subscription.Count === 0) {
          throw new Error('No subscription found for token')
        }

        const sub = subscription.Items[0]
        logger.info(sub)

        return {
          id: sub.id,
          status: sub.status,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt
        }
      })
  }

  updateSubscriptionNotified (sub) {
    return subscriptionsRepository.setSubscriptionNotified(sub)
  }

  triggerPushMsg (subscription) {
    return webpush.sendNotification(subscription)
  }

  triggerSubscriptionNotification (token) {
    if (!token) {
      throw new Error('no token found in request')
    }

    return subscriptionsRepository
      .getByToken(token, { approved: true })
      .then(subscription => {
        logger.info('retrieved subscription by token')
        logger.info(subscription)

        if (subscription && subscription.Count === 0) {
          throw new Error('No subscription found for token')
        }

        // @FIXME this checks the subscription object wrapper from dynamodb
        // and not the actual object from the db
        // @FIXME also consider if we actually want to limit it? or just
        // to have a flag whether it was ever notified or not
        if (
          subscription &&
          subscription.notified &&
          subscription.notified === true
        ) {
          throw new Error('Subscription token already notified')
        }

        try {
          const sub = subscription.Items[0]

          if (!sub.subscription.endpoint) {
            throw new Error('Malformed subscription object')
          }

          return sub
        } catch (error) {
          const err = new Error('Malformed subscription object')
          err.statusCode = 500
          throw err
        }
      })
      .then(sub => {
        logger.info('triggering push notification for subscription:')
        logger.info(sub)
        return this.triggerPushMsg(sub.subscription).then(function () {
          return sub
        })
        // @TODO might want to specifically handle an error
        // with triggering a push message
        //
        // .catch((error) => {
        //   return this.updateSubscriptionNotified(sub)
        //     .then(function() {
        //       throw error;
        //     });
        // })
      })
      .then(sub => {
        logger.info('update subscription notification as notified')
        return this.updateSubscriptionNotified(sub)
      })
  }
}

module.exports = Subscriptions
