'use strict';

const Hoek = require('hoek');
const Joi = require('joi');
const Handlebars = require('handlebars');
const path = require('path');
const methodLoader = require('hapi-method-loader').methodLoader;
const listAllDashboardsRouteHandler = require('./routes/dashboards.js');
const showDashboardRouteHandler = require('./routes/dashboard.js');

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
  plugin.expose('options', options);

  methodLoader(plugin, {
    verbose: false,
    path: `${__dirname}/methods`,
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
      path: path.resolve(__dirname, './views'),
      partialsPath: path.resolve(__dirname, './views/partials'),
      helpersPath: path.resolve(__dirname, './views/helpers')
    });

    let authConfig = null;
    if (options.auth !== null && options.auth !== false) {
      authConfig = {
        strategy: options.auth,
        mode: 'required'
      };
    } else if (options.auth === false) {
      authConfig = false;
    }
    const dashboardConf = {
      auth: authConfig,
      validate: {
        params: {
          name: Joi.string().required()
        }
      },
      handler: showDashboardRouteHandler
    };
    plugin.route([
      {
        path: options.endpoint,
        method: 'GET',
        config: {
          auth: authConfig,
          handler: listAllDashboardsRouteHandler
        }
      },
      { path: `${options.trimmedEndpoint}/{name}`, method: 'GET', config: dashboardConf },
      { path: `${options.trimmedEndpoint}/{name}.csv`, method: 'GET', config: dashboardConf },
      { path: `${options.trimmedEndpoint}/{name}.json`, method: 'GET', config: dashboardConf }
    ]);
    next();
  });
};

module.exports.attributes = {
  name: 'hapi-dashboard',
  pkg: require('./package.json')
};
