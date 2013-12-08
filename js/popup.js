(function() {

 var DownloadsView = (function() {

    function DownloadsView(root) {
      var _this = this;
      this.root = root;
      this.$root = $(this.root);
      this.$header = $('#header', this.$root);

      this.$userInfo = $('#dropbox-info', this.$header);
      this.$userNoInfo = $('#dropbox-no-info', this.$header);
      this.$userName = $('#dropbox-name', this.$userInfo);
      this.$userEmail = $('#dropbox-email', this.$userInfo);

      this.$optionsButton = $('#options-button', this.$header);
      this.$optionsButton.click(function(event) {
        return _this.onOptionsClick(event);
      });


      chrome.extension.onMessage.addListener(function(message) {
        return _this.onMessage(message);
      });

      this.reloadUserInfo();
      this.updateFileList();
    }

    DownloadsView.prototype.reloadUserInfo = function() {
      var _this = this;
      chrome.runtime.getBackgroundPage(function(eventPage) {
        return eventPage.controller.dropboxChrome.userInfo(function(userInfo) {
          if (userInfo.name) {
            _this.$userInfo.removeClass('hidden');
            _this.$userNoInfo.addClass('hidden');
            _this.$userName.text(userInfo.name);
            return _this.$userEmail.text(userInfo.email);
          } else {
            _this.$userInfo.addClass('hidden');
            return _this.$userNoInfo.removeClass('hidden');
          }
        });
      });
      return this;
    };

    DownloadsView.prototype.updateFileList = function() {
      var _this = this;
      chrome.runtime.getBackgroundPage(function(eventPage) {

        var html = [];
        return eventPage.controller.dropboxClient.pullChanges(function(err, data) {

          var lastChanges = data.changes.slice(0, 3);

          lastChanges.forEach(function(item) {
            html.push(JSON.stringify(item), '\t');
          });

          $('section').text(html.join('</br>'));


        });

      });
      return this;
    };

    DownloadsView.prototype.onOptionsClick = function(event) {
      chrome.tabs.create({
        url: 'html/options.html',
        active: true,
        pinned: false
      });
      return window.close();
    };

    DownloadsView.prototype.onMessage = function(message) {
      switch (message.notice) {
        case 'update_file':
          return this.updateFile(message.fileUid);
        case 'update_files':
          return this.updateFileList();
        case 'dropbox_auth':
          return this.reloadUserInfo();
      }
    };

    return DownloadsView;

  })();

  $(function() {
    window.view = new DownloadsView(document.body);
  });

}).call(this);