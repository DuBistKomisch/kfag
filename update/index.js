var gumbo = require('gumbo-parser');
var http = require('http');

var response = '';

http.get({host: 'steamcommunity.com', path: '/stats/KillingFloor/achievements/'}, function (res) {
  console.log("status: " + res.statusCode);
  res.on('data', function (chunk) {
    response += chunk;
  }).on('end', function () {
    var tree = gumbo(response);
    console.log(tree);
  });
}).on('error', function (e) {
  console.log("error: " + e.message);
});
