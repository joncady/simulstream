'use strict';

chrome.runtime.onInstalled.addListener(function(details) {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {
            hostEquals: 'www.netflix.com',
            pathPrefix: '/watch/',
            schemes: ['http', 'https']
          }
        }),
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {
            hostEquals: 'www.crunchyroll.com',
            schemes: ['http', 'https']
          }
        }),
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {
            hostEquals: 'https://www.amazon.com',
            pathPrefix: '/gp/video/',
            schemes: ['http', 'https']
          }
        }),
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {
            hostEquals: 'https://www.youtube.com',
            schemes: ['http', 'https']
          }
        })
      ],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});