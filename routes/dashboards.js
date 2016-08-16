// Lists all dashboards
exports.dashboards = {
  path: '/',
  method: 'GET',
  handler: function(request, reply) {
    const dashboards = Object.keys(this.options.dashboards).map(key => {
      const obj = this.options.dashboards[key];
      obj.slug = key;
      return obj;
    });
    reply.view('dashboards', {
      path: this.options.trimmedEndpoint,
      dashboards,
      options: this.options
    });
  }
};
