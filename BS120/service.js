var Service = require(""node-windows"").Service;
var path = require(""path"");
var svc = new Service({
  name: ""BS120 Server Service"",
  description:
    ""A server service for sending out test results for BS120 to connected clients through sockets."",
  script: path.join(__dirname, ""app.js""),
});

svc.on(""install"", function () {
  svc.start();
});
svc.install();
