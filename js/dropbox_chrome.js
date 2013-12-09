(function() {
  Dropbox.Chrome = (function() {

    function Chrome(clientOptions) {
      this.clientOptions = clientOptions;
      this._client = null;
      this._clientCallbacks = null;
      this._userInfo = null;
      this._userInfoCallbacks = null;
      this.onClient = new Dropbox.Util.EventSource;
    }

    Chrome.prototype.onClient = null;

    Chrome.prototype.client = function(callback) {
      var authDriver,
        _this = this;
      if (this._client) {
        callback(this._client);
        return this;
      }
      if (this._clientCallbacks) {
        this._clientCallbacks.push(callback);
        return this;
      }
      this._clientCallbacks = [callback];

      authDriver = new Dropbox.AuthDriver.Chrome({
        receiverPath: 'html/chrome_oauth_receiver.html'
      });

      authDriver.loadCredentials(function(credentials) {

        var callbacks, client, _i, _len, _results;
        if (!(credentials && credentials.token)) {
          credentials = _this.clientOptions;
        }
        client = new Dropbox.Client(credentials);
        client.authDriver(authDriver);
        client.onAuthStepChange.addListener(function() {
          return _this._userInfo = null;
        });
        _this.onClient.dispatch(client);
        _this._client = client;
        callbacks = _this._clientCallbacks;
        _this._clientCallbacks = null;
        _results = [];
        for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
          callback = callbacks[_i];
          _results.push(callback(_this._client));
        }
        return _results;
      });
      return this;
    };

    Chrome.prototype.userInfo = function(callback) {
      var dispatchUserInfo,
        _this = this;
      if (this._userInfo) {
        callback(this._userInfo);
        return this;
      }
      if (this._userInfoCallbacks) {
        this._userInfoCallbacks.push(callback);
        return this;
      }
      this._userInfoCallbacks = [callback];

      dispatchUserInfo = function() {
        var callbacks, _i, _len, _results;
        callbacks = _this._userInfoCallbacks;
        _this._userInfoCallbacks = null;
        _results = [];
        for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
          callback = callbacks[_i];
          _results.push(callback(_this._userInfo));
        }
        return _results;
      };

      chrome.storage.local.get('dropbox_js_userinfo', function(items) {
        var Error;
        if (items && items.dropbox_js_userinfo) {
          try {
            _this._userInfo = Dropbox.UserInfo.parse(items.dropbox_js_userinfo);
            return dispatchUserInfo();
          } catch (_error) {
            Error = _error;
            _this._userInfo = null;
          }
        }
        return _this.client(function(client) {
          if (!client.isAuthenticated()) {
            _this._userInfo = {};
            return dispatchUserInfo();
          }
          return client.getUserInfo(function(error, userInfo) {
            if (error) {
              _this._userInfo = {};
              return dispatchUserInfo();
            }
            return chrome.storage.local.set({
              dropbox_js_userinfo: userInfo.json()
            }, function() {
              _this._userInfo = userInfo;
              return dispatchUserInfo();
            });
          });
        });
      });
      return this;
    };

    Chrome.prototype.signOut = function(callback) {
      var _this = this;
      return this.client(function(client) {
        if (!client.isAuthenticated()) {
          return callback();
        }
        return client.signOut(function() {
          _this._userInfo = null;
          return chrome.storage.local.remove('dropbox_js_userinfo', function() {
            return callback();
          });
        });
      });
    };

    return Chrome;

  })();

}).call(this);