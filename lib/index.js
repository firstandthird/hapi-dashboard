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
    auth: false
  }, options);

  options.trimmedEndpoint = options.endpoint;
  if(options.endpoint === '/') {
    options.trimmedEndpoint = '';
  }

  plugin.method('getMetrics', function(item, next) {
    var metrics = Object.keys(item.metrics).map(function (key) {
      return item.metrics[key];
    });

    async.mapLimit(metrics, options.concurrent, plugin.methods.processData, function(err, data) {
      next(err, data);
    });
  });
  
  plugin.method('processData', function(metric, next) {
    metric.value(plugin, function(err, data) {
      metric.data = data;
      next(null, metric, metric.ttl || options.ttl);
    });
  }, {
    cache: {
      expiresIn: options.ttl
    },
    generateKey: function(metric) {
      return metric.value.toString() + metric.ttl;
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
    partialsPath: path.resolve(__dirname, '../views/partials')
  });

  var dashboardConf = {
    auth: {
      strategy: options.auth,
      mode: 'required'
    },
    validate: {
      params: {
        name: Joi.string().required()
      }
    },
    handler: handler.dashboard
  };

  plugin.route([
    { path: options.endpoint, method: 'GET', config: {
        auth: {
          strategy: options.auth,
          mode: 'required'
        },
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
