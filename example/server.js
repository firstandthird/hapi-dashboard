/* eslint no-console: 0 */

'use strict';

const Hapi = require('hapi');
const server = new Hapi.Server({
  debug: {
    request: ['*'],
    log: ['hapi-dashboard']
  }
});

server.connection({
  port: 8000,
});

const dashboardOptions = {
  favicon: 'http://placekitten.com/g/152/152',
  endpoint: '/',
  ttl: 10 * 1000,
  dashboards: {
    users: {
      name: 'Users',
      metrics: {
        adminUsers: {
          section: 'Admin',
          value(srv, done) {
            setTimeout(() => {
              done(null, {
                Name: 'Admin Users',
                Total: 12
              });
            }, 1000);
          }
        },
        normalUsers: {
          section: 'User',
          value(srv, done) {
            setTimeout(() => {
              done(null, {
                Name: 'Normal Users',
                Total: 2734
              });
            }, 30);
          }
        },
        bannedUsers: {
          section: 'User',
          value(srv, done) {
            setTimeout(() => {
              done(null, {
                Name: 'Banned Users',
                Total: 1
              });
            }, 70);
          }
        }
      }
    },
    performance: {
      name: 'Performance',
      metrics: {
        pageViews: {
          value(srv, done) {
            setTimeout(() => {
              done(null, {
                name: 'Page Views',
                Total: 87643245
              });
            }, 40);
          },
          ttl: 0
        },
        bounceRate: {
          value(srv, done) {
            setTimeout(() => {
              done(null, {
                name: 'Bounce Rate',
                Total: '99%'
              });
            }, 30);
          },
          ttl: 0
        }
      }
    },
    errors: {
      name: 'App Errors',
      metrics: {
        appErrors: {
          value(srv, done) {
            done(null, [
              {
                name: 'Internal Errors',
                value: 1234
              },
              {
                name: 'Email Errors',
                value: 1234
              }
            ]);
          }
        }
      }
    },
    randomdata: {
      name: 'Random Data',
      metrics: {
        something: {
          value(srv, done) {
            done(null, [
              {
                ' ': 'cat',
                before: '<img src="http://placekitten.com/g/200/300">',
                after: '<img src="http://placekitten.com/g/50/50">'
              },
              {
                ' ': 'meat',
                before: '<img src="http://baconmockup.com/300/200">',
                after: '<img src="http://baconmockup.com/50/50">'
              }
            ]);
          }
        }
      }
    },
    requeststuff: {
      name: 'Request Stuffs',
      metrics: {
        request: {
          value(srv, done) {
            done(null, [this.headers]);
          }
        }
      }
    },
    daily: {
      name: 'Daily',
      metrics: {
        daily: {
          value(srv, done) {
            done(null, [
              {
                name: 'Search',
                data: [
                  {
                    name: '01/05/15',
                    value: 3
                  },
                  {
                    name: '01/04/15',
                    value: 1
                  },
                  {
                    name: '01/03/15',
                    value: 18
                  },
                  {
                    name: '01/02/15',
                    value: 5
                  },
                  {
                    name: '01/01/15',
                    value: 1
                  },
                  {
                    name: '12/31/14',
                    value: 764
                  }
                ]
              }
            ]);
          }
        }
      }
    }
  },
};

server.register([
  require('vision'),
  {
    register: require('../'),
    options: dashboardOptions
  }
], err => {
  if (err) {
    console.error(err);
  }

  server.start(() => {
    console.log('Server started at:', server.info.uri);
  });
});
