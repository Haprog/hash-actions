/*! hash-actions v0.0.2 | Kari Söderholm | https://github.com/Haprog/hash-actions */
window.hashActions = (function () {
	var registeredHashes = [];
	var oldHash = window.location.hash;
	var hashActions = {
		hideEmptyHashFromURL: false,

		removeHashSymbol: function (url) {
			return url.split('#')[0];
		},
		setHash: function (hash) {
			if (hash === '') {
				this.removeHashWithoutReload();
			} else {
				window.location.hash = hash;
			}
		},
		setHashWithoutScrolling: function (hash) {
			var scrollV = document.body.scrollTop;
			var scrollH = document.body.scrollLeft;

			window.location.hash = hash;

			document.body.scrollTop = scrollV;
			document.body.scrollLeft = scrollH;
		},
		removeHashWithoutReload: function (triggeredByHashChange) {
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
		isCurrentHash: function (hash) {
			return window.location.hash === hash;
		},
		isRegisteredHash: function (hash) {
			return registeredHashes.indexOf(hash) > -1;
		},
		isCurrentRegisteredHash: function () {
			return this.isRegisteredHash(window.location.hash);
		},
		registerHash: function (hash, triggerOnCurrent) {
			if (this.isRegisteredHash(hash)) return;

			registeredHashes.push(hash);

			if (triggerOnCurrent && this.isCurrentHash(hash)) {
				this.triggerHashEnter(hash);
			}
		},
		unregisterHash: function (hash) {
			var i = registeredHashes.indexOf(hash);
			if (i > -1) {
				registeredHashes.splice(i, 1);
			}
		},
		_triggerCustomEvent: function (el, eventName, data) {
			if (window.CustomEvent) {
				var event = new CustomEvent(eventName, {detail: data});
			} else {
				var event = document.createEvent('CustomEvent');
				event.initCustomEvent(eventName, true, true, data);
			}
			el.dispatchEvent(event);
		},
		triggerHashEnter: function (hash) {
			this._triggerCustomEvent(document, 'hashactions:enter:' + hash);
		},
		triggerHashExit: function (hash) {
			this._triggerCustomEvent(document, 'hashactions:exit:' + hash);
		},
		onHashEnter: function (hash, callback, triggerOnCurrent) {
			this.registerHash(hash);
			document.addEventListener('hashactions:enter:' + hash, callback);

			if (triggerOnCurrent && this.isCurrentHash(hash)) {
				callback();
			}
		},
		onHashExit: function (hash, callback) {
			this.registerHash(hash);
			document.addEventListener('hashactions:exit:' + hash, callback);
		},
		// Shorthand for defining both onHashEnter and onHashExit
		on: function (hash, o, triggerEnterOnCurrent) {
			if (typeof o.exit === 'function') {
				this.onHashExit(hash, o.exit);
			}
			if (typeof o.enter === 'function') {
				this.onHashEnter(hash, o.enter, triggerEnterOnCurrent);
			}
		},
		_onHashChange: function (hash) {
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
})();
