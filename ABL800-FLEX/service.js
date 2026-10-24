var Service = require('node-windows').Service;
var path = require('path');
var svc = new Service({
  name: 'ABL800-FLEX Server Service',
  description:
    'A server service for sending out test results for ABL800-FLEX to connected clients through sockets.',
  script: path.join(__dirname, 'app.js'),
});

svc.on('install', function () {
  svc.start();
});
svc.install();

