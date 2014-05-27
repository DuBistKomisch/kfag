var fs = require('fs');
var gumbo = require('gumbo-parser');
var http = require('http');
var util = require('util');

var DATA_FILE = '../data.json';
var MAPS_FILE = 'maps.json';

http.get({host: 'steamcommunity.com', path: '/stats/KillingFloor/achievements/'}, function (res) {
  var response = '';
  res.on('data', function (chunk) {
    response += chunk;
    util.print('downloading ' + Math.round(response.length / res.headers['content-length'] * 100) + '%\r');
  }).on('end', function () {
    console.log();
    process(response);
  });
}).on('error', function (e) {
  console.log('error: ' + e.message);
});

function process(response)
{
  // get steam data
  var tree = gumbo(response);
  var main = tree.root.childNodes[2].childNodes[1].childNodes[18].childNodes[1];

  // get existing json
  var data = JSON.parse(fs.readFileSync(DATA_FILE, {encoding: 'utf8'}));
  var maps = JSON.parse(fs.readFileSync(MAPS_FILE, {encoding: 'utf8'}));

  // start DATA
  console.log('-- working on ' + DATA_FILE);

  // init counters
  var count = 0;
  var matched = 0;
  var updated = 0;

  for (var i = 0; i < main.childNodes.length; ++i)
  {
    var achieve = main.childNodes[i];
    if (achieve.nodeType == 1
        && achieve.attributes[0] != undefined
        && achieve.attributes[0].value == 'achieveTxtHolder')
    {
      util.print('processing #' + (++count) + "\r");

      // scrape data
      var name = achieve.childNodes[7].childNodes[1].childNodes[0].textContent.trim();
      //var desc = achieve.childNodes[7].childNodes[3].childNodes[0].textContent.trim();
      var rate = achieve.childNodes[9].childNodes[0].textContent.trim();
      var icon = main.childNodes[i - 2].childNodes[0].attributes[0].value;

      // match to existing json node
      var node = undefined;
      for (var j = 0; j < data.length; ++j)
      {
        if (data[j].children == undefined)
          node = findAchievement(data[j].data, name);
        else for (var k = 0; k < data[j].children.length; ++k)
        {
          node = findAchievement(data[j].children[k].data, name);
          if (node != undefined)
            break;
        }
        if (node != undefined)
          break;
      }

      // update
      if (node != undefined)
      {
        console.log(name);
        ++matched;
        rate = Number(rate.substring(0, rate.length - 1));
        icon = icon.substring(icon.lastIndexOf('/') + 1, icon.length - 4);
        if (node.rate != rate || node.icon != icon)
        {
          ++updated;
          node.rate = rate;
          node.icon = icon;
        }
      }
    }
  }
  
  // done DATA
  console.log();
  console.log('found ' + count);
  console.log('matched ' + matched);
  console.log('updated ' + updated);

  // start MAPS
  console.log('-- working on ' + MAPS_FILE);

  // init counters
  var count = 0;
  var matched = 0;
  var updated = 0;

  for (var i = 0; i < main.childNodes.length; ++i)
  {
    var achieve = main.childNodes[i];
    if (achieve.nodeType == 1
        && achieve.attributes[0] != undefined
        && achieve.attributes[0].value == 'achieveTxtHolder')
    {
      util.print('processing #' + (++count) + "\r");

      // scrape data
      var name = achieve.childNodes[7].childNodes[1].childNodes[0].textContent.trim();
      var rate = achieve.childNodes[9].childNodes[0].textContent.trim();

      // match to existing json node
      var node = undefined;
      for (var j = 0; j < maps.length; ++j)
      {
        node = findAchievement(maps[j].data, name);
        if (node != undefined)
          break;
      }

      // update
      if (node != undefined)
      {
        console.log('name -> ' + node);
        /*++matched;
        rate = Number(rate.substring(0, rate.length - 1));
        icon = icon.substring(icon.lastIndexOf('/') + 1, icon.length - 4);
        if (node.rate != rate || node.icon != icon)
        {
          ++updated;
          node.rate = rate;
          node.icon = icon;
        }*/
      }
    }
  }

  // done MAPS
  console.log();
  console.log('found ' + count);
  console.log('matched ' + matched);
  console.log('updated ' + updated);

  // write json
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  fs.writeFileSync(MAPS_FILE, JSON.stringify(maps, null, 2));
}

function findAchievement(list, name)
{
  for (var i = 0; i < list.length; ++i)
    if (list[i].name == name)
      return list[i];
  return undefined;
}
