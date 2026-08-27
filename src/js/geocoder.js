import L from 'leaflet';

/**
 * Geocoder class for OpenCage API interactions
 */
export class OpenCageGeocoder {
  constructor(options = {}) {
    this.options = {
      serviceUrl: 'https://api.opencagedata.com/geocode/v1/json/',
      geocodingQueryParams: {},
      reverseQueryParams: {},
      key: '',
      limit: 5,
      ...options,
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
      ...this.options.geocodingQueryParams,
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
    const latLng = L.latLng(location);

    if (!latLng) {
      throw new TypeError(
        `Invalid location for reverse geocoding: ${JSON.stringify(location)}. ` +
          'Expected an L.LatLng, [lat, lng] or {lat, lng}'
      );
    }

    const params = {
      q: `${latLng.lat},${latLng.lng}`,
      key: this.options.key,
      ...this.options.reverseQueryParams,
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
      proximity.proximity = center.lat + ',' + center.lng;
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
        ),
      };

      if (data.results[i].bounds) {
        results[i].bounds = L.latLngBounds(
          [
            data.results[i].bounds.southwest.lat,
            data.results[i].bounds.southwest.lng,
          ],
          [
            data.results[i].bounds.northeast.lat,
            data.results[i].bounds.northeast.lng,
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

      const attrPathKeys = resultExtObj[key].split('.');
      for (let k = 0; k < attrPathKeys.length; k++) {
        const keypath = attrPathKeys[k];
        if (resultAttr[keypath]) {
          resultAttr = resultAttr[keypath];
        } else {
          resultAttr = undefined;
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

    return fetch(`${url}?${queryString}`)
      .then((response) => (response.ok ? response.json() : noResults))
      .catch(() => noResults)
      .then((data) => {
        try {
          callback(data);
        } catch (error) {
          // Re-throw asynchronously so a bug in a result handler reaches
          // window.onerror like any other event-handler exception, instead of
          // being swallowed here or surfacing as an unhandled rejection.
          setTimeout(() => {
            throw error;
          });
        }
      });
  }
}

/**
 * Factory function for creating geocoder instances
 */
export function createGeocoder(options) {
  return new OpenCageGeocoder(options);
}
