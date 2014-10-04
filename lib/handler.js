var Hapi = require('hapi');
var Joi = require('joi');
var async = require('async');

// Lists all dashboards
exports.dashboards = {
  handler: function(request, reply) {
    var self = this;

    var dashboards = Object.keys(this.options.dashboards).map(function (key) {
      var obj = self.options.dashboards[key];
      obj.slug = key;
      return obj;
    });

    async.mapLimit(dashboards, this.options.concurrent, this.processData, function(err, data) {
      if (err) {
        return reply(Hapi.error.internal('processing metrics', err));
      }

      reply.view('dashboards', {
        path: self.options.endpoint,
        metrics: data
      });
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

    this.processData(this.options.dashboards[request.params.name], function(err, data) {
      if (err) {
        return reply(Hapi.error.internal('processing metrics', err));
      }

      reply.view('dashboard', {
        path: self.options.endpoint,
        metrics: data
      });
    });
  }
};