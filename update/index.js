var fs = require('fs');
var gumbo = require('gumbo-parser');
var http = require('http');

var data = JSON.parse(fs.readFileSync('../data.json', {encoding: 'utf8'}));
fs.writeFileSync('../test.json', JSON.stringify(data, null, 2));

http.get({host: 'steamcommunity.com', path: '/stats/KillingFloor/achievements/'}, function (res) {
  console.log("status: " + res.statusCode);
  var response = '';

  res.on('data', function (chunk) {
    response += chunk;
  }).on('end', function () {
    var tree = gumbo(response);
    var main = tree.root.childNodes[2].childNodes[1].childNodes[18].childNodes[1];
    var count = 0;
    for (var i = 0; i < main.childNodes.length; i++) {
      var achieve = main.childNodes[i];
      if (achieve.nodeType == 1
        && achieve.attributes[0] != undefined
        && achieve.attributes[0].value == 'achieveTxtHolder')
      {
        var name = achieve.childNodes[7].childNodes[1].childNodes[0].textContent;
        var desc = achieve.childNodes[7].childNodes[3].childNodes[0].textContent;
        var rate = achieve.childNodes[9].childNodes[0].textContent;
        console.log('#' + (++count) + ': ' + name + ' (' + rate + ')');
        console.log('"' + desc + '"');
      }
    }
  });
}).on('error', function (e) {
  console.log("error: " + e.message);
});
