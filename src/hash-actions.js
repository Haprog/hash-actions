/*! hash-actions v0.0.4 | Kari Söderholm | https://github.com/Haprog/hash-actions */
window.hashActions = (() => {
  const registeredHashes = [];
  let oldHash = window.location.hash;
  const hashActions = {
    hideEmptyHashFromURL: false,

    /**
     * Removes the hash/fragment part from the given URL string.
     * @param {string} url A URL
     * @return The given URL without the hash/fragment part
     */
    removeHashSymbol(url) {
      return url.split('#')[0];
    },

    /**
     * Sets the given hash as the currently active hash.
     *
     * Basically this just sets `window.location.hash` unless the given hash is an empty string,
     * then `removeHashWithoutReload()` will be called.
     *
     * @see removeHashWithoutReload
     *
     * @param {string} hash The hash to set
     */
    setHash(hash) {
      if (hash === '') {
        this.removeHashWithoutReload();
      } else {
        window.location.hash = hash;
      }
    },

    /**
     * Sets the given hash as the currently active hash without scrolling the page.
     *
     * Saves the current scroll position before setting the hash and then restores it to prevent
     * the page from scrolling in case setting the hash would otherwise cause the page to scroll.
     *
     * @param {string} hash The hash to set
     */
    setHashWithoutScrolling(hash) {
      const scrollV = document.body.scrollTop;
      const scrollH = document.body.scrollLeft;

      window.location.hash = hash;

      document.body.scrollTop = scrollV;
      document.body.scrollLeft = scrollH;
    },

    /**
     * Remove the hash from the URL without reloading the page.
     *
     * This will use `window.history.replaceState()` on supported browsers to completely remove
     * the hash symbol `#` from the URL since just setting `window.location.hash` to an empty
     * string would keep the ugly `#` visible at the end of the URL.
     *
     * Will fall back to setting `window.location.hash` on browsers that don't support
     * `history.replaceState()`. Mainly on very old Android, old iPhone or IE9 and older.
     *
     * @param {boolean} triggeredByHashChange Set to true when called from internal logic in
     *                                        `_onHashChange()`
     */
    removeHashWithoutReload(triggeredByHashChange) {
      const loc = window.location;
      if ('replaceState' in window.history) {
        window.history.replaceState('', document.title, loc.pathname + loc.search);

        if (oldHash !== '' && !triggeredByHashChange) {
          // Trigger the hash change logic in case this method wasn't called by `_onHashChange()`
          this._onHashChange('');
        }
      } else if (loc.hash !== '') {
        // Fallback for old browsers
        this.setHashWithoutScrolling('');
      }
    },

    /**
     * Check if the given hash matches the currently active hash
     * @param {string} hash The hash to check
     * @return {boolean} True if the given hash matches the currently active hash
     */
    isCurrentHash(hash) {
      return window.location.hash === hash;
    },

    /**
     * Check if the given hash has been registered
     * @param {string} hash The hash to check
     * @return {boolean} True if the given hash has been registered
     */
    isRegisteredHash(hash) {
      return registeredHashes.indexOf(hash) > -1;
    },

    /**
     * Check if the currently active hash has been registered
     * A shorthand for `isRegisteredHash(window.location.hash)`
     * @return {boolean} True if the currently active hash has been registered
     */
    isCurrentRegisteredHash() {
      return this.isRegisteredHash(window.location.hash);
    },

    /**
     * Registers the given hash.
     * For registered hashes hash-actions will trigger custom hash enter and hash exit events on
     * `document`.
     *
     * `hashactions:enter:<hash>` event will be triggered when the registered hash becomes the
     * currently active hash.
     *
     * `hashactions:exit:<hash>` event will be triggered when the currently active hash is changed
     * from the registered hash to something else.
     *
     * @param {string} hash The hash to register
     * @param {boolean} triggerOnCurrent If true and if the given hash is currently active,
     *                                   triggers the hash enter event immediately
     */
    registerHash(hash, triggerOnCurrent) {
      if (this.isRegisteredHash(hash)) return;

      registeredHashes.push(hash);

      if (triggerOnCurrent && this.isCurrentHash(hash)) {
        this.triggerHashEnter(hash);
      }
    },

    /**
     * Unregisters the given hash.
     * Custom hash enter and exit events are not triggered for unregistered hashes.
     * @param {string} hash The hash to unregister
     */
    unregisterHash(hash) {
      const i = registeredHashes.indexOf(hash);
      if (i > -1) {
        registeredHashes.splice(i, 1);
      }
    },

    /**
     * Unregisters all hashes.
     */
    _clearRegisteredHashes() {
      registeredHashes.length = 0;
    },

    /**
     * Triggers a custom event on the given target.
     * @param {EventTarget} target The event target to dispatch the event on (e.g. an Element)
     * @param {string} eventName Name of the custom event to dispatch
     * @param {object} data The data to include as `event.detail`
     */
    _triggerCustomEvent(target, eventName, data) {
      let event;
      if (window.CustomEvent) {
        event = new CustomEvent(eventName, { detail: data });
      } else {
        event = document.createEvent('CustomEvent');
        event.initCustomEvent(eventName, true, true, data);
      }
      target.dispatchEvent(event);
    },

    /**
     * Trigger a hash enter event on `document` for the given hash.
     * `hashactions:enter:<hash>` is the name of the event that will be dispatched.
     * The event `detail` will include the hash as property `hash`.
     * @param {string} hash The hash for which to trigger an enter event
     */
    triggerHashEnter(hash) {
      this._triggerCustomEvent(document, `hashactions:enter:${hash}`, { hash });
    },

    /**
     * Trigger a hash exit event on `document` for the given hash.
     * `hashactions:exit:<hash>` is the name of the event that will be dispatched.
     * The event `detail` will include the hash as property `hash`.
     * @param {string} hash The hash for which to trigger an exit event
     */
    triggerHashExit(hash) {
      this._triggerCustomEvent(document, `hashactions:exit:${hash}`, { hash });
    },

    /**
     * Register an enter listener for the given hash.
     * Whenever the given hash becomes the active hash, the given callback will be called.
     * @param {string} hash The hash for which to register an enter event listener
     * @param {function} callback The enter event listener
     * @param {boolean} triggerOnCurrent If true and if the given hash is currently active,
     *                                   triggers the hash enter event immediately
     */
    onHashEnter(hash, callback, triggerOnCurrent) {
      this.registerHash(hash);
      document.addEventListener(`hashactions:enter:${hash}`, callback);

      if (triggerOnCurrent && this.isCurrentHash(hash)) {
        this.triggerHashEnter(hash);
      }
    },

    /**
     * Register an exit listener for the given hash.
     * Whenever the currently active hash is changed from the given hash to something else, the
     * given callback will be called.
     * @param {string} hash The hash for which to register an exit event listener
     * @param {function} callback The exit event listener
     */
    onHashExit(hash, callback) {
      this.registerHash(hash);
      document.addEventListener(`hashactions:exit:${hash}`, callback);
    },

    /**
     * A shorthand for registering both enter and exit listeners for a hash.
     * @see onHashEnter
     * @see onHashExit
     *
     * @param {string} hash The hash for which to register event listeners
     * @param {object} o An object which should have function properties `enter` and `exit` for
     *                   defining the event listener callbacks
     * @param {boolean} triggerEnterOnCurrent If true and if the given hash is currently active,
     *                                        triggers the hash enter event immediately
     */
    on(hash, o, triggerEnterOnCurrent) {
      if (typeof o.exit === 'function') {
        this.onHashExit(hash, o.exit);
      }
      if (typeof o.enter === 'function') {
        this.onHashEnter(hash, o.enter, triggerEnterOnCurrent);
      }
    },

    /**
     * `hashchange` event handler. Contains the main logic for triggering hash enter and exit event
     * for registered hashes.
     *
     * If `hideEmptyHashFromURL` has been set to true and the new hash is an empty string, then
     * `removeHashWithoutReload()` will be called.
     *
     * @param {string} hash The new hash that has just became the active hash
     */
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
