module.exports = {
  method: (request, metric, options, done) => {
    const start = new Date().getTime();
    metric.value.call(request, request.server, (err, data) => {
      if (err) {
        request.server.log(['hapi-dashboard', 'error'], { key: metric.key, message: err });
        return done(null, []);
      }
      const end = new Date().getTime();
      const diff = (end - start) / 1000;
      request.server.log(['hapi-dashboard'], { message: `get data for ${metric.key}`, key: metric.key, duration: `${diff}s` });
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
