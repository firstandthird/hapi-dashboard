var Hapi = require('hapi');
var port = process.env.PORT || 8080;
var server = new Hapi.Server(port, '0.0.0.0');
var fs = require('fs');

server.pack.register([
  {
    plugin: require('../'),
    options: {
      endpoint: '/admin',
      dashboards: {
        'users': {
          name: 'Users',
          metrics: {
            adminUsers: {
              name: 'Admin Users',
              value: function(server, done) {
                setTimeout(function() {
                  done(null, 12);
                }, 40)
              }
            },
            normalUsers: {
              name: 'Normal Users',
              value: function(server, done) {
                setTimeout(function() {
                  done(null, 2734);
                }, 30);
              }
            },
            bannedUsers: {
              name: 'Banned Users',
              value: function(server, done) {
                setTimeout(function() {
                  done(null, 1);
                }, 70);
              }
            }
          }
        },
        'performance': {
          name: 'Performance',
          metrics: {
            pageViews: {
              name: 'Page Views',
              value: function(server, done) {
                setTimeout(function() {
                  done(null, 87643245);
                }, 40);
              },
              ttl: 0
            },
            bounceRate: {
              name: 'Bounce Rate',
              value: function(server, done) {
                setTimeout(function() {
                  done(null, '99%');
                }, 30);
              },
              ttl: 0
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

  server.start(function() {
    console.log('Hapi server started @', server.info.uri);
  });
});