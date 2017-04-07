'use strict';
const Hapi = require('hapi');
const path = require('path');
module.exports = (options, allDone) => {
  const server = new Hapi.Server({
    debug: {
      request: ['*'],
      log: ['hapi-dashboard']
    }
  });
  server.connection({ port: 8080 });
  server.register([
    require('vision'),
    {
      register: require('../'),
      options: {
        path: path.join(__dirname, 'dashboardOptions.js')
      }
    }
  ], () => {
    server.start((err) => allDone(err, server));
  });
};
