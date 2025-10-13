/**
 * OpenCage Data Geocoding Control v3.0.0-alpha.2 - 2025-10-14
 * Copyright (c) 2025, OpenCage GmbH 
 * support@opencagedata.com 
 * https://opencagedata.com 
 * 
 * Licensed under the BSD license. 
 * Demo: https://opencagedata.com/tutorials/geocode-in-leaflet
 * Source: git@github.com:opencagedata/leaflet-opencage-geocoding.git 
 */
(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("leaflet"), require("opencage-api-client")) : typeof define === "function" && define.amd ? define(["exports", "leaflet", "opencage-api-client"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global["leaflet-control-opencage-geocoding"] = {}, global.L, global.opencageApiClient));
})(this, (function(exports2, L$1, opencageApiClient) {
  "use strict";
  class OpenCageGeocoder {
    constructor(options = {}) {
      this.options = {
        geocodingQueryParams: {},
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
      this._makeRequest(params, (data) => {
        const results = this._processResults(data);
        callback.call(context, results);
      });
    }
    /**
     * Reverse geocode a location
     * @param {Object} location - Location object with lat/lng
     * @param {number} scale - Scale parameter (unused in current implementation)
     * @param {Function} callback - Callback function to handle results
     * @param {Object} context - Context object
     */
    reverse(location, scale, callback, context) {
      this.geocode(location, callback, context);
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
      const results = [];
      for (let i = data.results.length - 1; i >= 0; i--) {
        results[i] = {
          name: data.results[i].formatted,
          center: new L$1.LatLng(
            data.results[i].geometry.lat,
            data.results[i].geometry.lng
          )
        };
        if (data.results[i].bounds) {
          results[i].bounds = new L$1.LatLngBounds(
            [
              data.results[i].bounds.southwest.lat,
              data.results[i].bounds.southwest.lng
            ],
            [
              data.results[i].bounds.northeast.lat,
              data.results[i].bounds.northeast.lng
            ]
          );
        }
        if (this.options.resultExtension) {
          this._addResultExtensions(results[i], data.results[i]);
        }
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
          if (resultAttr[keypath]) {
            resultAttr = resultAttr[keypath];
          } else {
            resultAttr = void 0;
            break;
          }
        }
        result[key] = resultAttr;
      }
    }
    /**
     * Make JSONP request to the API
     * @private
     */
    // _makeRequest(url, params, callback) {
    _makeRequest(params, callback) {
      opencageApiClient.geocode(params).then((data) => {
        callback(data);
      });
    }
  }
  class OpenCageGeocodingControl extends L$1.Control {
    constructor(options = {}) {
      super(options);
      this.options = {
        showResultIcons: false,
        collapsed: true,
        expand: "click",
        position: "topright",
        placeholder: "Search...",
        errorMessage: "Nothing found.",
        key: "",
        onResultClick: void 0,
        addResultToMap: true,
        limit: 5,
        ...options
      };
      this._callbackId = 0;
      if (!this.options.geocoder) {
        this.options.geocoder = new OpenCageGeocoder(this.options);
      }
    }
    onAdd(map) {
      const className = "leaflet-control-opencage-geocoding";
      const container = L$1.DomUtil.create("div", className);
      const icon = L$1.DomUtil.create(
        "div",
        "leaflet-control-opencage-geocoding-icon",
        container
      );
      const form = L$1.DomUtil.create("form", className + "-form", container);
      this._form = form;
      this._map = map;
      this._container = container;
      const input = L$1.DomUtil.create("input");
      this._input = input;
      input.type = "text";
      input.placeholder = this.options.placeholder;
      input.addEventListener("keydown", this._keydown.bind(this));
      this._errorElement = document.createElement("div");
      this._errorElement.className = className + "-form-no-error";
      this._errorElement.innerHTML = this.options.errorMessage;
      this._alts = L$1.DomUtil.create(
        "ul",
        className + "-alternatives leaflet-control-opencage-geocoding-alternatives-minimized"
      );
      form.appendChild(input);
      form.appendChild(this._errorElement);
      container.appendChild(this._alts);
      form.addEventListener("submit", this._geocode.bind(this));
      if (this.options.collapsed) {
        if (this.options.expand === "click") {
          icon.addEventListener("click", (e) => {
            if (e.button === 0 && e.detail !== 2) {
              this._toggle();
            }
          });
        } else {
          icon.addEventListener("mouseover", this._expand.bind(this));
          icon.addEventListener("mouseout", this._collapse.bind(this));
          this._map.on("movestart", this._collapse, this);
        }
      } else {
        this._expand();
      }
      L$1.DomEvent.disableClickPropagation(container);
      return container;
    }
    /**
     * Handle geocoding results
     */
    _geocodeResult(results) {
      this._container.classList.remove(
        "leaflet-control-opencage-geocoding-spinner"
      );
      if (results.length === 1) {
        this._geocodeResultSelected(results[0]);
      } else if (results.length > 0) {
        this._alts.innerHTML = "";
        this._results = results;
        this._alts.classList.remove(
          "leaflet-control-opencage-geocoding-alternatives-minimized"
        );
        for (let i = 0; i < results.length; i++) {
          this._alts.appendChild(this._createAlt(results[i], i));
        }
      } else {
        this._errorElement.classList.add(
          "leaflet-control-opencage-geocoding-error"
        );
      }
    }
    /**
     * Mark geocode result on map
     */
    markGeocode(result) {
      if (result.bounds) {
        this._map.fitBounds(result.bounds);
      } else {
        this._map.panTo(result.center);
      }
      if (this._geocodeMarker) {
        this._map.removeLayer(this._geocodeMarker);
      }
      this._geocodeMarker = new L$1.Marker(result.center).bindPopup(result.name).addTo(this._map).openPopup();
      return this;
    }
    /**
     * Perform geocoding
     */
    _geocode(event) {
      L$1.DomEvent.preventDefault(event);
      this._container.classList.add("leaflet-control-opencage-geocoding-spinner");
      this._clearResults();
      this.options.geocoder.geocode(this._input.value, this._geocodeResult, this);
      return false;
    }
    /**
     * Handle selected geocoding result
     */
    _geocodeResultSelected(result) {
      if (this.options.collapsed) {
        this._collapse();
      } else {
        this._clearResults();
      }
      if (this.options.onResultClick && typeof this.options.onResultClick === "function") {
        this.options.onResultClick(result);
      }
      if (this.options.addResultToMap) {
        this.markGeocode(result);
      }
    }
    /**
     * Toggle control expansion
     */
    _toggle() {
      if (this._container.className.indexOf(
        "leaflet-control-opencage-geocoding-expanded"
      ) >= 0) {
        this._collapse();
      } else {
        this._expand();
      }
    }
    /**
     * Expand the control
     */
    _expand() {
      this._container.classList.add(
        "leaflet-control-opencage-geocoding-expanded"
      );
      this._input.select();
    }
    /**
     * Collapse the control
     */
    _collapse() {
      this._container.className = this._container.className.replace(
        " leaflet-control-opencage-geocoding-expanded",
        ""
      );
      this._alts.classList.add(
        "leaflet-control-opencage-geocoding-alternatives-minimized"
      );
      this._errorElement.classList.remove(
        "leaflet-control-opencage-geocoding-error"
      );
    }
    /**
     * Clear results display
     */
    _clearResults() {
      this._alts.classList.add(
        "leaflet-control-opencage-geocoding-alternatives-minimized"
      );
      this._selection = null;
      this._errorElement.classList.remove(
        "leaflet-control-opencage-geocoding-error"
      );
    }
    /**
     * Create alternative result element
     */
    _createAlt(result, index) {
      const li = document.createElement("li");
      li.innerHTML = '<a href="#" data-result-index="' + index + '">' + (this.options.showResultIcons && result.icon ? '<img src="' + result.icon + '"/>' : "") + result.name + "</a>";
      li.addEventListener("click", () => {
        this._geocodeResultSelected(result);
      });
      return li;
    }
    /**
     * Handle keyboard navigation
     */
    _keydown(e) {
      const select = (dir) => {
        if (this._selection) {
          this._selection.firstChild.classList.remove(
            "leaflet-control-opencage-geocoding-selected"
          );
          this._selection = this._selection[dir > 0 ? "nextSibling" : "previousSibling"];
        }
        if (!this._selection) {
          this._selection = this._alts[dir > 0 ? "firstChild" : "lastChild"];
        }
        if (this._selection) {
          this._selection.firstChild.classList.add(
            "leaflet-control-opencage-geocoding-selected"
          );
        }
      };
      switch (e.keyCode) {
        case 38:
          select(-1);
          L$1.DomEvent.preventDefault(e);
          break;
        case 40:
          select(1);
          L$1.DomEvent.preventDefault(e);
          break;
        case 13:
          if (this._selection) {
            const index = parseInt(
              this._selection.firstChild.getAttribute("data-result-index"),
              10
            );
            this._geocodeResultSelected(this._results[index]);
            this._clearResults();
            L$1.DomEvent.preventDefault(e);
          }
          break;
      }
      return true;
    }
  }
  const OpenCageGeocoding = OpenCageGeocodingControl;
  const openCageGeocoding = (options) => {
    return new OpenCageGeocodingControl(options);
  };
  OpenCageGeocodingControl.Geocoder = OpenCageGeocoder;
  OpenCageGeocodingControl.geocoder = (options) => {
    return new OpenCageGeocoder(options);
  };
  Object.assign(L.Control, {
    OpenCageGeocoding: OpenCageGeocodingControl,
    openCageGeocoding
  });
  exports2.OpenCageGeocoder = OpenCageGeocoder;
  exports2.OpenCageGeocoding = OpenCageGeocoding;
  exports2.default = OpenCageGeocodingControl;
  exports2.openCageGeocoding = openCageGeocoding;
  Object.defineProperties(exports2, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
}));
//# sourceMappingURL=OpenCageGeocoding.dev.js.map
