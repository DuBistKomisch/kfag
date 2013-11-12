var fs = require('fs');
var gumbo = require('gumbo-parser');
var http = require('http');

http.get({host: 'steamcommunity.com', path: '/stats/KillingFloor/achievements/'}, function (res) {
  console.log("status: " + res.statusCode);
  var response = '';

  res.on('data', function (chunk) {
    response += chunk;
  }).on('end', function () {
    var tree = gumbo(response);
    var main = tree.root.childNodes[2].childNodes[1].childNodes[18].childNodes[1];

    var data = JSON.parse(fs.readFileSync('../data.json', {encoding: 'utf8'}));

    var count = 0;
    var match = 0;
    for (var i = 0; i < main.childNodes.length; i++)
    {
      var achieve = main.childNodes[i];
      if (achieve.nodeType == 1
          && achieve.attributes[0] != undefined
          && achieve.attributes[0].value == 'achieveTxtHolder')
      {
        var name = achieve.childNodes[7].childNodes[1].childNodes[0].textContent.trim();
        var desc = achieve.childNodes[7].childNodes[3].childNodes[0].textContent.trim();
        var rate = achieve.childNodes[9].childNodes[0].textContent.trim();
        var icon = main.childNodes[i - 2].childNodes[0].attributes[0].value;

        console.log();
        console.log('#' + (++count) + ': ' + name + ' (' + rate + ')');
        console.log('"' + desc + '"');

        var node = undefined;
        for (var j = 0; j < data.length; j++)
        {
          if (data[j].children == undefined)
            node = findAchievement(data[j].data, name);
          else for (var k = 0; k < data[j].children.length; k++)
          {
            node = findAchievement(data[j].children[k].data, name);
            if (node != undefined)
              break;
          }
          if (node != undefined)
            break;
        }

        if (node != undefined)
        {
          ++match;
          console.log('updating matching json node');
          node.rate = Number(rate.substring(0, rate.length - 1));
          node.icon = icon.substring(icon.lastIndexOf('/') + 1, icon.length - 4);
        }
      }
    }
    
    console.log();
    console.log('found: ' + count + ', match: ' + match);

    fs.writeFileSync('../test.json', JSON.stringify(data, null, 2));
  });
}).on('error', function (e) {
  console.log("error: " + e.message);
});

function findAchievement(list, name)
{
  for (var i = 0; i < list.length; i++)
    if (list[i].name == name)
      return list[i];
  return undefined;
}
