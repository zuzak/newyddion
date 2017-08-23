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
}

function displayNews () {
  var news = document.createElement('div')
  news.className = 'news'
  news.id = 'news'

  var newsSources = Object.keys(output)
  newsSources.sort()

  for (var i = 0; i < newsSources.length; i++) {
    news.appendChild(output[newsSources[i]])
  }

  var old = document.getElementById('news')

  var parent = old.parentNode
  parent.replaceChild(news, old)
}

function setup () {
  poll()
  window.setInterval(displayNews, 2000)
  displayNews()
}

window.onload = setup()
