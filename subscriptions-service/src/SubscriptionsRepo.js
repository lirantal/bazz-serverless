'use strict'

const uuid = require('uuid')
const AWS = require('aws-sdk')
// @TODO
// use specific configuration to test locally:
// AWS.config.update({
//   region: 'us-east-1',
//   endpoint: 'http://localhost:4569'
// })

const db = new AWS.DynamoDB.DocumentClient()
const tableName = process.env['DYNAMODB_TABLE'] || 'subscriptions'

class SubscriptionsRepo {
  /**
   * saves a browser's push notification subscription
   * @param {object} subscription
   */
  static create (sub) {
    return db
      .put({
        TableName: tableName,
        Item: {
          id: uuid.v1(),
          subscription: sub.subscription,
          token: sub.token,
          createdAt: new Date().toISOString()
        }
      })
      .promise()
  }

  static getByToken (token) {
    const params = {
      ExpressionAttributeNames: {
        '#token': 'token'
      },
      ExpressionAttributeValues: {
        ':token': token
      },
      KeyConditionExpression: '#token = :token',
      TableName: tableName,
      IndexName: 'token',
      Limit: 1
    }
    return db.query(params).promise()
  }

  static update (subscription) {
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
