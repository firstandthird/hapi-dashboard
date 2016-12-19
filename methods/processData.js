module.exports = {
  method: (request, metric, options, done) => {
    metric.value.call(request, request.server, (err, data) => {
      if (err) {
        return request.server.log(['hapi-dashboard', 'error'], { message: err });
      }
      request.server.log(['hapi-dashboard'], { message: `fetched data for ${metric.key}`, key: metric.key });
      metric.data = data;
      done(null, metric, metric.ttl || options.ttl);
    });
  },
  cache: {
    expiresIn: undefined,
    generateTimeout: 30 * 1000
  },
  generateKey(request, metric) {
    return metric.key;
  }
};
