const async = require('async');

module.exports = {
  method: function(request, item, options, done) {
    const metrics = Object.keys(item.metrics).map(key => {
      const metric = item.metrics[key];
      metric.key = key;
      return metric;
    });
    async.mapLimit(metrics, options.concurrent, (metric, allDone) => {
      request.server.methods.processData(request, metric, options, allDone);
    }, (err, data) => {
      done(err, data);
    });
  },
};
