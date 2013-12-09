(function() {

  var OptionsView = (function() {

    function OptionsView(root) {
      var _this = this;
      this.root = root;
      this.$root = $(this.root);

      this.$userInfo = $('#dropbox-info', this.$root);
      this.$userName = $('#dropbox-name', this.$userInfo);
      this.$userEmail = $('#dropbox-email', this.$userInfo);

      this.$signoutButton = $('#dropbox-signout', this.$userInfo);
      this.$signoutButton.on('click', function(event) {
        return _this.onSignoutClick(event);
      });

      this.$userNoInfo = $('#dropbox-no-info', this.$root);

      this.$signinButton = $('#dropbox-signin', this.$userNoInfo);

      this.$signinButton.on('click', function(event) {
        return _this.onSigninClick(event);
      });

      chrome.extension.onMessage.addListener(function(message) {
        return _this.onMessage(message);
      });

      this.reloadUserInfo();
    }

    OptionsView.prototype.updateData = function(callback) {
      var _this = this;
      chrome.runtime.getBackgroundPage(function(eventPage) {
        var options;
        options = eventPage.controller.options;
        return options.items(function(items) {
          _this.$downloadSiteFolder.prop('checked', items.downloadSiteFolder);
          _this.$downloadDateFolder.prop('checked', items.downloadDateFolder);
          _this.$downloadFolderSample.text(options.sampleDownloadFolder(items));
          return callback();
        });
      });
      return this;
    };

    OptionsView.prototype.onChange = function() {
      var _this = this;
      chrome.runtime.getBackgroundPage(function(eventPage) {
        var options;
        options = eventPage.controller.options;
        return options.items(function(items) {
          items.downloadSiteFolder = _this.$downloadSiteFolder.prop('checked');
          items.downloadDateFolder = _this.$downloadDateFolder.prop('checked');
          _this.$downloadFolderSample.text(options.sampleDownloadFolder(items));
          return options.setItems(items, function() {
            return null;
          });
        });
      });
      return this;
    };

    OptionsView.prototype.onSignoutClick = function(event) {
      event.preventDefault();
      chrome.runtime.getBackgroundPage(function(eventPage) {
        var _this = this;
        return eventPage.controller.signOut(function() {
          return null;
        });
      });
      return false;
    };

    OptionsView.prototype.onSigninClick = function(event) {
      chrome.runtime.getBackgroundPage(function(eventPage) {
        var _this = this;
        return eventPage.controller.signIn(function() {
          return null;
        });
      });
      return false;
    };

    OptionsView.prototype.reloadUserInfo = function() {
      var _this = this;
      chrome.runtime.getBackgroundPage(function(eventPage) {
        return eventPage.controller.dropboxChrome.userInfo(function(userInfo) {
          if (userInfo.name) {
            _this.$userNoInfo.addClass('hidden');
            _this.$userInfo.removeClass('hidden');
            _this.$userName.text(userInfo.name);
            return _this.$userEmail.text(userInfo.email);
          } else {
            _this.$userNoInfo.removeClass('hidden');
            return _this.$userInfo.addClass('hidden');
          }
        });
      });
      return this;
    };

    OptionsView.prototype.onMessage = function(message) {
      switch (message.notice) {
        case 'dropbox_auth':
          return this.reloadUserInfo();
      }
    };

    return OptionsView;

  })();

  $(function() {
    window.view = new OptionsView(document.body);
  });

}).call(this);