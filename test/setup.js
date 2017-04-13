'use strict';
const Hapi = require('hapi');
const path = require('path');
module.exports = (passedOptions, allDone) => {
  const server = new Hapi.Server({
    debug: {
      request: ['*'],
      log: ['hapi-dashboard']
    }
  });
  server.connection({ port: 8080 });
  const options = Object.keys(passedOptions).length > 0 ? passedOptions : { path: path.join(__dirname, 'dashboardOptions.js') };
  server.register([
    require('vision'),
    {
      register: require('../'),
      options
    }
  ], () => {
    server.start((err) => allDone(err, server));
  });
};
