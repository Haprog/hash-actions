/*! hash-actions v0.0.3 | Kari Söderholm | https://github.com/Haprog/hash-actions */
window.hashActions = (() => {
  const registeredHashes = [];
  let oldHash = window.location.hash;
  const hashActions = {
    hideEmptyHashFromURL: false,

    removeHashSymbol(url) {
      return url.split('#')[0];
    },

    setHash(hash) {
      if (hash === '') {
        this.removeHashWithoutReload();
      } else {
        window.location.hash = hash;
      }
    },

    setHashWithoutScrolling(hash) {
      const scrollV = document.body.scrollTop;
      const scrollH = document.body.scrollLeft;

      window.location.hash = hash;

      document.body.scrollTop = scrollV;
      document.body.scrollLeft = scrollH;
    },

    removeHashWithoutReload(triggeredByHashChange) {
      const loc = window.location;
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

    isCurrentHash(hash) {
      return window.location.hash === hash;
    },

    isRegisteredHash(hash) {
      return registeredHashes.indexOf(hash) > -1;
    },

    isCurrentRegisteredHash() {
      return this.isRegisteredHash(window.location.hash);
    },

    registerHash(hash, triggerOnCurrent) {
      if (this.isRegisteredHash(hash)) return;

      registeredHashes.push(hash);

      if (triggerOnCurrent && this.isCurrentHash(hash)) {
        this.triggerHashEnter(hash);
      }
    },

    unregisterHash(hash) {
      const i = registeredHashes.indexOf(hash);
      if (i > -1) {
        registeredHashes.splice(i, 1);
      }
    },

    _triggerCustomEvent(el, eventName, data) {
      let event;
      if (window.CustomEvent) {
        event = new CustomEvent(eventName, { detail: data });
      } else {
        event = document.createEvent('CustomEvent');
        event.initCustomEvent(eventName, true, true, data);
      }
      el.dispatchEvent(event);
    },

    triggerHashEnter(hash) {
      this._triggerCustomEvent(document, `hashactions:enter:${hash}`, { hash });
    },

    triggerHashExit(hash) {
      this._triggerCustomEvent(document, `hashactions:exit:${hash}`, { hash });
    },

    onHashEnter(hash, callback, triggerOnCurrent) {
      this.registerHash(hash);
      document.addEventListener(`hashactions:enter:${hash}`, callback);

      if (triggerOnCurrent && this.isCurrentHash(hash)) {
        this.triggerHashEnter(hash);
      }
    },

    onHashExit(hash, callback) {
      this.registerHash(hash);
      document.addEventListener(`hashactions:exit:${hash}`, callback);
    },

    // Shorthand for defining both onHashEnter and onHashExit
    on(hash, o, triggerEnterOnCurrent) {
      if (typeof o.exit === 'function') {
        this.onHashExit(hash, o.exit);
      }
      if (typeof o.enter === 'function') {
        this.onHashEnter(hash, o.enter, triggerEnterOnCurrent);
      }
    },

    _onHashChange(hash) {
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
    },
  };

  window.addEventListener('hashchange', () => {
    hashActions._onHashChange(window.location.hash);
  });

  return hashActions;
})();
