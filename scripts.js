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
var REU_NEWS_URL = 'http://uk.reuters.com/assets/breakingNews?view=json'

var output = {}

function sendNews (provider, header, headline) {
  if (header && headline) {
    var h1 = document.createElement('h1')
    h1.innerHTML = header
    var p = document.createElement('p')
    p.innerHTML = headline

    var div = document.createElement('div')
    div.className = provider
    div.appendChild(h1)
    div.appendChild(p)

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
  wget(GDN_NEWS_URL, function (err, response) {
    if (!err) {
      var story = response.collections[0].content[0]
      if (story) {
        sendNews('gdn', story.title, story.headline)
      } else {
        sendNews('gdn')
      }
    }
  })
  wget(REU_NEWS_URL, function (err, story) {
    if (!err) {
      sendNews('reu', story.label, story.headline)
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
}

function setup () {
  poll()
  window.setInterval(displayNews, 2000)
  window.setInterval(clockTick, 100)
  window.setInterval(poll, 30000)
  displayNews()
}

window.onload = setup()
