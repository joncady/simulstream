'use strict';

let sites = [
  {
    pageUrl: {
      hostEquals: 'www.netflix.com',
      pathPrefix: '/watch/',
      schemes: ['http', 'https']
    }
  },
  {
    pageUrl: {
      hostEquals: 'www.youtube.com',
      schemes: ['http', 'https']
    }
  },
  {
    pageUrl: {
      hostEquals: 'www.crunchyroll.com',
      schemes: ['http', 'https']
    }
  },
  {
    pageUrl: {
      hostEquals: 'www.amazon.com',
      pathPrefix: '/gp/video/detail/',
      schemes: ['http', 'https']
    }
  }
]

// only enables extension on certain video pages
chrome.runtime.onInstalled.addListener(function () {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: sites.map(site => new chrome.declarativeContent.PageStateMatcher(site)),
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});