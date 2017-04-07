'use strict';

const Hoek = require('hoek');
const Joi = require('joi');
const Handlebars = require('handlebars');
const path = require('path');
const methodLoader = require('hapi-method-loader').methodLoader;
const listAllDashboardsRouteHandler = require('../routes/dashboards.js');
const showDashboardRouteHandler = require('../routes/dashboard.js');
const async = require('async');

module.exports = (plugin, initialOptions, next) => {
  async.autoInject({
    options(done) {
      if (typeof initialOptions.path === 'string') {
        initialOptions = require(initialOptions.path);
      }
      const options = Hoek.applyToDefaults({
        endpoint: '/dashboard',
        auth: null,
        concurrent: 10
      }, initialOptions);
      options.trimmedEndpoint = options.endpoint;
      if (options.endpoint === '/') {
        options.trimmedEndpoint = '';
      }
      plugin.expose('options', options);
      return done(null, options);
    },
    methods(options, done) {
      methodLoader(plugin, {
        verbose: false,
        path: `${__dirname}/../methods`,
      }, done);
    },
    pluginBindings(options, methods, done) {
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
      return done();
    },
    authConfig(options, pluginBindings, done) {
      let authConfig = null;
      if (options.auth !== null && options.auth !== false) {
        authConfig = {
          strategy: options.auth,
          mode: 'required'
        };
      } else if (options.auth === false) {
        authConfig = false;
      }
      return done(null, authConfig);
    },
    dashboardConf(options, authConfig, done) {
      return done(null, {
        auth: authConfig,
        validate: {
          params: {
            name: Joi.string().required()
          }
        },
        handler: showDashboardRouteHandler
      });
    },
    routes(authConfig, dashboardConf, options, done) {
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
      return done();
    }
  }, (err, results) => {
    if (err) {
      return next(err);
    }
    return next();
  });
};

module.exports.attributes = {
  name: 'hapi-dashboard',
  pkg: require('../package.json')
};
