"use strict";

/*! hash-actions v0.1.0 | Kari Söderholm | https://github.com/Haprog/hash-actions */
window.hashActions = function () {
  /**
   * @type {string[]}
   * @memberof hashActions
   * @inner
   * @private
   */
  var registeredHashes = [];
  /**
   * Used for checking what was the previously active hash (for triggering exit events).
   * This is read and updated in {@link hashActions._onHashChange}.
   *
   * The previous hash could also be read from
   * [`HashChangeEvent.oldURL`](https://developer.mozilla.org/en-US/docs/Web/API/HashChangeEvent/oldURL)
   * but that's not supported on IE11 (and should check support on previous Safari versions). This
   * can probably be dropped in the future when browser support for `HashChangeEvent.oldURL` is
   * good enough.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HashChangeEvent/oldURL
   * @see https://caniuse.com/#feat=mdn-api_hashchangeevent_oldurl
   *
   * @type {string[]}
   * @memberof hashActions
   * @inner
   * @private
   */

  var oldHash = window.location.hash;
  /**
   * `window.hashActions`
   * @global
   * @namespace
   */

  var hashActions = {
    /**
     * When set to true, the hash symbol is automatically removed from the current URL whenever
     * `window.location.hash` is set to empty.
     *
     * This is done in a `hashchange` event listener so this will have an effect not only when the
     * hash is changed using hashActions, but also when any code sets `window.location.hash`.
     * @type {boolean}
     */
    hideEmptyHashFromURL: false,

    /**
     * Removes the hash/fragment part from the given URL string.
     * @param {string} url A URL
     * @return The given URL without the hash/fragment part
     */
    removeHashSymbol: function removeHashSymbol(url) {
      return url.split('#')[0];
    },

    /**
     * Sets the given hash as the currently active hash.
     *
     * Basically this just sets `window.location.hash` unless the given hash is an empty string,
     * then {@link hashActions.removeHashWithoutReload} will be called.
     *
     * @see hashActions.removeHashWithoutReload
     *
     * @param {string} hash The hash to set
     */
    setHash: function setHash(hash) {
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
    setHashWithoutScrolling: function setHashWithoutScrolling(hash) {
      var scrollV = document.documentElement.scrollTop;
      var scrollH = document.documentElement.scrollLeft;
      window.location.hash = hash;
      document.documentElement.scrollTop = scrollV;
      document.documentElement.scrollLeft = scrollH;
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
    removeHashWithoutReload: function removeHashWithoutReload(triggeredByHashChange) {
      var loc = window.location;

      if ('replaceState' in window.history) {
        var _oldHash = window.location.hash;
        window.history.replaceState('', document.title, loc.pathname + loc.search);

        if (_oldHash !== '' && !triggeredByHashChange) {
          // Trigger the hash change logic in case this method wasn't called by `_onHashChange()`
          this._onHashChange('');
        }
      } else if (loc.hash !== '') {
        // Fallback for old browsers (this can probably be removed, check browser support)
        this.setHashWithoutScrolling('');
      }
    },

    /**
     * Check if the given hash matches the currently active hash
     * @param {string} hash The hash to check
     * @return {boolean} True if the given hash matches the currently active hash
     */
    isCurrentHash: function isCurrentHash(hash) {
      return window.location.hash === hash;
    },

    /**
     * Check if the given hash has been registered
     * @param {string} hash The hash to check
     * @return {boolean} True if the given hash has been registered
     */
    isRegisteredHash: function isRegisteredHash(hash) {
      return registeredHashes.indexOf(hash) > -1;
    },

    /**
     * Check if the currently active hash has been registered
     * A shorthand for `isRegisteredHash(window.location.hash)`
     * @return {boolean} True if the currently active hash has been registered
     */
    isCurrentRegisteredHash: function isCurrentRegisteredHash() {
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
    registerHash: function registerHash(hash, triggerOnCurrent) {
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
    unregisterHash: function unregisterHash(hash) {
      var i = registeredHashes.indexOf(hash);

      if (i > -1) {
        registeredHashes.splice(i, 1);
      }
    },

    /**
     * Unregisters all hashes.
     * @private
     */
    _clearRegisteredHashes: function _clearRegisteredHashes() {
      registeredHashes.length = 0;
    },

    /**
     * Triggers a custom event on the given target.
     * @private
     * @param {EventTarget} target The event target to dispatch the event on (e.g. an Element)
     * @param {string} eventName Name of the custom event to dispatch
     * @param {object} data The data to include as `event.detail`
     */
    _triggerCustomEvent: function _triggerCustomEvent(target, eventName, data) {
      /** @type {CustomEvent} */
      var event;

      if (window.CustomEvent) {
        event = new CustomEvent(eventName, {
          detail: data
        });
      } else {
        // IE11 support
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
    triggerHashEnter: function triggerHashEnter(hash) {
      this._triggerCustomEvent(document, "hashactions:enter:".concat(hash), {
        hash: hash
      });
    },

    /**
     * Trigger a hash exit event on `document` for the given hash.
     * `hashactions:exit:<hash>` is the name of the event that will be dispatched.
     * The event `detail` will include the hash as property `hash`.
     * @param {string} hash The hash for which to trigger an exit event
     */
    triggerHashExit: function triggerHashExit(hash) {
      this._triggerCustomEvent(document, "hashactions:exit:".concat(hash), {
        hash: hash
      });
    },

    /**
     * @callback HashEventListener
     * @param {CustomEvent} event
     */

    /**
     * Register an enter listener for the given hash.
     * Whenever the given hash becomes the active hash, the given callback will be called.
     *
     * @example
     * hashActions.onHashEnter('#contact', () => contactDialog.open(), true);
     *
     * @param {string} hash The hash for which to register an enter event listener
     * @param {HashEventListener} callback The enter event listener
     * @param {boolean} triggerOnCurrent If true and if the given hash is currently active,
     *                                   triggers the hash enter event immediately
     */
    onHashEnter: function onHashEnter(hash, callback, triggerOnCurrent) {
      this.registerHash(hash);
      document.addEventListener("hashactions:enter:".concat(hash), callback);

      if (triggerOnCurrent && this.isCurrentHash(hash)) {
        this.triggerHashEnter(hash);
      }
    },

    /**
     * Register an exit listener for the given hash.
     * Whenever the currently active hash is changed from the given hash to something else, the
     * given callback will be called.
     *
     * @example
     * hashActions.onHashExit('#contact', () => contactDialog.close());
     *
     * @param {string} hash The hash for which to register an exit event listener
     * @param {HashEventListener} callback The exit event listener
     */
    onHashExit: function onHashExit(hash, callback) {
      this.registerHash(hash);
      document.addEventListener("hashactions:exit:".concat(hash), callback);
    },

    /**
     * Options object for the `on()` method to provide enter and exit listeners
     * @typedef {object} OnListenersHash
     * @property {HashEventListener} enter The enter event listener
     * @property {HashEventListener} exit The exit event listener
     */

    /**
     * A shorthand for registering both enter and exit listeners for a hash.
     *
     * @example
     * hashActions.on('#contact', {
     *   enter: () => contactDialog.open(),
     *   exit: () => contactDialog.close()
     * }, true);
     *
     * @see hashActions.onHashEnter
     * @see hashActions.onHashExit
     *
     * @param {string} hash The hash for which to register event listeners
     * @param {OnListenersHash} o An object which should have function properties `enter` and
     *                            `exit` for defining the event listener callbacks
     * @param {boolean} triggerEnterOnCurrent If true and if the given hash is currently active,
     *                                        triggers the hash enter event immediately
     */
    on: function on(hash, o, triggerEnterOnCurrent) {
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
     * @private
     * @param {string} hash The new hash that has just became the active hash
     */
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