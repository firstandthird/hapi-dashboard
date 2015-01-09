var Hapi = require('hapi');
var port = process.env.PORT || 8080;
var server = new Hapi.Server(port, '0.0.0.0');
var fs = require('fs');

server.pack.register({
  plugin: require('hapi-password')
}, function() {
  server.auth.strategy('password', 'password', 'try', {
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
      endpoint: '/',
      dashboards: {
        'users': {
          name: 'Users',
          metrics: {
            adminUsers: {
              section: 'Admin',
              value: function(server, done) {
                setTimeout(function() {
                  done(null, {
                    Name: 'Admin Users',
                    Total: 12
                  });
                }, 40)
              }
            },
            normalUsers: {
              section: 'User',
              value: function(server, done) {
                setTimeout(function() {
                  done(null, {
                    Name: 'Normal Users',
                    Total: 2734
                  });
                }, 30);
              }
            },
            bannedUsers: {
              section: 'User',
              value: function(server, done) {
                setTimeout(function() {
                  done(null, {
                    Name: 'Banned Users',
                    Total: 1
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
                    Total: 87643245
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
                    Total: '99%'
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
        },
        'requeststuff': {
          name: 'Request Stuffs',
          metrics: {
            request: {
              value: function(server, done) {
                done(null, [this.headers]);
              }
            }
          }
        },
        'daily': {
          name: 'Daily',
          metrics: {
            daily: {
              value: function(server, done) {
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
    }
  }
], function(err) {
  if (err) {
    throw err;
  }

  // server.route([
  //   {
  //     method: 'GET',
  //     path: '/',
  //     handler: function(request, reply) {
  //       reply('/admin for dashboard')
  //     }
  //   }
  // ]);

  server.start(function() {
    console.log('Hapi server started @', server.info.uri);
  });
});
