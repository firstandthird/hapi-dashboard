hapi-dashboard
==============

Hapi plugin for displaying metrics on a dashboard


## Installation

`npm install --save hapi-dashboard`

## Usage

```js
server.pack.register([
  { plugin: require('hapi-upload-s3'), options: {
    //defaults shown below
    endpoint: '/dashboard'
    dashboards: [],
    ttl: 60*1000 //time to cache responses. 60 seconds
  }}
], function(err) {
});
```

## Dashboards Array

Dashboards array should look something like this:

```js
[
  { 
    name: 'Dashboard 1',
    metrics: [
      function(server, done) {
        //perform some async call
        server.plugins.db.metrics.loggedInCount(function(err, result) {
          done(null, {
            name: 'Number of times a user logged in'
            total: result.total
          });
        }
      }
    ]
  }
]
```
