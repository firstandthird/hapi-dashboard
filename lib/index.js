var handler = require('./handler');
var Hoek = require('hoek');
var Handlebars = require('handlebars');
var async = require('async');
var path = require('path');
var crypto = require('crypto');

module.exports = function(plugin, options, next) {

  options = Hoek.applyToDefaults({
    ttl: 0,
    concurrent: 10,
    endpoint: '/dashboard',
    password: 'password'
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
      return metric.value.toString() + metric.ttl;
    }
  });

  var isLoggedIn = function(request) {
    if(request.state['hapi-dashboard'] === crypto.createHash('md5').update(options.password).digest('hex')) {
      return true;
    }

    if(request.query.auth === options.password) {
      return true;
    }

    return false;
  };

  plugin.bind({
    options: options,
    Hapi: plugin.hapi,
    getMetrics: plugin.methods.getMetrics,
    isLoggedIn: isLoggedIn
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
    { path: options.endpoint + '/{name}', method: 'GET', config: handler.dashboard },
    { path: options.endpoint + '/{name}.csv', method: 'GET', config: handler.dashboard },
    { path: options.endpoint + '/{name}.json', method: 'GET', config: handler.dashboard },
    { path: options.endpoint + '/login', method: ['GET', 'POST'], config: handler.login },
    { path: options.endpoint + '/logout', method: ['GET'], config: handler.logout }
  ]);

  plugin.ext('onPreResponse', function(request, reply) {
    var response = request.response;
    if (response.variety === 'view') {
      if (options.cssFiles) {
        response.source.context.cssFiles = options.cssFiles;
      }

      if (options.jsFiles) {
        response.source.context.jsFiles = options.jsFiles;
      }

      if (options.favicon) {
        response.source.context.favicon = options.favicon;
      }

      response.source.context.endpoint = options.endpoint;
    }
    reply();
  });
  next();
};

module.exports.attributes = {
  name: 'hapi-dashboard',
  pkg: require('../package.json')
};
