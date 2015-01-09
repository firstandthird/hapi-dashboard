var Hapi = require('hapi');
var async = require('async');
var util = require('util');
var json2csv = require('json2csv');
var _ = require('lodash');

// Lists all dashboards
exports.dashboards = function(request, reply) {
  var self = this;

  var dashboards = Object.keys(this.options.dashboards).map(function (key) {
    var obj = self.options.dashboards[key];
    obj.slug = key;
    return obj;
  });

  reply.view('dashboards', {
    path: self.options.trimmedEndpoint,
    dashboards: dashboards,
    options: self.options
  });
};

// Displays a single dashboard
exports.dashboard = function(request, reply) {
  var self = this;

  if(!this.options.dashboards[request.params.name]) {
    return reply(Hapi.error.notFound());
  }

  this.getMetrics(request, this.options.dashboards[request.params.name], function(err, data) {
    if (err) {
      return reply(Hapi.error.internal('processing metrics', err));
    }

    var metrics = {};

    async.each(data, function(item, cb) {
      var section = item.section || 'default';
      var tempmetric = [];

      if(util.isArray(item.data)) {
        item.data.forEach(function(metric) {
          tempmetric.push(metric);
        });
      } else {
        tempmetric.push(item.data);
      }

      if(typeof metrics[section] === 'undefined') {
        metrics[section] = [];
      }


      tempmetric.forEach(function(metric) {
        metrics[section].push(metric);
      });

      cb();
    }, function(err) {
      if(err) {
        return reply(Hapi.error.internal('processing metrics', err));
      }

      // Normalize data
      var metric;
      for(var metricname in metrics) {
        metric = metrics[metricname];

        for(var i = 0, c = metric.length; i < c; i++) {
          if(metric[i].data) {
            continue;
          }
          var data = [];

          for(var colname in metric[i]) {
            if(colname === 'name') {
              continue;
            }

            data.push({
              name: colname,
              value: metric[i][colname]
            })
          }

          metric[i].data = data;
        }
      }
      
      if(request.path.indexOf('.json') !== -1) {
        reply(metrics);
      } else if(request.path.indexOf('.csv') !== -1) {
        var flatmetrics = [];
        var titles = [];
        var sectionTitle, spacer;
        var lineItems;

        for(metricname in metrics) {
          metric = metrics[metricname];

          titles = _.pluck(metric[0].data, 'name');

          if(metricname !== 'default') {
            spacer = {};
            spacer[titles[0]] = '';
            flatmetrics.push(spacer);

            sectionTitle = {};
            sectionTitle[titles[0]] = metricname;
            flatmetrics.push(sectionTitle);
          }

          for(i = 0, c = metric.length; i < c; i++) {
            lineItems = {};

            _.map(metric[i].data, function(value) {
              lineItems[value.name] = value.value;
            });

            lineItems.Name = metric[i].name;
            flatmetrics.push(lineItems);
          }
        }

        json2csv({data: flatmetrics, fields: titles}, function(err, csv) {
          if (err) {
            return reply(Hapi.error.internal('processing csv', err));
          }

          reply(csv)
            .type('text/csv')
            .header('Content-disposition', 'attachment;filename=' + request.params.name + '.csv');
        });
      } else {
        reply.view('dashboard', {
          dashboard: self.options.dashboards[request.params.name],
          metrics: metrics,
          options: self.options
        });
      }

    });
  });
};
