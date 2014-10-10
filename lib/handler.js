var Hapi = require('hapi');
var Joi = require('joi');
var async = require('async');
var util = require('util');

// Login
exports.login = {
  auth: {
    mode: 'try',
    strategy: 'session'
  },
  plugins: {
    'hapi-auth-cookie': {
      redirectTo: false
    }
  },
  handler: function(request, reply) {
    var error = false;

    if(request.method === 'post') {
      if(request.payload.password === this.options.password) {
        request.auth.session.set({authenticated: true});
        return reply.redirect(request.query.next);
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
  auth: 'session',
  handler: function(request, reply) {
    request.auth.session.clear();
    reply.redirect(this.options.endpoint);
  }
}

// Lists all dashboards
exports.dashboards = {
  auth: 'session',
  handler: function(request, reply) {
    var self = this;

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
  auth: 'session',
  handler: function(request, reply) {
    var self = this;

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