var handler = require('./handler');
var Hoek = require('hoek');
var Handlebars = require('handlebars');
var async = require('async');
var path = require('path');

module.exports = function(plugin, options, next) {

  options = Hoek.applyToDefaults({
    ttl: 0,
    concurrent: 10,
    endpoint: '/dashboard'
  }, options);

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
      return metric.name;
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

  plugin.route([
    { path: options.endpoint, method: 'GET', config: handler.dashboards },
    { path: options.endpoint + '/{name}', method: 'GET', config: handler.dashboard }
  ]);
  next();
};

module.exports.attributes = {
  name: 'hapi-dashboard',
  pkg: require('../package.json')
};
