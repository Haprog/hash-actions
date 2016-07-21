/* eslint-env jquery */
(function($){
	var registeredHashes = [];
	var oldHash = window.location.hash;
	$.hashActions = {
		hideEmptyHashFromURL: false,

		removeHashSymbol: function (url) {
			return url.split("#")[0];
		},
		setHash: function (hash) {
			if (hash === "") {
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
			if ("replaceState" in history) {
				history.replaceState("", document.title, loc.pathname + loc.search);

				if (oldHash !== "" && !triggeredByHashChange) {
					this._onHashChange("");
				}
			} else if (loc.hash !== "") {
				// Fallback for old browsers
				this.setHashWithoutScrolling("");
			}
		},
		isCurrentHash: function (hash) {
			return window.location.hash === hash;
		},
		isRegisteredHash: function (hash) {
			return $.inArray(hash, registeredHashes) > -1;
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
			var i = $.inArray(hash, registeredHashes);
			if (i > -1) {
				registeredHashes.splice(i, 1);
			}
		},
		triggerHashEnter: function (hash) {
			$(document).trigger("hashactions:enter:" + hash);
		},
		triggerHashExit: function (hash) {
			$(document).trigger("hashactions:exit:" + hash);
		},
		onHashEnter: function (hash, callback, triggerOnCurrent) {
			this.registerHash(hash);
			$(document).on("hashactions:enter:" + hash, callback);

			if (triggerOnCurrent && this.isCurrentHash(hash)) {
				callback();
			}
		},
		onHashExit: function (hash, callback) {
			this.registerHash(hash);
			$(document).on("hashactions:exit:" + hash, callback);
		},
		// Shorthand for defining both onHashEnter and onHashExit
		on: function (hash, o, triggerEnterOnCurrent) {
			if (typeof o.exit === "function") {
				this.onHashExit(hash, o.exit);
			}
			if (typeof o.enter === "function") {
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

			if (hash === "" && this.hideEmptyHashFromURL) {
				this.removeHashWithoutReload(true);
			}
		}
	};
	$(window).on("hashchange", function () {
		$.hashActions._onHashChange(window.location.hash);
	});
})(jQuery);
