(function() {

  var EventPageController = (function() {

    function EventPageController(dropboxChrome) {
      var _this = this;

      this.dropboxChrome = dropboxChrome;

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

    EventPageController.prototype.onDropboxAuthChange = function(client) {
      var credentials;
      if (client.isAuthenticated()) {

      } else {

        credentials = client.credentials();
        if (credentials.authState) {


        } else {

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
      /* alert("Something went wrong while talking to Dropbox: " + error); */
      console.log ("Something went wrong while talking to Dropbox: " + error);
    };

    return EventPageController;

  })();

  dropboxChrome = new Dropbox.Chrome({
    key: 'dz4nhupntwq657o'
  });

  window.controller = new EventPageController(dropboxChrome);

}).call(this);