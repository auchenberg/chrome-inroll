(function() {

 var DownloadsView = (function() {

    function getImageDataURL(url, callback) {
        var data, canvas, ctx;
        var img =  document.createElement("img");
        img.setAttribute('crossOrigin','anonymous');

        img.onload = function(){
            // Create the canvas element.
            canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            // Get '2d' context and draw the image.
            ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            // Get canvas data URL
            data = canvas.toDataURL();

            callback(data);
        };

        img.src = url;
    }

    function storeLastPhotos(hash, photos, callback) {

      chrome.storage.local.remove('dropboxPhotos', function() {

        console.log('storeLastPhotos.photos', photos);
        chrome.storage.local.set({
          dropboxPhotos : photos,
          dropboxPhotosHash: hash
        }, callback);

      });

    }

    function getLastHash(callback) {
      chrome.storage.local.get('dropboxPhotosHash', function(data) {

        if(data && data.dropboxPhotosHash) {
          console.log('getLastPhotos.dropboxPhotosHash', data.dropboxPhotosHash);
          callback(data.dropboxPhotosHash);
        } else {
          callback(null);
        }

      });
    }

    function getLastPhotos(callback) {
      chrome.storage.local.get('dropboxPhotos', function(data) {

        if(data && data.dropboxPhotos) {
          console.log('getLastPhotos.dropboxPhotos', data.dropboxPhotos);
          callback(data.dropboxPhotos);
        } else {
          callback(null);
        }

      });
    }

    function renderPhotos() {

      console.log('dropbox.renderPhotos.start');

      var html = [];

      getLastPhotos(function(photos) {

        // Render
        photos.forEach(function(photo) {
          html.push("<div class='photo'><a href='"+photo.url+"' target='_blank'><img src='"+ photo.dataUrl +"'></a></div>");
        });

        console.log('dropbox.renderPhotos.done');

        $("#photos").html(html.join(''));
      });
    }

    function DownloadsView(root) {
      var _this = this;
      this.root = root;
      this.$root = $(this.root);

      chrome.extension.onMessage.addListener(function(message) {
        return _this.onMessage(message);
      });

      this.updateFileList();
    }

    DownloadsView.prototype.updateFileList = function() {
      var _this = this;
      chrome.runtime.getBackgroundPage(function(eventPage) {

        console.log('dropbox.stat.start');

        renderPhotos();

        getLastHash(function(hash) {

          var currentHash = hash;

          eventPage.controller.dropboxClient.stat("/Camera Uploads", { readDir: true }, function(err, data) {

              var newHash = data.contentHash;
              var photos = data._json.contents;

              if(newHash === currentHash) {
                console.log('dropbox.stat.noChanges');
                renderPhotos();
                return false;
              }

              // Sort and take newest first
              photos.sort(function(a,b) {
                return moment(b.client_mtime).toDate() - moment(a.client_mtime).toDate();
              });

              // Take first 24
              photos = photos.slice(0, 24);

              var photoCount = photos.length;

              console.log('dropbox.stat.finished', photoCount);

              var mappedPhotos = [];

              photos.forEach(function(photo, index) {
                var url = eventPage.controller.dropboxClient.thumbnailUrl(photo.path, { size: "l" });
                photo.url = url;

                getImageDataURL(photo.url, function(dataUrl) {
                  photo.dataUrl = dataUrl;

                  mappedPhotos.push(photo);

                  if(index+1 === photoCount) {

                    // Sort and take newest first, since the fetching is async.

                    mappedPhotos.sort(function(a,b) {
                      return moment(b.client_mtime).toDate() - moment(a.client_mtime).toDate();
                    });


                    console.log('mappedPhotos.done', mappedPhotos.length);
                    storeLastPhotos(newHash, mappedPhotos, function() {
                      renderPhotos();
                    });
                  }

                });

              });
            });


        });

      });

      return this;
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