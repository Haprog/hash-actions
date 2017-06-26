'use strict';

/*! hash-actions v0.0.3 | Kari Söderholm | https://github.com/Haprog/hash-actions */
window.hashActions = function () {
  var registeredHashes = [];
  var oldHash = window.location.hash;
  var hashActions = {
    hideEmptyHashFromURL: false,

    removeHashSymbol: function removeHashSymbol(url) {
      return url.split('#')[0];
    },
    setHash: function setHash(hash) {
      if (hash === '') {
        this.removeHashWithoutReload();
      } else {
        window.location.hash = hash;
      }
    },
    setHashWithoutScrolling: function setHashWithoutScrolling(hash) {
      var scrollV = document.body.scrollTop;
      var scrollH = document.body.scrollLeft;

      window.location.hash = hash;

      document.body.scrollTop = scrollV;
      document.body.scrollLeft = scrollH;
    },
    removeHashWithoutReload: function removeHashWithoutReload(triggeredByHashChange) {
      var loc = window.location;
      if ('replaceState' in history) {
        history.replaceState('', document.title, loc.pathname + loc.search);

        if (oldHash !== '' && !triggeredByHashChange) {
          this._onHashChange('');
        }
      } else if (loc.hash !== '') {
        // Fallback for old browsers
        this.setHashWithoutScrolling('');
      }
    },
    isCurrentHash: function isCurrentHash(hash) {
      return window.location.hash === hash;
    },
    isRegisteredHash: function isRegisteredHash(hash) {
      return registeredHashes.indexOf(hash) > -1;
    },
    isCurrentRegisteredHash: function isCurrentRegisteredHash() {
      return this.isRegisteredHash(window.location.hash);
    },
    registerHash: function registerHash(hash, triggerOnCurrent) {
      if (this.isRegisteredHash(hash)) return;

      registeredHashes.push(hash);

      if (triggerOnCurrent && this.isCurrentHash(hash)) {
        this.triggerHashEnter(hash);
      }
    },
    unregisterHash: function unregisterHash(hash) {
      var i = registeredHashes.indexOf(hash);
      if (i > -1) {
        registeredHashes.splice(i, 1);
      }
    },
    _triggerCustomEvent: function _triggerCustomEvent(el, eventName, data) {
      var event = void 0;
      if (window.CustomEvent) {
        event = new CustomEvent(eventName, { detail: data });
      } else {
        event = document.createEvent('CustomEvent');
        event.initCustomEvent(eventName, true, true, data);
      }
      el.dispatchEvent(event);
    },
    triggerHashEnter: function triggerHashEnter(hash) {
      this._triggerCustomEvent(document, 'hashactions:enter:' + hash);
    },
    triggerHashExit: function triggerHashExit(hash) {
      this._triggerCustomEvent(document, 'hashactions:exit:' + hash);
    },
    onHashEnter: function onHashEnter(hash, callback, triggerOnCurrent) {
      this.registerHash(hash);
      document.addEventListener('hashactions:enter:' + hash, callback);

      if (triggerOnCurrent && this.isCurrentHash(hash)) {
        callback();
      }
    },
    onHashExit: function onHashExit(hash, callback) {
      this.registerHash(hash);
      document.addEventListener('hashactions:exit:' + hash, callback);
    },


    // Shorthand for defining both onHashEnter and onHashExit
    on: function on(hash, o, triggerEnterOnCurrent) {
      if (typeof o.exit === 'function') {
        this.onHashExit(hash, o.exit);
      }
      if (typeof o.enter === 'function') {
        this.onHashEnter(hash, o.enter, triggerEnterOnCurrent);
      }
    },
    _onHashChange: function _onHashChange(hash) {
      if (hash !== oldHash && this.isRegisteredHash(oldHash)) {
        this.triggerHashExit(oldHash);
      }
      if (this.isRegisteredHash(hash)) {
        this.triggerHashEnter(hash);
      }
      oldHash = hash;

      if (hash === '' && this.hideEmptyHashFromURL) {
        this.removeHashWithoutReload(true);
      }
    }
  };

  window.addEventListener('hashchange', function () {
    hashActions._onHashChange(window.location.hash);
  });

  return hashActions;
}();

//# sourceMappingURL=hash-actions.js.map