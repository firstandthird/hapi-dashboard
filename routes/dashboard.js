'use strict';
const Boom = require('boom');
const async = require('async');
const util = require('util');
const Joi = require('joi');
const json2csv = require('json2csv');
const _ = require('lodash');

const dashboardConf = {
  // auth: authConfig,
  validate: {
    params: {
      name: Joi.string().required()
    }
  },
  handler: function(request, reply) {
    if (!this.options.dashboards[request.params.name]) {
      return reply(Boom.notFound());
    }
    this.getMetrics(request, this.options.dashboards[request.params.name], this.options, (err, data) => {
      if (err) {
        return reply(Boom.badImplementation('processing metrics', err));
      }

      const metrics = {};

      async.each(data, (item, cb) => {
        const section = item.section || 'default';
        const tempmetric = [];

        if (util.isArray(item.data)) {
          item.data.forEach(metric => {
            tempmetric.push(metric);
          });
        } else {
          tempmetric.push(item.data);
        }

        if (typeof metrics[section] === 'undefined') {
          metrics[section] = [];
        }

        tempmetric.forEach(metric => {
          metrics[section].push(metric);
        });

        cb();
      }, allErr => {
        if (allErr) {
          return reply(Boom.badImplementation('processing metrics', allErr));
        }

        // Normalize data
        for (const metricname of Object.keys(metrics)) {
          const metric = metrics[metricname];

          for (let i = 0, c = metric.length; i < c; i++) {
            if (metric[i].data) {
              continue;
            }

            const metricData = [];

            for (const colname of Object.keys(metric[i])) {
              if (colname === 'name') {
                continue;
              }

              metricData.push({
                name: colname,
                value: metric[i][colname]
              });
            }

            metric[i].data = metricData;
          }
        }

        if (request.path.indexOf('.json') !== -1) {
          reply(metrics);
        } else if (request.path.indexOf('.csv') !== -1) {
          const flatmetrics = [];
          let titles = [];
          let sectionTitle;
          let spacer;
          let lineItems;

          for (const metricname of Object.keys(metrics)) {
            const metric = metrics[metricname];

            // TODO: This used to be _.pluck, but lodash removed and suggests map. Should make sure it works the same.
            titles = _.map(metric[0].data, 'name');
            titles.unshift('Name');

            if (metricname !== 'default') {
              spacer = {};
              spacer[titles[0]] = '';
              flatmetrics.push(spacer);

              sectionTitle = {};
              sectionTitle[titles[0]] = metricname;
              flatmetrics.push(sectionTitle);
            }

            for (let i = 0, c = metric.length; i < c; i++) {
              lineItems = {};

              // TODO: eslint doesn't like this
              _.map(metric[i].data, value => { //eslint-disable-line no-loop-func
                lineItems[value.name] = value.value || '';
              });

              lineItems.Name = metric[i].name || '';
              flatmetrics.push(lineItems);
            }
          }


          json2csv({ data: flatmetrics, fields: titles }, (csvErr, csv) => {
            if (csvErr) {
              return reply(Boom.badImplementation('processing csv', csvErr));
            }

            reply(csv)
              .type('text/csv')
              .header('Content-disposition', `attachment;filename=${request.params.name}.csv`);
          });
        } else {
          reply.view('dashboard', {
            dashboard: this.options.dashboards[request.params.name],
            metrics,
            options: this.options
          });
        }
      });
    });
  }
};

exports.main = {
  path: '/{name}',
  method: 'GET',
  config: dashboardConf
};

exports.csv = {
  path: '/{name}.csv',
  method: 'GET',
  config: dashboardConf
};

exports.json = {
  path: '/{name}.json',
  method: 'GET',
  config: dashboardConf
};
