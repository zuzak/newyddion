/* eslint-env browser */
function wget (url, cb) {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', url, true)
  xhr.responseType = 'json'
  xhr.onload = function () {
    var status = xhr.status
    if (status === 200) {
      cb(null, xhr.response)
    } else {
      cb(status)
    }
  }
  xhr.send()
}

var BBC_NEWS_URL = 'https://polling.bbc.co.uk/news/latest_breaking_news_waf'
var GDN_NEWS_URL = 'https://api.nextgen.guardianapps.co.uk/news-alert/alerts'
var REU_NEWS_URL = 'https://files.chippy.ch/newsboard/reuters.php' // proxy of http://uk.reuters.com/assets/breakingNews?view=json
var BBC_LOCAL_URL = 'https://api.rss2json.com/v1/api.json?rss_url=http%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Fengland%2Fsouth_yorkshire%2Frss.xml'
var REUTERS_WIRE_URL = 'https://files.chippy.ch/newsboard/reuterswire.php' // proxy of https://uk.reuters.com/assets/jsonWireNews#'
var output = {}

function sendNews (provider, header, headline, description) {
  if (header && headline) {
    var h2 = document.createElement('h2')
    h2.innerHTML = header
    var p = document.createElement('p')
    p.innerHTML = headline

    var div = document.createElement('div')
    div.className = provider
    div.appendChild(h2)
    div.appendChild(p)

    if (description) {
      var desc = document.createElement('p')
      desc.className = 'description'
      desc.innerHTML = description
      div.appendChild(desc)
    }

    output[provider] = div
  } else {
    delete output[provider]
  }
}

function poll () {
  wget(BBC_NEWS_URL, function (err, response) {
    if (!err) {
      var story = response.asset
      if (story) {
        sendNews('bbc', 'BBC News', story.headline)
      } else {
        sendNews('bbc')
      }
    }
  })
  /* wget(GDN_NEWS_URL, function (err, response) {
    if (!err) {
      var story = response.collections[0].content[0]
      if (story) {
        sendNews('gdn', story.title, story.headline)
      } else {
        sendNews('gdn')
      }
    }
  }) */
  wget(REU_NEWS_URL, function (err, story) {
    if (!err) {
      if (story) {
        sendNews('reu', story.label, story.headline)
      } else {
        sendNews('reu')
      }
    }
  })
  wget('https://files.chippy.ch/newsboard/weather.php', function (err, weather) {
    if (!err) {
      var ul = document.createElement('ul')
      ul.className = 'weather'
      ul.id = 'js-weather'
      for (var i = 0; i < weather.forecast.length; i++) {
        var li = document.createElement('li')

        var current = weather.forecast[i]
        if (Array.isArray(current)) {
          var ul2 = document.createElement('ul')
          for (var j = 0; j < current.length; j++) {
            var li2 = document.createElement('li')
            li2.innerHTML = current[j]
            ul2.appendChild(li2)
          }
          li.appendChild(ul2)
        } else {
          li.innerHTML = weather.forecast[i]
        }
        ul.appendChild(li)
      }
      var old = document.getElementById('js-weather')
      old.parentNode.replaceChild(ul, old)
    }
  })
  wget(BBC_LOCAL_URL, function (err, data) {
    if (!err && data.status === 'ok') {
      var title = data.feed.title
      var news = data.items
      var dateThreshold = Date.now() - 1000 * 60 * 60 // 1hr
      for (var i = 0; i < news.length; i++) {
        var newsDate = new Date(news[i].pubDate)
        if (newsDate > dateThreshold) {
          sendNews('bbc-local', title.split(' - ')[1], news[i].title, news[i].description)
        }
      }
    }
  })
  wget(REUTERS_WIRE_URL, function (err, data) {
    if (!err && data.headlines) {    //  ms    s   m
      var dateThreshold = Date.now() - 1000 * 60 * 2
      for (var i = 0; i < data.headlines.length; i++) {
        var story = data.headlines[i]
        var storyDate = new Date(parseInt(story.dateMillis))
        if (storyDate > dateThreshold) {
          sendNews('reu-wire', 'Reuters', story.headline, story.formattedDate)
        }
      }
    }
  })
  // sendNews('bbc-local', 'Sheffield', 'Foo bar baz')
}

function displayNews () {
  var news = document.createElement('div')
  news.className = 'news'

  var newsSources = Object.keys(output)
  newsSources.sort()

  for (var i = 0; i < newsSources.length; i++) {
    news.appendChild(output[newsSources[i]])
  }

  var old = document.querySelector('.news')
  if (old) {
    var parent = old.parentNode
    parent.replaceChild(news, old)
  } else {
    console.error('No news to replace?')
  }
}

const clockTick = function () {
  var now = new Date()
  var str = now.toLocaleTimeString().split(':')
  var ul = document.getElementById('js-clock')
  ul.innerHTML = ''
  for (var i = 0; i < str.length; i++) {
    var li = document.createElement('li')
    li.textContent = str[i]
    ul.appendChild(li)
  }
  if (now.getHours() % 2) {
    document.getElementById('js-body').className = ' screenSaver'
  } else {
    document.getElementById('js-body').className = null
  }
}

function setup () {
  poll()
  window.setInterval(displayNews, 2000)
  window.setInterval(clockTick, 100)
  window.setInterval(poll, 30000)
  displayNews()
}

window.onload = setup()
