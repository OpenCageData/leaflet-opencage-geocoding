/**
 * OpenCage Data Geocoding Control v2.5.0
 * Copyright (c) 2020-2026, OpenCage GmbH
 * support@opencagedata.com
 * https://opencagedata.com
 *
 * Licensed under the BSD license.
 * Demo: https://opencagedata.com
 * Source: git@github.com:opencagedata/leaflet-opencage-geocoding.git
 */
(function(global, factory) {
	typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("leaflet")) : typeof define === "function" && define.amd ? define(["exports", "leaflet"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global["leaflet-control-opencage-geocoding"] = {}, global.L));
})(this, function(exports, leaflet) {
	Object.defineProperties(exports, {
		__esModule: { value: true },
		[Symbol.toStringTag]: { value: "Module" }
	});
	// \0rolldown/runtime.js
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
				get: ((k) => from[k]).bind(null, key),
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));
	leaflet = __toESM(leaflet, 1);
	// src/js/geocoder.js
	var isCoordinate = (v) => (typeof v === "number" || typeof v === "string" && v.trim() !== "") && Number.isFinite(Number(v));
	var toLatLng = (point) => point && isCoordinate(point.lat) && isCoordinate(point.lng) ? leaflet.default.latLng(point.lat, point.lng) : null;
	/**
	* Geocoder class for OpenCage API interactions
	*/
	var OpenCageGeocoder = class {
		constructor(options = {}) {
			this.options = {
				serviceUrl: "https://api.opencagedata.com/geocode/v1/json/",
				geocodingQueryParams: {},
				reverseQueryParams: {},
				key: "",
				limit: 5,
				...options
			};
		}
		/**
		* Geocode a query string
		* @param {string} query - The search query
		* @param {Function} callback - Callback function to handle results
		* @param {Object} context - Context object (typically the control instance)
		*/
		geocode(query, callback, context) {
			const proximity = this._getProximity(context);
			const params = {
				q: query,
				limit: this.options.limit,
				key: this.options.key,
				...proximity,
				...this.options.geocodingQueryParams
			};
			this._request(params, callback, context);
		}
		/**
		* Reverse geocode a location
		*
		* Use `reverseQueryParams` to add parameters here. `limit` is omitted
		* because the API returns at most one reverse geocoding result.
		*
		* @param {L.LatLng|Array|Object} location - Anything L.latLng() accepts:
		*   an L.LatLng, [lat, lng] or {lat, lng}
		* @param {number} scale - Ignored
		* @param {Function} callback - Callback function to handle results
		* @param {Object} context - Context object
		*/
		reverse(location, scale, callback, context) {
			const latLng = leaflet.default.latLng(location);
			if (!latLng) throw new TypeError(`Invalid location for reverse geocoding: ${JSON.stringify(location)}. Expected an L.LatLng, [lat, lng] or {lat, lng}`);
			const params = {
				q: `${latLng.lat},${latLng.lng}`,
				key: this.options.key,
				...this.options.reverseQueryParams
			};
			this._request(params, callback, context);
		}
		/**
		* Send a request and deliver the processed results to the callback
		* @private
		*/
		_request(params, callback, context) {
			this._makeRequest(this.options.serviceUrl, params, (data) => {
				const results = this._processResults(data);
				callback.call(context, results);
			});
		}
		/**
		* Get proximity parameter from map center
		* @private
		*/
		_getProximity(context) {
			const proximity = {};
			if (context && context._map && context._map.getCenter()) {
				const center = context._map.getCenter();
				proximity.proximity = center.lat + "," + center.lng;
			}
			return proximity;
		}
		/**
		* Process API results into standardized format
		* @private
		*/
		_processResults(data) {
			const apiResults = Array.isArray(data?.results) ? data.results : [];
			const results = [];
			for (const apiResult of apiResults) {
				const center = toLatLng(apiResult?.geometry);
				if (!center) continue;
				const result = {
					name: apiResult.formatted,
					center
				};
				const southWest = toLatLng(apiResult.bounds?.southwest);
				const northEast = toLatLng(apiResult.bounds?.northeast);
				if (southWest && northEast) result.bounds = leaflet.default.latLngBounds(southWest, northEast);
				if (this.options.resultExtension) this._addResultExtensions(result, apiResult);
				results.push(result);
			}
			return results;
		}
		/**
		* Add result extensions based on configuration
		* @private
		*/
		_addResultExtensions(result, apiResult) {
			const resultExtObj = this.options.resultExtension;
			const resultExtKeys = Object.keys(resultExtObj);
			for (let j = resultExtKeys.length - 1; j >= 0; j--) {
				const key = resultExtKeys[j];
				let resultAttr = apiResult;
				const attrPathKeys = resultExtObj[key].split(".");
				for (let k = 0; k < attrPathKeys.length; k++) {
					const keypath = attrPathKeys[k];
					if (resultAttr[keypath]) resultAttr = resultAttr[keypath];
					else {
						resultAttr = void 0;
						break;
					}
				}
				result[key] = resultAttr;
			}
		}
		/**
		* Send the request and hand the payload to the callback exactly once
		*
		* Nothing may be chained after the final `.then()`: a rejection handler
		* downstream of the callback also catches exceptions thrown *by* the
		* callback, and would then re-invoke it with empty results. That is why the
		* `.catch()` sits above the delivery step rather than at the end.
		*
		* Returns the request promise, which never rejects. Callers may ignore it.
		*
		* @private
		*/
		_makeRequest(url, params, callback) {
			const queryString = new URLSearchParams(params).toString();
			const noResults = { results: [] };
			return fetch(`${url}?${queryString}`).then((response) => response.ok ? response.json() : noResults).catch(() => noResults).then((data) => {
				try {
					callback(data);
				} catch (error) {
					setTimeout(() => {
						throw error;
					});
				}
			});
		}
	};
	// src/js/L.Control.OpenCageGeocoding.js
	/**
	* OpenCage Geocoding Control for Leaflet
	*/
	var OpenCageGeocodingControl = class extends leaflet.default.Control {
		constructor(options = {}) {
			super(options);
			this.options = {
				showResultIcons: false,
				collapsed: true,
				expand: "click",
				position: "topright",
				placeholder: "Search...",
				iconLabel: "Search",
				errorMessage: "Nothing found.",
				key: "",
				onResultClick: void 0,
				addResultToMap: true,
				limit: 5,
				...options
			};
			if (!this.options.geocoder) this.options.geocoder = new OpenCageGeocoder(this.options);
		}
		onAdd(map) {
			const className = "leaflet-control-opencage-geocoding";
			const container = leaflet.default.DomUtil.create("div", className);
			const icon = leaflet.default.DomUtil.create(this.options.collapsed ? "button" : "div", "leaflet-control-opencage-geocoding-icon", container);
			this._icon = icon;
			if (this.options.collapsed) {
				icon.type = "button";
				icon.setAttribute("aria-label", this.options.iconLabel);
				icon.setAttribute("aria-expanded", "false");
			}
			const form = leaflet.default.DomUtil.create("form", className + "-form", container);
			this._form = form;
			this._map = map;
			this._container = container;
			const input = leaflet.default.DomUtil.create("input");
			this._input = input;
			input.type = "text";
			input.placeholder = this.options.placeholder;
			const listId = `${className}-results-${leaflet.default.stamp(this)}`;
			input.setAttribute("role", "combobox");
			input.setAttribute("aria-autocomplete", "list");
			input.setAttribute("aria-expanded", "false");
			input.setAttribute("aria-controls", listId);
			input.setAttribute("autocomplete", "off");
			leaflet.default.DomEvent.addListener(input, "keydown", this._keydown, this);
			this._errorElement = document.createElement("div");
			this._errorElement.className = className + "-form-no-error";
			this._errorElement.setAttribute("role", "status");
			this._alts = leaflet.default.DomUtil.create("ul", className + "-alternatives leaflet-control-opencage-geocoding-alternatives-minimized");
			this._alts.id = listId;
			this._alts.setAttribute("role", "listbox");
			this._alts.setAttribute("aria-label", this.options.iconLabel);
			form.appendChild(input);
			form.appendChild(this._errorElement);
			container.appendChild(this._alts);
			leaflet.default.DomEvent.addListener(form, "submit", this._geocode, this);
			if (this.options.collapsed) {
				if (this.options.expand === "click") leaflet.default.DomEvent.addListener(icon, "click", (e) => {
					if (e.button === 0 && e.detail !== 2) this._toggle();
				}, this);
				else {
					leaflet.default.DomEvent.addListener(icon, "mouseover", this._expand, this);
					leaflet.default.DomEvent.addListener(icon, "mouseout", this._collapse, this);
					leaflet.default.DomEvent.addListener(icon, "click", this._expand, this);
					this._map.on("movestart", this._collapse, this);
				}
			} else this._expand();
			leaflet.default.DomEvent.disableClickPropagation(container);
			return container;
		}
		/**
		* Handle geocoding results
		*/
		_geocodeResult(results) {
			leaflet.default.DomUtil.removeClass(this._container, "leaflet-control-opencage-geocoding-spinner");
			if (results.length === 1) this._geocodeResultSelected(results[0]);
			else if (results.length > 0) {
				this._alts.replaceChildren();
				this._results = results;
				leaflet.default.DomUtil.removeClass(this._alts, "leaflet-control-opencage-geocoding-alternatives-minimized");
				for (let i = 0; i < results.length; i++) this._alts.appendChild(this._createAlt(results[i], i));
				this._setListOpen(true);
			} else {
				this._errorElement.textContent = this.options.errorMessage;
				leaflet.default.DomUtil.addClass(this._errorElement, "leaflet-control-opencage-geocoding-error");
			}
		}
		/**
		* Mark geocode result on map
		*/
		markGeocode(result) {
			if (result.bounds) this._map.fitBounds(result.bounds);
			else this._map.panTo(result.center);
			if (this._geocodeMarker) this._map.removeLayer(this._geocodeMarker);
			const popupEl = document.createElement("div");
			popupEl.textContent = result.name;
			this._geocodeMarker = new leaflet.default.Marker(result.center).bindPopup(popupEl).addTo(this._map).openPopup();
			return this;
		}
		/**
		* Perform geocoding
		*/
		_geocode(event) {
			leaflet.default.DomEvent.preventDefault(event);
			leaflet.default.DomUtil.addClass(this._container, "leaflet-control-opencage-geocoding-spinner");
			this._clearResults();
			this.options.geocoder.geocode(this._input.value, this._geocodeResult, this);
			return false;
		}
		/**
		* Handle selected geocoding result
		*/
		_geocodeResultSelected(result) {
			if (this.options.collapsed) this._collapse();
			else this._clearResults();
			if (this.options.onResultClick && typeof this.options.onResultClick === "function") this.options.onResultClick(result);
			if (this.options.addResultToMap) this.markGeocode(result);
		}
		/**
		* Toggle control expansion
		*/
		_toggle() {
			if (this._container.className.indexOf("leaflet-control-opencage-geocoding-expanded") >= 0) this._collapse();
			else this._expand();
		}
		/**
		* Expand the control
		*/
		_expand() {
			leaflet.default.DomUtil.addClass(this._container, "leaflet-control-opencage-geocoding-expanded");
			this._setExpanded(true);
			this._input.select();
		}
		/**
		* Collapse the control
		*/
		_collapse() {
			this._container.className = this._container.className.replace(" leaflet-control-opencage-geocoding-expanded", "");
			this._setExpanded(false);
			leaflet.default.DomUtil.addClass(this._alts, "leaflet-control-opencage-geocoding-alternatives-minimized");
			this._setListOpen(false);
			leaflet.default.DomUtil.removeClass(this._errorElement, "leaflet-control-opencage-geocoding-error");
			this._errorElement.textContent = "";
		}
		/**
		* Tell assistive technology whether the toggle button's control is open
		*/
		_setExpanded(expanded) {
			if (this.options.collapsed) this._icon.setAttribute("aria-expanded", String(expanded));
		}
		/**
		* Clear results display
		*/
		_clearResults() {
			leaflet.default.DomUtil.addClass(this._alts, "leaflet-control-opencage-geocoding-alternatives-minimized");
			this._selection = null;
			this._setListOpen(false);
			leaflet.default.DomUtil.removeClass(this._errorElement, "leaflet-control-opencage-geocoding-error");
			this._errorElement.textContent = "";
		}
		/**
		* Tell screen readers whether the result list is showing. A closed list
		* has no highlighted result.
		*/
		_setListOpen(open) {
			this._input.setAttribute("aria-expanded", String(open));
			if (!open) this._input.removeAttribute("aria-activedescendant");
		}
		/**
		* Create alternative result element
		*/
		_createAlt(result, index) {
			const li = document.createElement("li");
			li.id = `${this._alts.id}-${index}`;
			li.setAttribute("role", "option");
			li.setAttribute("aria-selected", "false");
			const a = document.createElement("a");
			a.href = "#";
			a.tabIndex = -1;
			a.dataset.resultIndex = index;
			if (this.options.showResultIcons && result.icon) try {
				const u = new URL(result.icon, window.location.href);
				if (u.protocol === "http:" || u.protocol === "https:") {
					const img = document.createElement("img");
					img.src = u.href;
					img.alt = "";
					a.appendChild(img);
				}
			} catch {}
			a.appendChild(document.createTextNode(result.name));
			li.appendChild(a);
			leaflet.default.DomEvent.addListener(li, "click", () => {
				this._geocodeResultSelected(result);
			}, this);
			return li;
		}
		/**
		* Handle keyboard navigation
		*/
		_keydown(e) {
			const select = (dir) => {
				if (this._selection) {
					leaflet.default.DomUtil.removeClass(this._selection.firstChild, "leaflet-control-opencage-geocoding-selected");
					this._selection.setAttribute("aria-selected", "false");
					this._selection = this._selection[dir > 0 ? "nextSibling" : "previousSibling"];
				}
				if (!this._selection) this._selection = this._alts[dir > 0 ? "firstChild" : "lastChild"];
				if (this._selection) {
					leaflet.default.DomUtil.addClass(this._selection.firstChild, "leaflet-control-opencage-geocoding-selected");
					this._selection.setAttribute("aria-selected", "true");
					this._input.setAttribute("aria-activedescendant", this._selection.id);
				}
			};
			if (e.isComposing || e.keyCode === 229) return true;
			switch (e.key) {
				case "ArrowUp":
					select(-1);
					leaflet.default.DomEvent.preventDefault(e);
					break;
				case "ArrowDown":
					select(1);
					leaflet.default.DomEvent.preventDefault(e);
					break;
				case "Escape":
					this._clearResults();
					break;
				case "Enter": if (this._selection) {
					const index = parseInt(this._selection.firstChild.getAttribute("data-result-index"), 10);
					this._geocodeResultSelected(this._results[index]);
					this._clearResults();
					leaflet.default.DomEvent.preventDefault(e);
				}
			}
			return true;
		}
	};
	var openCageGeocoding = (options) => {
		return new OpenCageGeocodingControl(options);
	};
	OpenCageGeocodingControl.Geocoder = OpenCageGeocoder;
	OpenCageGeocodingControl.geocoder = (options) => {
		return new OpenCageGeocoder(options);
	};
	Object.assign(leaflet.default.Control, {
		OpenCageGeocoding: OpenCageGeocodingControl,
		openCageGeocoding
	});
	exports.OpenCageGeocoder = OpenCageGeocoder;
	exports.OpenCageGeocodingControl = OpenCageGeocodingControl;
	exports.default = OpenCageGeocodingControl;
	exports.openCageGeocoding = openCageGeocoding;
});

//# sourceMappingURL=L.Control.OpenCageGeocoding.dev.js.map