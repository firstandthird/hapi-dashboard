'use strict';

const handler = require('./handler');
const Hoek = require('hoek');
const Handlebars = require('handlebars');
const async = require('async');
const path = require('path');
const Joi = require('joi');

module.exports = function(plugin, options, next) {
  options = Hoek.applyToDefaults({
    ttl: undefined,
    concurrent: 10,
    endpoint: '/dashboard',
    auth: null
  }, options);

  options.trimmedEndpoint = options.endpoint;
  if (options.endpoint === '/') {
    options.trimmedEndpoint = '';
  }

  plugin.method('getMetrics', (request, item, done) => {
    const metrics = Object.keys(item.metrics).map(key => {
      const metric = item.metrics[key];
      metric.key = key;
      return metric;
    });

    async.mapLimit(metrics, options.concurrent, (metric, allDone) => {
      plugin.methods.processData(request, metric, allDone);
    }, (err, data) => {
      done(err, data);
    });
  });

  plugin.method('processData', (request, metric, done) => {
    metric.value.call(request, plugin, (err, data) => {
      plugin.log(['hapi-dashboard'], { message: `fetched data for ${metric.key}`, key: metric.key });
      metric.data = data;
      done(null, metric, metric.ttl || options.ttl);
    });
  }, {
    cache: {
      expiresIn: options.ttl,
      generateTimeout: 30 * 1000
    },
    generateKey(request, metric) {
      return metric.key;
    },
  });

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
    handler: handler.dashboard
  };

  plugin.route([
    {
      path: options.endpoint,
      method: 'GET',
      config: {
        auth: authConfig,
        handler: handler.dashboards
      }
    },
    { path: `${options.trimmedEndpoint}/{name}`, method: 'GET', config: dashboardConf },
    { path: `${options.trimmedEndpoint}/{name}.csv`, method: 'GET', config: dashboardConf },
    { path: `${options.trimmedEndpoint}/{name}.json`, method: 'GET', config: dashboardConf }
  ]);

  next();
};

module.exports.attributes = {
  name: 'hapi-dashboard',
  pkg: require('../package.json')
};
