# policy

[![Build Status](https://travis-ci.org/h2atecnologia/node-policy.svg?branch=master)](https://travis-ci.org/h2atecnologia/node-policy)

Library for controlling access to resources with policy documents. Inspired by AWS IAM policies.

## Todo

Maybe:
- get rules (export to json)
- remove one rule / remove all rules

- Route-Specific Middlewares Support (Express, Fastify, Hyper-Express, Socket.IO)
- Redis backend support
- MongoDB backend support
- (...)

# Installation

```
npm install --save policy
```

In your source code use:
```
const Policy = require('policy');

// create an instance from Policy class
let policy1 = new Policy();

// create a instance from fromFile() static method
let policy2 = Policy.fromFile(...);

// create a instance from fromString() static method
let policy3 = Policy.fromString(...);

// append rules from instance policy into policy instance
polic1.append(policy3);
```

For example how to format policy document see [json example file](https://github.com/h2atecnologia/node-policy/blob/master/test/example.policy.json)

# Examples

```
let policy = new Policy();

policy.allow('customer', 'cars', 'buy');
policy.allow('seller', 'cars', ['buy','sell']);

policy.isAllowed('customer', 'cars', 'buy'); // true
policy.isAllowed('customer', 'cars', 'sell'); // false
policy.isAllowed('seller', 'cars', 'buy'); // true
policy.isAllowed('seller', 'cars', 'sell'); // true
policy.isAllowed('seller', 'cars', 'destroy'); // false
policy.isAllowed('seller', 'vans', 'buy'); // false

```

## Wildcards
You can also use wildcards:
```
let policy = new Policy();

policy.allow('a_*', ['b_*','d_*'], 'c_*');

policy.isAllowed('a_anything', 'b_anything', 'c_anything'); // true
policy.isAllowed('a_anything', 'c_anything', 'c_anything'); // false
policy.isAllowed('a_anything', 'd_anything', 'c_anything'); // true
```

## Deny
Some resources/actions can be denied. Denial has preference before allowance:
```
let policy = new Policy();

policy.allow('*', '*', '*');
policy.deny('guest', 'secret', '*');

policy.isAllowed('user', 'blah', 'read'); // true
policy.isAllowed('guest', 'blah', 'write'); // true
policy.isAllowed('guest', 'secret', 'any'); // false
```

## Conditions
You can also use conditions: More detais see: [JsonLogic](https://github.com/jwadhams/json-logic-js/):
```
let policy = new Policy();

let ageCondition = {
      'and': [
        { '>': [ { 'var': 'age' }, 5 ] },
        { '<': [ { 'var': 'age' }, 15 ] }
      ]
    };

policy.allow('*', '*', '*', ageCondition);

policy.isAllowed('user', 'blah', 'read'), { age: 6 }; // true
policy.isAllowed('guest', 'blah', 'write', { age: 16 }); // false
```

### It's (always) all about Javascript. (NodeJS too!)

#####*Yes! semicolon matters ... and I prefer single quotes*

