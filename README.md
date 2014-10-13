hapi-dashboard
==============

Hapi plugin for displaying metrics on a dashboard


## Installation

`npm install --save hapi-dashboard`

## Usage

```js
server.pack.register([
  { plugin: require('hapi-dashboard'), options: {
    //defaults shown below
    endpoint: '/dashboard'
    dashboards: {},
    ttl: 60*1000, //time to cache responses. 60 seconds
    concurrent: 20, //max metrics to process at once
    password: 'something', //password used to access dashboards
	favicon: 'favicon.png' // Also used as home screen icon for ios
  }}
], function(err) {
});
```

## Dashboards Object

Dashboards object should look something like this:

```js
{
  'dashboard-1': {
    name: 'Dashboard 1',
    metrics: {
      loggedIn: {
        value: function(server, done) {
          //perform some async call
          server.plugins.db.metrics.loggedInCount(function(err, result) {
            done(null, {
            name: 'Number of times a user logged in',
            value: result.total
          });
          }
        },
        ttl: 60
      }
    }
  }
}
```
