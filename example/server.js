var Hapi = require('hapi');
var port = process.env.PORT || 8080;
var server = new Hapi.Server(port, '0.0.0.0');
var fs = require('fs');

server.pack.register({
  plugin: require('hapi-password')
}, function() {
  server.auth.strategy('password', 'hapi-password', 'try', {
    password: 'password',
    cookieName: 'demo-login',
    loginRoute: '/auth'
  });
});

server.pack.register([
  {
    plugin: require('../'),
    options: {
      favicon: 'http://placekitten.com/g/152/152',
      endpoint: '/admin',
      auth: 'password',
      dashboards: {
        'users': {
          name: 'Users',
          metrics: {
            adminUsers: {
              value: function(server, done) {
                setTimeout(function() {
                  done(null, {
                    name: 'Admin Users',
                    value: 12
                  });
                }, 40)
              }
            },
            normalUsers: {
              value: function(server, done) {
                setTimeout(function() {
                  done(null, {
                    name: 'Normal Users',
                    value: 2734
                  });
                }, 30);
              }
            },
            bannedUsers: {
              value: function(server, done) {
                setTimeout(function() {
                  done(null, {
                    name: 'Banned Users',
                    value: 1
                  });
                }, 70);
              }
            }
          }
        },
        'performance': {
          name: 'Performance',
          metrics: {
            pageViews: {
              value: function(server, done) {
                setTimeout(function() {
                  done(null, {
                    name: 'Page Views',
                    value: 87643245
                  });
                }, 40);
              },
              ttl: 0
            },
            bounceRate: {
              value: function(server, done) {
                setTimeout(function() {
                  done(null, {
                    name: 'Bounce Rate',
                    value: '99%'
                  });
                }, 30);
              },
              ttl: 0
            }
          }
        },
        'errors': {
          name: 'App Errors',
          metrics: {
            appErrors: {
              value: function(server, done) {
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
        'randomdata': {
          name: 'Random Data',
          metrics: {
            something: {
              value: function(server, done) {
                done(null, [{
                  ' ': 'cat',
                  'before': '<img src="http://placekitten.com/g/200/300">',
                  'after': '<img src="http://placekitten.com/g/50/50">'
                },
                {
                  ' ': 'meat',
                  'before': '<img src="http://baconmockup.com/300/200">',
                  'after': '<img src="http://baconmockup.com/50/50">'
                }]);
              }
            }
          }
        }
      },
    }
  }
], function(err) {
  if (err) {
    throw err;
  }

  server.route([
    {
      method: 'GET',
      path: '/',
      handler: function(request, reply) {
        reply('/admin for dashboard')
      }
    }
  ]);

  server.start(function() {
    console.log('Hapi server started @', server.info.uri);
  });
});