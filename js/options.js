(function() {

  var Options = (function() {

    function Options() {
      var _this = this;
      this._items = null;
      this._itemsCallbacks = null;
      this.loadedAt = null;
      this.onChange = new Dropbox.Util.EventSource;
      chrome.storage.onChanged.addListener(function(changes, areaName) {
        return _this.onStorageChanges(changes, areaName);
      });
    }

    Options.prototype.onChange = null;

    Options.prototype.items = function(callback) {
      var _this = this;
      if (this._items) {
        if (Date.now() - this.loadedAt < this.cacheDurationMs) {
          callback(this._items);
          return this;
        } else {
          this._items = null;
        }
      }
      if (this._itemsCallbacks) {
        this._itemsCallbacks.push(callback);
        return this;
      }
      this._itemsCallbacks = [callback];
      chrome.storage.sync.get('settings', function(storage) {
        var callbacks, items, _i, _len, _results;
        items = storage.settings || {};
        _this.addDefaults(items);
        _this._items = items;
        _this.loadedAt = Date.now();
        callbacks = _this._itemsCallbacks;
        _this._itemsCallbacks = null;
        _results = [];
        for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
          callback = callbacks[_i];
          _results.push(callback(_this._items));
        }
        return _results;
      });
      return this;
    };

    Options.prototype.setItems = function(items, callback) {
      var _this = this;
      chrome.storage.sync.set({
        settings: items
      }, function() {
        _this._items = items;
        _this.loadedAt = Date.now();
        if (callback) {
          return callback();
        }
      });
      return this;
    };

    Options.prototype.sampleDownloadFolder = function(items) {
      var folder;
      folder = '/Apps/Chrome Downloads';
      if (items.downloadDateFolder) {
        folder += '/' + humanize.date('Y-m-d', new Date());
      }
      if (items.downloadSiteFolder) {
        folder += '/en.wikipedia.org';
      }
      return folder;
    };

    Options.prototype.downloadPath = function(file, items) {
      var uploadPath;
      uploadPath = file.uploadBasename();
      if (items.downloadDateFolder) {
        uploadPath = humanize.date('Y-m-d', new Date(file.startedAt)) + '/' + uploadPath;
      }
      if (items.downloadSiteFolder) {
        uploadPath = new URI(file.url).hostname() + '/' + uploadPath;
      }
      return uploadPath;
    };

    Options.prototype.onStorageChanges = function(changes, areaName) {
      var items;
      if (areaName !== 'sync') {
        return;
      }
      if (!('settings' in changes)) {
        return;
      }
      items = changes['settings'].newValue || {};
      this.addDefaults(items);
      this._items = items;
      this.loadedAt = Date.now();
      return this.onChange.dispatch(this._items);
    };

    Options.prototype.addDefaults = function(items) {
      if (!('downloadSiteFolder' in items)) {
        items.downloadSiteFolder = false;
      }
      if (!('downloadDateFolder' in items)) {
        items.downloadDateFolder = false;
      }
      if (!('autoDownload' in items)) {
        items.autoDownload = false;
      }
      if (!('autoDownloadExts' in items)) {
        items.autoDownloadExts = [];
      }
      if (!('autoDownloadMimes' in items)) {
        items.autoDownloadMimes = [];
      }
      return items;
    };

    Options.prototype.cacheDurationMs = 10 * 60;

    return Options;

  })();

  window.Options = Options;

}).call(this);