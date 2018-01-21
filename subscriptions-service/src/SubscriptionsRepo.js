'use strict'

const uuid = require('uuid')
const AWS = require('aws-sdk')
const Logger = require('./Logger')()

// SLS explicitly sets this on local invocation
// so we can use it as a flag for working with
// a local dynamodb instance
if (process.env.IS_LOCAL) {
  AWS.config.update({
    region: 'us-east-1',
    endpoint: 'http://localhost:4569'
  })
}

const db = new AWS.DynamoDB.DocumentClient()
const tableName = process.env['DYNAMODB_TABLE'] || 'subscriptions'

const STATUS = {
  NEW: 'new',
  APPROVED: 'approved'
}

class SubscriptionsRepo {
  /**
   * user's token sign-up to reserve a subscription object
   */
  static reserveSubscription (token) {
    const id = uuid.v1()
    const nonce = uuid.v4()

    const params = {
      TableName: tableName,
      Item: {
        id: id,
        nonce: nonce,
        token: token,
        status: STATUS.NEW,
        id_nonce_status: `${id}#${nonce}#${STATUS.NEW}`,
        createdAt: new Date().toISOString()
      }
    }
    return db.put(params).promise().then(() => params.Item)
  }

  static getByToken (token, options) {
    const params = {
      TableName: tableName,
      IndexName: 'token',
      ExpressionAttributeNames: {
        '#token': 'token'
      },
      ExpressionAttributeValues: {
        ':token': token
      },
      KeyConditionExpression: '#token = :token',
      ScanIndexForward: false,
      Limit: 1
    }

    if (options && options.approved === true) {
      params.ExpressionAttributeNames['#status'] = 'status'
      params.ExpressionAttributeValues[':status'] = STATUS.APPROVED
      params.KeyConditionExpression = '#token = :token AND #status = :status'
    }

    return db.query(params).promise()
  }

  static getPendingApproval (data) {
    const params = {
      TableName: tableName,
      IndexName: 'id_nonce_status',
      ExpressionAttributeNames: {
        '#id_nonce_status': 'id_nonce_status'
      },
      ExpressionAttributeValues: {
        ':id_nonce_status': `${data.sub_id}#${data.nonce}#${STATUS.NEW}`
      },
      KeyConditionExpression: '#id_nonce_status = :id_nonce_status'
    }

    return db.query(params).promise()
  }

  static getNew (id) {
    const params = {
      Key: {
        id: id
      },
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'new'
      },
      KeyConditionExpression: '#status = :status',
      TableName: tableName,
      ScanIndexForward: false,
      Limit: 1
    }
    return db.query(params).promise()
  }

  /**
   * saves a browser's push notification subscription
   *
   * first we query the table to see if the subscription request is valid
   * based on its generated subscription id and nonce
   * and then we update it
   *
   * @param {*} subscriptionRequest
   */
  static updateSubscription (subscriptionRequest) {
    const params = {
      TableName: tableName,
      IndexName: 'id_nonce_status',
      ExpressionAttributeNames: {
        '#id_nonce_status': 'id_nonce_status'
      },
      ExpressionAttributeValues: {
        ':id_nonce_status': `${subscriptionRequest.sub_id}#${subscriptionRequest.nonce}#${STATUS.NEW}`
      },
      KeyConditionExpression: '#id_nonce_status = :id_nonce_status'
    }

    return db
      .query(params)
      .promise()
      .then(resultSet => {
        if (!resultSet) {
          throw new Error('Malformed query response')
        }

        if (resultSet && resultSet.Count === 0) {
          throw new Error('Invalid subscription request')
        }

        return resultSet.Items[0]
      })
      .then(subscriptionItem => {
        const params = {
          TableName: tableName,
          Key: {
            id: subscriptionItem.id
          },
          ExpressionAttributeNames: {
            '#subscription': 'subscription'
          },
          ExpressionAttributeValues: {
            ':subscription': subscriptionRequest.subscription,
            ':updatedAt': new Date().toISOString()
          },
          UpdateExpression: 'SET #subscription = :subscription, updatedAt = :updatedAt',
          ReturnValues: 'ALL_NEW'
        }

        return db.update(params).promise()
      })
  }

  /**
   * let a token confirm its subscription is ready to be used
   *
   * @param {*} subscription
   */
  static confirmSubscription (subscription) {
    const params = {
      TableName: tableName,
      Key: {
        id: subscription.id
      },
      ExpressionAttributeNames: {
        '#status': 'status',
        '#id_nonce_status': 'id_nonce_status'
      },
      ExpressionAttributeValues: {
        ':id_nonce_status': `${subscription.sub_id}#${subscription.nonce}#${STATUS.APPROVED}`,
        ':status': STATUS.APPROVED,
        ':updatedAt': new Date().toISOString()
      },
      UpdateExpression: 'SET #status = :status, #id_nonce_status = :id_nonce_status, updatedAt = :updatedAt',
      ReturnValues: 'ALL_NEW'
    }

    return db.update(params).promise()
  }

  static setSubscriptionNotified (subscription) {
    const params = {
      TableName: tableName,
      Key: {
        id: subscription.id
      },
      ExpressionAttributeNames: {
        '#notified': 'notified'
      },
      ExpressionAttributeValues: {
        ':notified': true,
        ':updatedAt': new Date().toISOString()
      },
      UpdateExpression: 'SET #notified = :notified, updatedAt = :updatedAt',
      ReturnValues: 'ALL_NEW'
    }

    return db.update(params).promise()
  }
}

module.exports = SubscriptionsRepo
