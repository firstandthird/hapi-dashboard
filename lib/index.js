var handler = require('./handler');
var Hoek = require('hoek');
var Handlebars = require('handlebars');
var async = require('async');
var path = require('path');
var Joi = require('joi');

module.exports = function(plugin, options, next) {

  options = Hoek.applyToDefaults({
    ttl: undefined,
    concurrent: 10,
    endpoint: '/dashboard',
    auth: null
  }, options);

  options.trimmedEndpoint = options.endpoint;
  if(options.endpoint === '/') {
    options.trimmedEndpoint = '';
  }

  plugin.method('getMetrics', function(request, item, next) {
    var metrics = Object.keys(item.metrics).map(function (key) {
      var metric = item.metrics[key];
      metric.key = key;
      return metric;
    });

    async.mapLimit(metrics, options.concurrent, function(metric, next) {
      plugin.methods.processData(request, metric, next);
    }, function(err, data) {
      next(err, data);
    });
  });
  
  plugin.method('processData', function(request, metric,  next) {
    metric.value.call(request, plugin, function(err, data) {
      plugin.log(['hapi-dashboard'], { message: 'fetched data for '+metric.key, key: metric.key });
      metric.data = data;
      next(null, metric, metric.ttl || options.ttl);
    });
  }, {
    cache: {
      expiresIn: options.ttl
    },
    generateKey: function(request, metric) {
      return metric.key;
    }
  });

  plugin.bind({
    options: options,
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

  var authConfig = null;
  if (options.auth !== null && options.auth !== false) {
    authConfig = {
      strategy: options.auth,
      mode: 'required'
    };
  } else if (options.auth === false) {
    authConfig = false;
  }

  var dashboardConf = {
    auth: authConfig,
    validate: {
      params: {
        name: Joi.string().required()
      }
    },
    handler: handler.dashboard
  };

  plugin.route([
    { path: options.endpoint, method: 'GET', config: {
        auth: authConfig,
        handler: handler.dashboards 
      }
    },
    { path: options.trimmedEndpoint + '/{name}', method: 'GET', config: dashboardConf},
    { path: options.trimmedEndpoint + '/{name}.csv', method: 'GET', config: dashboardConf },
    { path: options.trimmedEndpoint + '/{name}.json', method: 'GET', config: dashboardConf }
  ]);

  next();
};

module.exports.attributes = {
  name: 'hapi-dashboard',
  pkg: require('../package.json')
};
