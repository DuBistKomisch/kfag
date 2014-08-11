window.mapSortMode = null;
window.countdown_id = null;
window.attempts = 0;

$(document).ready(function ()
{
  $.getJSON('data.json', function (data)
  {
    window.data = data;
    
    $.getJSON('maps.json', function (data)
    {
      window.maps = data;
      filter();
    });
  });
  
  $('#sort').selectmenu({ width: '200px', change: update });
  $('#events').change(update);
  $('#tips').change(tips);
  $('#old').change(update);
  $('#filterApply').button().click(filter);
  $('#filterClear').button().click(function ()
  {
    $('#filter').val('');
    filter();
  });
  
  $('#sort').val($.url().param('sort') ? $.url().param('sort') : 'rate-desc');
  $('#events').prop('checked', $.url().param('events') != undefined);
  $('#tips').prop('checked', $.url().param('tips') != undefined);
  $('#old').prop('checked', $.url().param('old') != undefined);
  $('#filter').val($.url().param('filter') ? $.url().param('filter') : '');

  $('#filter').addClass('ui-widget ui-corner-all');
  $('#filter').tooltip({
    position: { my: "left+10 bottom-10", at: "left top" },
    content: '<p>Open your Steam profile and copy the last part of the URL.</p><p>steamcommunity.com/id/<span style="font-weight: bold;">dubistkomisch</span></p><p>steamcommunity.com/profiles/<span style="font-weight: bold;">76561198030777165</span></p>'
  });
});

function filter()
{
  // reset retry
  if (window.countdown_id != null)
  {
    clearInterval(window.countdown_id);
    window.countdown_id = null;
  }
  window.attempts = 3;

  $('#filter').val($('#filter').val().trim());

  if ($('#filter').val() == '')
  {
    filter_status('success', '');
    window.user = null;
    update();
    return;
  }

  if (isNaN(Number($('#filter').val())))
  {
    // not a number, only try as username
    get_filter('http://jakebarnes.com.au/id/' + $('#filter').val() + '/statsfeed/1250?xml=1', 'Trying as username...', function ()
    {
      filter_status('error', 'Not a valid username.');
      window.user = null;
      update();
    });
  }
  else
  {
    // number, try as SteamID64 then username
    get_filter('http://jakebarnes.com.au/profiles/' + $('#filter').val() + '/statsfeed/1250?xml=1', 'Trying as SteamID64...', function ()
    {
      get_filter('http://jakebarnes.com.au/id/' + $('#filter').val() + '/statsfeed/1250?xml=1', 'Trying as username...', function ()
      {
        filter_status('error', 'Not a valid username or SteamID64.');
        window.user = null;
        update();
      });
    });
  }
}

function get_filter(url, working, missing)
{
  filter_status('working', working);
  $.get(url)
  .done(function (data, statusText, jqXHR)
  {
    if ($(data).find('error').length > 0)
    {
      missing();
    }
    else
    {
      filter_status('success', 'Done.');
      window.user = data;
      update();
    }
  })
  .fail(function (jqXHR, statusText, error)
  {
    if (--window.attempts > 0)
    {
      var counter = 20;
      filter_status('error', 'Steam is busy! Trying again in ' + counter + '...');
      window.countdown_id = setInterval(function ()
      {
        if (--counter == 0)
        {
          clearInterval(window.countdown_id);
          window.countdown_id = null;
          get_filter(url, working, missing);
        }
        else
        {
          filter_status('error', 'Steam is busy! Trying again in ' + counter + '...');
        }
      }, 1000);
    }
    else
    {
      filter_status('error', 'Steam is busy! Try again later.');
    }
  });
}

function filter_status(type, message)
{
  $('#filterStatus').removeClass().addClass(type).text(message);
}

function update()
{
  $('#achievements').empty();
  
  if ($('#events').prop('checked'))
  {
    processSections(window.data, $('#achievements'), 'h1');
  }
  else
  {
    var $section = $('<section id="all"><h1><a href="#all">All</a></h1></section>');
    processAll(window.data, $section);
    $('#achievements').append($section);
  }
  
  tips();
  
  update_maps();
}

function tips()
{
  if ($('#tips').prop('checked'))
  {
    $('article.tips').css('padding-bottom', '10px');
    $('article > p').css('display', 'block');
  }
  else
  {
    $('article.tips').css('padding-bottom', '0px');
    $('article > p').css('display', 'none');
  }
}

function sortRateDesc(a, b)
{
  if (a.rate < b.rate)
    return 1;
  else if (a.rate > b.rate)
    return -1;
  return 0;
}

function sortRateAsc(a, b)
{
  if (a.rate < b.rate)
    return -1;
  else if (a.rate > b.rate)
    return 1;
  return 0;
}

function sortName(a, b)
{
  if (a.name < b.name)
    return -1;
  else if (a.name > b.name)
    return 1;
  return 0;
}

function processSections(list, base, level)
{
  for (var i = 0; i < list.length; i++)
  {
    var $section = $('<section id="' + list[i].id + '"><' + level + '><a href="#' + list[i].id + '">' + list[i].name + '</a></h1></section>');
    // achievements
    if (list[i].data != undefined)
      processAchievements(list[i].data, $section);
    // subsections
    if (list[i].children != undefined)
      processSections(list[i].children, $section, 'h2');
    // done
    if ($section.children().length > 1)
      base.append($section);
  }
}

function processAll(list, base)
{
  var achievements = [];
  for (var i = 0; i < list.length; i++)
  {
    // achievements
    if (list[i].data != undefined)
      achievements = achievements.concat(list[i].data);
    // subsections
    if (list[i].children != undefined)
      for (var j = 0; j < list[i].children.length; j++)
        if (list[i].children[j].data != undefined)
          achievements = achievements.concat(list[i].children[j].data);
  }
  processAchievements(achievements, base);
}

function processAchievements(list, base)
{
  switch ($('#sort').val())
  {
    case 'rate-desc':
      list.sort(sortRateDesc);
      break;
    case 'rate-asc':
      list.sort(sortRateAsc);
      break;
    case 'name':
      list.sort(sortName);
      break;
  }
  
  for (var i = 0; i < list.length; i++)
  {
    var $achievement = $('<article id="' + list[i].id + '"><div><img src="' + ($('#old').prop('checked') ? 'images/achievements/' + list[i].id : 'http://media.steampowered.com/steamcommunity/public/images/apps/1250/' + list[i].icon) + '.jpg" alt="icon" /><h3><a href="#' + list[i].id + '">' + list[i].name + '</a></h3><p>' + list[i].description + '</p><p><span class="tag">' + list[i].rate + '</span></p></div></article>');
    // perk
    if (list[i].perk != undefined)
      $achievement.find('div:nth-of-type(1)').addClass(list[i].perk);
    // rate
    var $rate = $achievement.find('.tag');
    if (list[i].rate >= 6)
      $rate.addClass('easy');
    else if (list[i].rate >= 3)
      $rate.addClass('medium');
    else
      $rate.addClass('hard');
    // event
    if (list[i].event != undefined)
      $achievement.find('div:nth-of-type(1) p:nth-of-type(2)').prepend('<span class="tag event">&nbsp;</span>');
    // tips
    if (list[i].tips != undefined)
    {
      for (var j = 0; j < list[i].tips.length; j++)
        $achievement.append('<p>' + list[i].tips[j] + '</p>');
      if (list[i].tips.length > 0)
        $achievement.addClass('tips');
    }
    // progress
    if (list[i].max != undefined)
    {
      if (window.user == null)
      {
        $achievement.find('div:nth-of-type(1)').append('<p><span style="display:none;"></span><span></span><span>' + list[i].max + '</span></p>');
      }
      else
      {
        var count = Number($(window.user).find('APIName:contains(' + list[i].count + ')').first().next('value').text());
        $achievement.find('div:nth-of-type(1)').append('<p><span style="width:' + Math.min(100, Math.round(count / list[i].max * 100)) + 'px;"></span><span>' + count + '</span><span>' + list[i].max + '</span></p>');
      }
    }
    // done
    if (window.user != null && list[i].api != undefined && $(window.user).find('APIName:contains(' + list[i].api + ')').next('value').text() != '0')
      continue;
    base.append($achievement);
  }
}

function update_maps()
{
  var $base = $("#maps tbody");
  $base.empty();
  
  if ($('#events').prop('checked'))
  {
    for (var i = 0; i < window.maps.length; i++)
    {
      $base.append($('<tr id="' + window.maps[i].id + '"><th class="division"><a href="#' + window.maps[i].id + '">' + window.maps[i].name + '</a></th></tr>'));
      processMaps(window.maps[i].data, $base);
    }
  }
  else
  {
    var maps = [];
    for (var i = 0; i < window.maps.length; i++)
      maps = maps.concat(window.maps[i].data);
    processMaps(maps, $base);
  }
}

function sortMapName(a, b)
{
  if (a.name < b.name)
    return -1;
  else if (a.name > b.name)
    return 1;
  return 0;
}

function sortMapRate(a, b, i)
{
  if (a.rate[i] < b.rate[i])
    return 1;
  else if (a.rate[i] > b.rate[i])
    return -1;
  return 0;
}

function sortMapNormal(a, b) { return sortMapRate(a, b, 0); }
function sortMapHard(a, b) { return sortMapRate(a, b, 1); }
function sortMapSuicidal(a, b) { return sortMapRate(a, b, 2); }
function sortMapHell(a, b) { return sortMapRate(a, b, 3); }

function processMaps(list, base)
{
  switch (window.mapSortMode)
  {
    case 'name':
      list.sort(sortMapName);
      break;
    case 'normal':
      list.sort(sortMapNormal);
      break;
    case 'hard':
      list.sort(sortMapHard);
      break;
    case 'suicidal':
      list.sort(sortMapSuicidal);
      break;
    case 'hell':
      list.sort(sortMapHell);
      break;
  }
  
  for (var i = 0; i < list.length; i++)
  {
    var $map = $('<tr id="' + list[i].id + '"><td class="map"><a href="#' + list[i].id + '">' + list[i].name + '</a>' + (list[i].kfo != undefined ? '<span class="kfo">KFO</span>' : '') + '</td></tr>');
    for (var j = 0; j < (list[i].nohoe != undefined ? 3 : 4); j++)
      if (window.user != null && list[i].api != undefined
      && $(window.user).find('APIName:contains(' + ($.isArray(list[i].api) ? list[i].api[j] : 'win' + list[i].api + ['normal', 'hard', 'suicidal', 'hell'][j]) + ')').next('value').text() != '0')
        $map.append($('<td>&#x2714;</td>'));
      else
        $map.append($('<td><span class="tag ' + (list[i].rate[j] >= 4 ? 'easy' : (list[i].rate[j] >= 2 ? 'medium' : 'hard')) + '">' + list[i].rate[j] + '</span></td>'));
    if (list[i].nohoe != undefined)
      $map.append($('<td>&mdash;</td>'));
    base.append($map);
  }
}

function sort_maps(by)
{
  window.mapSortMode = by;
  update_maps();
}
