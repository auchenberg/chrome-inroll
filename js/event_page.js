(function() {

  var EventPageController = (function() {

    function EventPageController(dropboxChrome) {
      var _this = this;

      this.dropboxChrome = dropboxChrome;

      chrome.browserAction.onClicked.addListener(function() {
        return _this.onBrowserAction();
      });

      chrome.runtime.onInstalled.addListener(function() {
        _this.onInstall();
        return _this.onStart();
      });

      chrome.runtime.onStartup.addListener(function() {
        return _this.onStart();
      });

      this.dropboxChrome.onClient.addListener(function(client) {
        _this.dropboxClient = client;

        client.onAuthStepChange.addListener(function() {
          return _this.onDropboxAuthChange(client);
        });
        return client.onError.addListener(function(error) {
          return _this.onDropboxError(client, error);
        });
      });

      this.options = new Options;

    }

    EventPageController.prototype.onInstall = function() {
      return null;
    };

    EventPageController.prototype.onStart = function() {
      var _this = this;

      return this.dropboxChrome.client(function(client) {
        return _this.onDropboxAuthChange(client);
      });

    };

    EventPageController.prototype.onBrowserAction = function() {
      var _this = this;
      return this.dropboxChrome.client(function(client) {
        var credentials;
        if (client.isAuthenticated()) {
          chrome.tabs.create({
            url: 'html/popup.html',
            active: true,
            pinned: false
          });
        }
        credentials = client.credentials();
        if (credentials.authState) {
          client.reset();
        }
        return _this.signIn(function() {
          return null;
        });
      });
    };

    EventPageController.prototype.onDropboxAuthChange = function(client) {
      var credentials;
      if (client.isAuthenticated()) {

        chrome.browserAction.setPopup({
          popup: 'html/popup.html'
        });

        chrome.browserAction.setTitle({
          title: "Signed in"
        });

        chrome.browserAction.setBadgeText({
          text: ''
        });
      } else {

        chrome.browserAction.setPopup({
          popup: ''
        });
        credentials = client.credentials();
        if (credentials.authState) {
          chrome.browserAction.setTitle({
            title: 'Signing in...'
          });
          chrome.browserAction.setBadgeText({
            text: '...'
          });
          chrome.browserAction.setBadgeBackgroundColor({
            color: '#DFBF20'
          });
        } else {
          chrome.browserAction.setTitle({
            title: 'Click to sign into Dropbox'
          });
          chrome.browserAction.setBadgeText({
            text: '0'
          });
          chrome.browserAction.setBadgeBackgroundColor({
            color: '#DF2020'
          });
        }
      }
      return chrome.extension.sendMessage({
        notice: 'dropbox_auth'
      });
    };


    EventPageController.prototype.signOut = function(callback) {
        return dropboxChrome.signOut(callback);
    };

    EventPageController.prototype.signIn = function(callback) {
      return this.dropboxChrome.client(function(client) {
        return client.authenticate(function(error) {
          if (error) {
            client.reset();
          }
          return callback();
        });
      });
    };

    EventPageController.prototype.onDropboxError = function(client, error) {
      return this.errorNotice("Something went wrong while talking to Dropbox: " + error);
    };

    EventPageController.prototype.errorNotice = function(errorText) {
      return webkitNotifications.createNotification('images/icon48.png', 'Download to Dropbox', errorText);
    };

    return EventPageController;

  })();

  dropboxChrome = new Dropbox.Chrome({
    key: 'dz4nhupntwq657o'
  });

  window.controller = new EventPageController(dropboxChrome);

}).call(this);