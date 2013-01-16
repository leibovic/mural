'use strict';

var PATTERNS_TOP = 'http://www.colourlovers.com/api/patterns/top';

var pickActivity;

window.addEventListener('DOMContentLoaded', function onDOMContentLoaded() {
  checkInstalled();
  loadPatterns();

  document.getElementById('patterns').addEventListener('click', pickWallpaper);
  document.getElementById('cancel').addEventListener('click', cancelPick);

  if (!navigator.mozSetMessageHandler)
    return;

  navigator.mozSetMessageHandler('activity', function handleActivity(request) {
    if (request.source.name !== 'pick')
      return;

    pickActivity = request;
    document.body.setAttribute('pick', true);
  });
});

function checkInstalled() {
  var request = window.navigator.mozApps.getSelf();
  request.onsuccess = function getSelfSuccess() {
    // Bail if the app is already installed
    if (request.result) {
      document.body.setAttribute('installed', true);
      return;
    }

    var installButton = document.getElementById('install');
    installButton.addEventListener('click', installApp);
  };
  request.onerror = function getSelfError() {
    console.warn('error getting self: ' + request.error.name);
  };
}

function installApp() {
  var location = window.location.href;
  var manifest = location.substring(0, location.lastIndexOf('/')) + '/manifest.webapp';
  console.log('installApp: ' + manifest);

  var request = navigator.mozApps.install(manifest);
  request.onsuccess = function installSuccess() {
    console.log('success installing app: ' + request.result.manifest.name);
    document.body.setAttribute('installed', true);
  };
  request.onerror = function installError() {
    console.warn('error installing app: ' + request.error.name);
  };
}

function loadPatterns() {
  var s = document.createElement('script');
  s.type = 'text/javascript';
  s.src = PATTERNS_TOP + '?format=json&jsonCallback=patternsCallback';
  document.head.appendChild(s);
}

function patternsCallback(json) {
  var patternsList = document.getElementById('patterns');

  json.forEach(function createItem(pattern) {
    var item = document.createElement('li');
    item.dataset.url = pattern.imageUrl;
    item.style.backgroundImage = 'url(' + pattern.imageUrl + ')';

    patternsList.appendChild(item);    
  });
}

function pickWallpaper(e) {
  var url = e.target.dataset.url;
  console.log('pickWallpaper: ' + url);
  if (!url)
    return;

  var img = new Image();
  // Proxy image to avoid cross-origin security exception
  img.src = 'image.cgi?url=' + url;
  img.onload = function() {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    canvas.width = 320;
    canvas.height = 480;
    context.drawImage(img, 0, 0);
    canvas.toBlob(handleBlob);
  };
}

// posts result to pick activity, or starts new share activity,
// depending on the state of the app
function handleBlob(blob) {
  if (pickActivity) {
    console.log('handleBlob: post result to pick activity');

    pickActivity.postResult({
      type: 'image/png',
      blob: blob
    }, 'image/png');

    pickActivity = null;
    document.body.removeAttibute('pick');
    return;
  }

  console.log('handleBlob: start a share activity');

  var a = new MozActivity({
    name: 'share',
    data: {
      type: 'image/*',
      number: 1,
      blobs: [blob],
      // These are needed as a workaround to bluetooth issue
      filenames: ['wallpaper.png'],
      filepaths: ['wallpaper.png']
    }
  });

  a.onerror = function(e) {
    console.warn('share activity error: ', a.error.name);
  };
}

function cancelPick(e) {
  if (!pickActivity)
    return;

  pickActivity.postError('cancelled');
  pickActivity = null;
  document.body.removeAttibute('pick');
}
