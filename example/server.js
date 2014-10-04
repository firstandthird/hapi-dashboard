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
        'test-accounts': {
          name: 'Test accounts',
          metrics: function(server, done) {
            setTimeout(function() {
              done(null, [
                {
                  username: 'admin',
                  email: 'admin@example.com'
                },
                {
                  username: 'qatest',
                  email: 'qa@example.com'
                }
              ]);
            }, 40);
          }
        },
        'registered-users': {
          name: 'Registered Users',
          metrics: function(server, done) {
            setTimeout(function() {
              done(null, [
                {
                  name: 'John Connor',
                  age: 10,
                  gender: 'male'
                },
                {
                  name: 'Sarah Connor',
                  age: 29,
                  gender: 'female'
                },
                {
                  name: 'The Terminator',
                  age: 34,
                  gender: 'cyborg'
                }
              ]);
            }, 20);
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