'use strict';
const tap = require('tap');
const setup = require('./setup.js');
const fs = require('fs');
let server;

tap.beforeEach((allDone) => {
  setup({}, (err, hapiServer) => {
    if (err) {
      return allDone(err);
    }
    server = hapiServer;
    return allDone();
  });
});

tap.afterEach((done) => {
  server.stop(() => {
    done();
  });
});
tap.test('can configure and call the dashboards menu endpoint', (t) => {
  server.inject({
    url: '/',
    method: 'GET'
  }, (response) => {
    t.equal(response.statusCode, 200, 'dashboard endpoint returns HTTP OK');
    const expectedOutput = fs.readFileSync('test/expectedOutputs/dashboard.html').toString();
    t.equal(response.result, expectedOutput);
    t.end();
  });
});

tap.test('enables individual dashboards endpoint', (t) => {
  server.inject({
    url: '/users',
    method: 'GET'
  }, (response) => {
    t.equal(response.statusCode, 200, 'dashboard endpoint returns HTTP OK');
    const expectedOutput = fs.readFileSync('test/expectedOutputs/users.html').toString();
    t.equal(response.result, expectedOutput, 'sends back the correct HTML interface');
    t.end();
  });
});
