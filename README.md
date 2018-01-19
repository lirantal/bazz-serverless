# Pre-requisites

Node.js, yarn, and the serverless framework.

```bash
yarn global add serverless
```

# Project Overview

Lambda functions are spread through two project services: Subscriptions and Tokens, each with their own directory and its own serverless.yml configuration:

```
|
|-subscriptions-service
|-tokens-service
```

Each service directory in turn, occupy its own functions.

# Configuration

## Serverless framework

serverless can be used to work with its own aws credentials so it doesn't need to run with your own root user's API keys.
This is a best practice and should be followed.

Configuring credentials for serverless:

```bash
$ sls config credentials --provider aws --key xxxxxxxxxxxxxx --secret xxxxxxxxxxxxxx --profile serverless-cli
```

This is nice, but it just adds an entry to the ~/.aws/credentials file. To actually let your .serveless project know which profile to use you need to specify it in the provider directive on serverless.yml or it will take the default.

Edit `.serverless` and add an appropriate profile entry as follows:

```
	service: new-service
	provider:
	  name: aws
	  runtime: nodejs6.10
	  stage: dev
	  profile: serverless-cli
```

## Serverless function configuration

Each service in the project has it's own directory, and own functions configuration in a `serverless.yml` file.

## Project configuration

The functions in `subscriptions-service` require the web push public/private key pairs available as environment variables `WEB_PUSH_PUBKEY` and `WEB_PUSH_PRVKEY`.

The serverless configuration deploys them to aws based on the JSON file contents in `config.dev.json` which shouldn't be committed to git as it includes your web push secrets identity.

An example `config.dev.json` file contents:

```json
{
  "vapidKeys": {
    "publicKey": "xxxxxxxxxx",
    "privateKey": "xxxxxxxxxx"
  }
}
```

*The keys can be generated using the `web-push` npm package: `web-push generate-vapid-keys --json`


# Deploying Lambdas

## Deploy Everything

to deploy an entire serverless configuration with all the setup cd into one of the functions and run the following:

```bash
$ cd tokens-service
$ sls deploy —verbose
```

## Deploy Functions

To only deploy and update a specific function's implementation run the following:

```bash
$ cd subscriptions-service
$ sls deploy function --function saveSubscription
$ sls deploy function --function triggerSubscriptionByToken
```

# Local Development

Bazz uses a DynamoDB for persistency, so for any of the functions to work, it needs a database. This is accommodated using the localstack project.

Manual tests are run by invoking individual functions using the serverless framework.

## localstack setup for DynamoDB

[localstack](https://github.com/localstack/localstack) is used as an all-in-one project to simulate and mock many of AWS services in a local docker-based environment.

### Install

Python is required:

```bash
$ pip install localstack
```

### Run localstack

We'll run the docker-based localstack version:

```bash
$ localstack start --docker
```

This will download an image with all the required software running inside it. We can test running it with some aws commands that point to the local aws infra:

```bash
$ aws --endpoint-url=http://localhost:4572 s3 ls
```

## Migrate DynamoDB schema

Once localstack is up and able to serve DynamoDB requests, its required to migrate the bazz schema to create tables and indexes:

```bash
$ cd subscriptions-service
$ sls dynamodb migrate
```

# Testing

## invoking a function

```bash
$ sls invoke local --function <function-name>
```

## invoking a function with a payload

Provide the function with a data payload from a json file that is passed as the `event`:

```bash
$ sls invoke local --function <function-name> --path <input.json>
```

where `input.json` looks as follows: (https://serverless.com/framework/docs/providers/aws/cli-reference/invoke-local/)

```json
{
  "resource": "/",
  "path": "/",
  "httpMethod": "GET",
  "body": "{\"subscription\":{\"endpoint\":\"http://www.example.com\",\"auth_keys\":\"123\"},\"token\":\"abc-def\"}"
}
```

or provide it with data input on the command line:

```bash
$ sls invoke local --function <function-name> —-data <data input>
```

## invoking a function with a context

```bash
$ sls invoke local --function functionName --context "hello world"
```

## Debugging SLS CLI

The `sls` CLI implements a debug capability similar to NODE_DEBUG conventions.
To print out all debug information when `sls` is invokved prefix every command execution with `SLS_DEBUG=*`


## Examples

### Plain function invocation

Invoke the `createToken` function, without needing to pass any data or context:

```bash
$ cd subscriptions-service
$ sls invoke local --function createToken
```

### Data-payload function invocation

Invoke the `saveSubscription` function, which expects a valid subscription object in the request body, so we pass in a `--path` argument for a json file that represents the `event` object in the lambda:

```bash
$ cd subscriptions-service
$ SLS_DEBUG=* sls invoke local --function saveSubscription --path __tests__/__fixtures__/saveSubscriptionData.json
```

```bash
$ cd subscriptions-service
$ SLS_DEBUG=* sls invoke local --function triggerSubscriptionByToken --path __tests__/__fixtures__/triggerNotificationData.json
```

```bash
$ cd subscriptions-service
$ SLS_DEBUG=* sls invoke local --function getSubscriptions --path __tests__/__fixtures__/getSubscriptionsByToken.json
```


# Related

[bazz-frontend](https://github.com/lirantal/bazz-frontend) - the frontend project
[bazz](https://github.com/lirantal/bazz) - the Node.js CLI app

# Author
Liran Tal <liran.tal@gmail.com>
