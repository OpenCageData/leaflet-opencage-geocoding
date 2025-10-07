import { LatLng, LatLngBounds } from 'leaflet';
import { geocode } from 'opencage-api-client';
/**
 * Geocoder class for OpenCage API interactions
 */
export class OpenCageGeocoder {
  constructor(options = {}) {
    this.options = {
      geocodingQueryParams: {},
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

    // this._makeRequest(this.options.serviceUrl, params, (data) => {
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
        center: new LatLng(
          data.results[i].geometry.lat,
          data.results[i].geometry.lng
        ),
      };

      if (data.results[i].bounds) {
        results[i].bounds = new LatLngBounds(
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
   * Make JSONP request to the API
   * @private
   */
  // _makeRequest(url, params, callback) {
  _makeRequest(params, callback) {
    geocode(params).then((data) => {
      callback(data);
    });
  }
}

/**
 * Factory function for creating geocoder instances
 */
export function createGeocoder(options) {
  return new OpenCageGeocoder(options);
}
