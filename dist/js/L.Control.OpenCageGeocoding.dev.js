/**
 * OpenCage Data Geocoding Control v2.1.0 - 2025-10-14
 * Copyright (c) 2025, OpenCage GmbH 
 * support@opencagedata.com 
 * https://opencagedata.com 
 * 
 * Licensed under the BSD license. 
 * Demo: https://opencagedata.com 
 * Source: git@github.com:opencagedata/leaflet-opencage-geocoding.git 
 */
(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("leaflet")) : typeof define === "function" && define.amd ? define(["exports", "leaflet"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global["leaflet-control-opencage-geocoding"] = {}, global.L));
})(this, (function(exports2, L) {
  "use strict";
  class OpenCageGeocoder {
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
      this._makeRequest(this.options.serviceUrl, params, (data) => {
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
          center: L.latLng(
            data.results[i].geometry.lat,
            data.results[i].geometry.lng
          )
        };
        if (data.results[i].bounds) {
          results[i].bounds = L.latLngBounds(
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
    _makeRequest(url, params, callback) {
      return makeJsonpRequest(url, params, callback, this, "jsonp");
    }
  }
  let callbackId = 0;
  function makeJsonpRequest(url, params, callback, context, jsonpParam) {
    const callbackName = "_ocd_geocoder_" + callbackId++;
    params[jsonpParam] = callbackName;
    window[callbackName] = function(data) {
      callback.call(context, data);
      delete window[callbackName];
      const script2 = document.getElementById(callbackName);
      if (script2 && script2.parentNode) {
        script2.parentNode.removeChild(script2);
      }
    };
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url + L.Util.getParamString(params);
    script.id = callbackName;
    script.addEventListener("error", () => {
      callback.call(context, { results: [] });
      delete window[callbackName];
    });
    script.addEventListener("abort", () => {
      callback.call(context, { results: [] });
      delete window[callbackName];
    });
    document.getElementsByTagName("head")[0].appendChild(script);
  }
  class OpenCageGeocodingControl extends L.Control {
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
      const container = L.DomUtil.create("div", className);
      const icon = L.DomUtil.create(
        "div",
        "leaflet-control-opencage-geocoding-icon",
        container
      );
      const form = L.DomUtil.create("form", className + "-form", container);
      this._form = form;
      this._map = map;
      this._container = container;
      const input = L.DomUtil.create("input");
      this._input = input;
      input.type = "text";
      input.placeholder = this.options.placeholder;
      L.DomEvent.addListener(input, "keydown", this._keydown, this);
      this._errorElement = document.createElement("div");
      this._errorElement.className = className + "-form-no-error";
      this._errorElement.innerHTML = this.options.errorMessage;
      this._alts = L.DomUtil.create(
        "ul",
        className + "-alternatives leaflet-control-opencage-geocoding-alternatives-minimized"
      );
      form.appendChild(input);
      form.appendChild(this._errorElement);
      container.appendChild(this._alts);
      L.DomEvent.addListener(form, "submit", this._geocode, this);
      if (this.options.collapsed) {
        if (this.options.expand === "click") {
          L.DomEvent.addListener(
            icon,
            "click",
            (e) => {
              if (e.button === 0 && e.detail !== 2) {
                this._toggle();
              }
            },
            this
          );
        } else {
          L.DomEvent.addListener(icon, "mouseover", this._expand, this);
          L.DomEvent.addListener(icon, "mouseout", this._collapse, this);
          this._map.on("movestart", this._collapse, this);
        }
      } else {
        this._expand();
      }
      L.DomEvent.disableClickPropagation(container);
      return container;
    }
    /**
     * Handle geocoding results
     */
    _geocodeResult(results) {
      L.DomUtil.removeClass(
        this._container,
        "leaflet-control-opencage-geocoding-spinner"
      );
      if (results.length === 1) {
        this._geocodeResultSelected(results[0]);
      } else if (results.length > 0) {
        this._alts.innerHTML = "";
        this._results = results;
        L.DomUtil.removeClass(
          this._alts,
          "leaflet-control-opencage-geocoding-alternatives-minimized"
        );
        for (let i = 0; i < results.length; i++) {
          this._alts.appendChild(this._createAlt(results[i], i));
        }
      } else {
        L.DomUtil.addClass(
          this._errorElement,
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
      this._geocodeMarker = new L.Marker(result.center).bindPopup(result.name).addTo(this._map).openPopup();
      return this;
    }
    /**
     * Perform geocoding
     */
    _geocode(event) {
      L.DomEvent.preventDefault(event);
      L.DomUtil.addClass(
        this._container,
        "leaflet-control-opencage-geocoding-spinner"
      );
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
      L.DomUtil.addClass(
        this._container,
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
      L.DomUtil.addClass(
        this._alts,
        "leaflet-control-opencage-geocoding-alternatives-minimized"
      );
      L.DomUtil.removeClass(
        this._errorElement,
        "leaflet-control-opencage-geocoding-error"
      );
    }
    /**
     * Clear results display
     */
    _clearResults() {
      L.DomUtil.addClass(
        this._alts,
        "leaflet-control-opencage-geocoding-alternatives-minimized"
      );
      this._selection = null;
      L.DomUtil.removeClass(
        this._errorElement,
        "leaflet-control-opencage-geocoding-error"
      );
    }
    /**
     * Create alternative result element
     */
    _createAlt(result, index) {
      const li = document.createElement("li");
      li.innerHTML = '<a href="#" data-result-index="' + index + '">' + (this.options.showResultIcons && result.icon ? '<img src="' + result.icon + '"/>' : "") + result.name + "</a>";
      L.DomEvent.addListener(
        li,
        "click",
        () => {
          this._geocodeResultSelected(result);
        },
        this
      );
      return li;
    }
    /**
     * Handle keyboard navigation
     */
    _keydown(e) {
      const select = (dir) => {
        if (this._selection) {
          L.DomUtil.removeClass(
            this._selection.firstChild,
            "leaflet-control-opencage-geocoding-selected"
          );
          this._selection = this._selection[dir > 0 ? "nextSibling" : "previousSibling"];
        }
        if (!this._selection) {
          this._selection = this._alts[dir > 0 ? "firstChild" : "lastChild"];
        }
        if (this._selection) {
          L.DomUtil.addClass(
            this._selection.firstChild,
            "leaflet-control-opencage-geocoding-selected"
          );
        }
      };
      switch (e.keyCode) {
        case 38:
          select(-1);
          L.DomEvent.preventDefault(e);
          break;
        case 40:
          select(1);
          L.DomEvent.preventDefault(e);
          break;
        case 13:
          if (this._selection) {
            const index = parseInt(
              this._selection.firstChild.getAttribute("data-result-index"),
              10
            );
            this._geocodeResultSelected(this._results[index]);
            this._clearResults();
            L.DomEvent.preventDefault(e);
          }
          break;
      }
      return true;
    }
  }
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
  exports2.OpenCageGeocodingControl = OpenCageGeocodingControl;
  exports2.default = OpenCageGeocodingControl;
  exports2.openCageGeocoding = openCageGeocoding;
  Object.defineProperties(exports2, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
}));
//# sourceMappingURL=L.Control.OpenCageGeocoding.dev.js.map
