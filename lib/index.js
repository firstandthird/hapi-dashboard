'use strict';

const Hoek = require('hoek');
const Handlebars = require('handlebars');
const path = require('path');
const methodLoader = require('hapi-method-loader').methodLoader;
const routeLoader = require('hapi-route-loader').routeLoader;

module.exports = function(plugin, options, next) {
  options = Hoek.applyToDefaults({
    endpoint: '/dashboard',
    auth: null,
    concurrent: 10
  }, options);

  options.trimmedEndpoint = options.endpoint;
  if (options.endpoint === '/') {
    options.trimmedEndpoint = '';
  }

  methodLoader(plugin, {
    verbose: true,
    path: `${__dirname}/../methods`,
  },
  () => {
    plugin.bind({
      options,
      Hapi: plugin.hapi,
      getMetrics: plugin.methods.getMetrics
    });
    plugin.views({
      engines: {
        html: {
          module: Handlebars.create()
        }
      },
      path: path.resolve(__dirname, '../views'),
      partialsPath: path.resolve(__dirname, '../views/partials'),
      helpersPath: path.resolve(__dirname, '../views/helpers')
    });
    routeLoader(plugin, {
      verbose: true,
      base: options.endpoint,
      path: `${__dirname}/../routes`,
    }, (err) => {
      if (err) {
        return next(err);
      }
      next();
    });
  });
};
// if (options.auth !== null && options.auth !== false) {
//   authConfig = {
//     strategy: options.auth,
//     mode: 'required'
//   };
// } else if (options.auth === false) {
//   authConfig = false;
// }
/*
    config: {
      auth: authConfig,
  },
]);
*/

module.exports.attributes = {
  name: 'hapi-dashboard',
  pkg: require('../package.json')
};
