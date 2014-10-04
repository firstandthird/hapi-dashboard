var handler = require('./handler');
var Hoek = require('hoek');
var Handlebars = require('handlebars');

module.exports = function(plugin, options, next) {

  options = Hoek.applyToDefaults({
    ttl: 0,
    concurrent: 10,
    endpoint: '/dashboard'
  }, options);
  
  plugin.method('processData', function(item, next) {
    if (typeof item.metrics === 'function') {
      item.metrics(plugin, function(err, data) {
        if (err) {
          return next(err);
        }

        item.data = data;
        next(null, item);
      });
    } else {
      // In case metrics is already processed
      item.data = item.metrics
      next(null, item);
    }
  }, {
    cache: {
      expiresIn: options.ttl
    },
    generateKey: function(item) {
      return item.name;
    }
  });

  plugin.bind({
    options: options,
    Hapi: plugin.hapi,
    processData: plugin.methods.processData
  });

  plugin.views({
    engines: {
      html: {
        module: Handlebars.create()
      }
    },
    path: 'views',
    partialsPath: 'views/partials'
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