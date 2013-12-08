(function() {

 var DownloadsView = (function() {

    function saveCursorKey(key) {
      chrome.storage.sync.set({
        dropboxDeltaCursor: key
      });
    }

    function getCursorKey(callback){
      chrome.storage.sync.get('dropboxDeltaCursor', function(data) {

        if(data && data.dropboxDeltaCursor) {
          callback(data.dropboxDeltaCursor);
        } else {
          callback(null);
        }

      });
    }

    function storeChanges(changes) {
      chrome.storage.sync.set({
        dropboxLastChanges: changes
      });
    }

    function getStoredLastChanges(callback) {
      chrome.storage.sync.get('dropboxLastChanges', function(data) {

        if(data && data.dropboxLastChanges) {
          callback(data.dropboxLastChanges);
        } else {
          callback(null);
        }

      });
    }

    function getLatestChangesFromDropbox() {

      var dfd = Q.defer();

      chrome.runtime.getBackgroundPage(function(eventPage) {

        getCursorKey(function(key) {

          console.log('dropbox.pullChanges.fetching');

          eventPage.controller.dropboxClient.pullChanges(key, function(err, data) {

            if(err) {
              console.log('dropbox.pullChanges.error');
              dfd.reject(err);
            }

            console.log('dropbox.pullChanges.done');

            if(data.cursorTag) {
              saveCursorKey(data.cursorTag);
              window.console.log('dropbox.pullChanges.cursorTag.updated', data.cursorTag);
              window.console.log('dropbox.pullChanges.changes.number', data.changes.length);
            }

            if(data.shouldPullAgain) {
              console.log('dropbox.pullChanges.pullAgain');
              getLatestChangesFromDropbox().then(function(changes) {
                dfd.resolve(changes);
              });
            }

            if(data.changes && data.changes.length) {
              console.log('dropbox.pullChanges.storedChanges');
              storeChanges(data.changes);
            }

            getStoredLastChanges(function(changes) {
              console.log('dropbox.pullChanges.done');
              dfd.resolve(changes);
            });

          });

        });

      });

      return dfd.promise;

    };

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

      this.dropboxCursor = null;

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

      var promise = getLatestChangesFromDropbox();

      $('section').text('Syncig with Dropbox...');

      promise.done(function(changes) {
        var html = [];
        changes.forEach(function(item) {
          html.push(JSON.stringify(item), '\t');
        });
        $('section').text(html.join('</br>'));
      }.bind(this));

      promise.fail(function(err) {
        $('section').text('Something went wrong' + err);
        window.console.log('err', err);
      }.bind(this));

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