process.chdir(__dirname);
var __path__ = require("path");
var net = require("net");
var Parser = require("./node_modules/simple-hl7/lib/hl7/parser");
var client = require("node-rest-client").Client;
var urls = [];
var settings = require(__path__.resolve(".", "config", "settings"));
var map = require(
  __path__.resolve(".", "config", settings.instrumentJSONMapping),
);
var options_auth = { user: settings.lisUser, password: settings.lisPassword };

var VT = String.fromCharCode(0x0b);
var FS = String.fromCharCode(0x1c);
var CR = String.fromCharCode(0x0d);
var responseBuffer = "";

var parser = new Parser({ segmentSeperator: "\r" });
var clientOptions = {
  host: "10.41.50.15",
  port: 5100,
};

var app = net.createConnection(clientOptions, function () {
  console.log(
    "Connected to Mindray BC20 at " +
      clientOptions.host +
      ":" +
      clientOptions.port,
  );
});

function sendData(urls) {
  var url = urls[0];
  urls.shift();
  new client(options_auth).get(url, function (data) {
    if (urls.length > 0) {
      sendData(urls);
    }
  });
}

app.on("data", function (data) {
  responseBuffer += data.toString();
  if (
    responseBuffer.substring(
      responseBuffer.length - 2,
      responseBuffer.length,
    ) ==
    FS + CR
  ) {
    var ack = parser.parse(
      responseBuffer.substring(1, responseBuffer.length - 2),
    );
    var tests = [
      "WBC",
      "LYM#",
      "LYM%",
      "RBC",
      "HGB",
      "MCV",
      "MCH",
      "MCHC",
      "RDW-CV",
      "RDW-SD",
      "HCT",
      "PLT",
      "MPV",
      "PDW",
      "PCT",
      "MID#",
      "MID%",
      "GRAN#",
      "GRAN%",
    ];
    console.log(ack.log());
    var sampleID = "";
    var counter = 0;
    ack.segments.forEach(function (segment) {
      if (segment.name == "OBR") {
        sampleID = segment.fields[2].value[0];
      }
      if (segment.name == "OBX") {
        var test_measure = tests[counter];
        var NM = segment.fields[1].value[0][0].value[0];
        var ageSegID = segment.fields[2].value[0][0].value[0].toString();
        if (NM == "NM" && ageSegID !== "30525-0") {
          var obsResult = segment.fields[4].value[0][0].value[0];
          var measureID = map[test_measure];
          if (sampleID && measureID) {
            var link = settings.lisPath
              .replace(/\#\{SPECIMEN_ID\}/, sampleID)
              .replace(/\#\{MEASURE_ID\}/, measureID)
              .replace(/\#\{RESULT\}/, obsResult);
            urls.push(link);
          }
          counter = counter + 1;
        }
      }
    });

    if (urls.length > 0) {
      console.log(urls);
      sendData(urls);
      urls = [];
    } else {
      console.log("No result sent to BLIS!!");
    }
    //console.log(urls);

    // Reset buffer after processing complete message
    responseBuffer = "";
  }
});
