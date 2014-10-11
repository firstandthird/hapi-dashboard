var Hapi = require('hapi');
var Joi = require('joi');
var async = require('async');
var util = require('util');
var crypto = require('crypto');

// Login
exports.login = {
  handler: function(request, reply) {
    var error = false;

    if(request.method === 'post') {
      if(request.payload.password === this.options.password) {
        return reply
          .redirect(this.options.endpoint)
          .state('hapi-dashboard', crypto.createHash('md5').update(this.options.password).digest('hex'));
      }

      error = true;
    }

    reply.view('login', {
      path: this.options.endpoint,
      next: request.query.next,
      error: error
    });
  }
}

// Logout
exports.logout = {
  handler: function(request, reply) {
    reply.redirect(this.options.endpoint).state('hapi-dashboard', false);
  }
}

// Lists all dashboards
exports.dashboards = {
  handler: function(request, reply) {
    var self = this;

    if(request.state['hapi-dashboard'] !== crypto.createHash('md5').update(this.options.password).digest('hex')) {
      return reply.redirect(this.options.endpoint + '/login');
    }

    var dashboards = Object.keys(this.options.dashboards).map(function (key) {
      var obj = self.options.dashboards[key];
      obj.slug = key;
      return obj;
    });

    reply.view('dashboards', {
      path: self.options.endpoint,
      dashboards: dashboards
    });
  }
};

// Displays a single dashboard
exports.dashboard = {
  validate: {
    params: {
      name: Joi.string().required()
    }
  },
  handler: function(request, reply) {
    var self = this;

    if(request.state['hapi-dashboard'] !== crypto.createHash('md5').update(this.options.password).digest('hex')) {
      return reply.redirect(this.options.endpoint + '/login');
    }

    if(!this.options.dashboards[request.params.name]) {
      return reply(Hapi.error.notFound());
    }

    this.getMetrics(this.options.dashboards[request.params.name], function(err, data) {
      if (err) {
        return reply(Hapi.error.internal('processing metrics', err));
      }

      var metrics = [];

      async.each(data, function(item, cb) {
        if(util.isArray(item.data)) {
          item.data.forEach(function(metric) {
            metrics.push(metric);
          });
        } else {
          metrics.push(item.data);
        }

        cb();
      }, function(err) {
        if(err) {
          return reply(Hapi.error.internal('processing metrics', err));
        }

        reply.view('dashboard', {
          path: self.options.endpoint,
          dashboard: self.options.dashboards[request.params.name],
          metrics: metrics
        });
      });
    });
  }
};