var Hapi = require('hapi');
var Joi = require('joi');

// Lists all dashboards
exports.dashboards = {
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
  handler: function(request, reply) {
    var self = this;

    if(!this.options.dashboards[request.params.name]) {
      return reply(Hapi.error.notFound());
    }

    this.getMetrics(this.options.dashboards[request.params.name], function(err, data) {
      if (err) {
        return reply(Hapi.error.internal('processing metrics', err));
      }

      reply.view('dashboard', {
        path: self.options.endpoint,
        dashboard: self.options.dashboards[request.params.name],
        metrics: data
      });
    });
  }
};