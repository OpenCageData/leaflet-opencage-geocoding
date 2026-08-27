import { describe, it, expect, beforeEach, vi } from 'vitest';
import L from 'leaflet';
import { OpenCageGeocoder } from '../src/js/geocoder.js';

describe('OpenCageGeocoder', () => {
  let geocoder;
  let mockCallback;
  let mockContext;

  beforeEach(() => {
    geocoder = new OpenCageGeocoder({
      key: 'test-api-key',
      limit: 3,
    });
    mockCallback = vi.fn();
    mockContext = {
      _map: {
        getCenter: () => ({ lat: 51.505, lng: -0.09 }),
      },
    };
  });

  describe('constructor', () => {
    it('should create geocoder with default options', () => {
      const defaultGeocoder = new OpenCageGeocoder();
      expect(defaultGeocoder.options.serviceUrl).toBe(
        'https://api.opencagedata.com/geocode/v1/json/'
      );
      expect(defaultGeocoder.options.limit).toBe(5);
      expect(defaultGeocoder.options.key).toBe('');
    });

    it('should create geocoder with custom options', () => {
      expect(geocoder.options.key).toBe('test-api-key');
      expect(geocoder.options.limit).toBe(3);
    });
  });

  describe('_getProximity', () => {
    it('should return proximity when context has map with center', () => {
      const proximity = geocoder._getProximity(mockContext);
      expect(proximity.proximity).toBe('51.505,-0.09');
    });

    it('should return empty object when context has no map', () => {
      const proximity = geocoder._getProximity({});
      expect(proximity).toEqual({});
    });

    it('should return empty object when context is null', () => {
      const proximity = geocoder._getProximity(null);
      expect(proximity).toEqual({});
    });
  });

  describe('_processResults', () => {
    it('should process API results correctly', () => {
      const mockApiData = {
        results: [
          {
            formatted: 'Test Location',
            geometry: { lat: 51.5, lng: -0.1 },
            bounds: {
              southwest: { lat: 51.4, lng: -0.2 },
              northeast: { lat: 51.6, lng: 0.0 },
            },
          },
        ],
      };

      const results = geocoder._processResults(mockApiData);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Test Location');
      expect(results[0].center.lat).toBe(51.5);
      expect(results[0].center.lng).toBe(-0.1);
      expect(results[0].bounds).toBeDefined();
    });

    it('should handle results without bounds', () => {
      const mockApiData = {
        results: [
          {
            formatted: 'Test Location',
            geometry: { lat: 51.5, lng: -0.1 },
          },
        ],
      };

      const results = geocoder._processResults(mockApiData);
      expect(results[0].bounds).toBeUndefined();
    });
  });

  describe('geocode', () => {
    it('should call _makeRequest with correct parameters', () => {
      const mockMakeRequest = vi.spyOn(geocoder, '_makeRequest');
      mockMakeRequest.mockImplementation(() => {});

      geocoder.geocode('London', mockCallback, mockContext);

      expect(mockMakeRequest).toHaveBeenCalledWith(
        'https://api.opencagedata.com/geocode/v1/json/',
        expect.objectContaining({
          q: 'London',
          limit: 3,
          key: 'test-api-key',
          proximity: '51.505,-0.09',
        }),
        expect.any(Function)
      );
    });
  });

  describe('reverse', () => {
    let mockMakeRequest;

    beforeEach(() => {
      mockMakeRequest = vi.spyOn(geocoder, '_makeRequest');
      mockMakeRequest.mockImplementation(() => {});
    });

    const paramsOfLastRequest = () => mockMakeRequest.mock.calls.at(-1)[1];

    it.each([
      ['an L.LatLng', L.latLng(51.5, -0.12)],
      ['a {lat, lng} object', { lat: 51.5, lng: -0.12 }],
      ['a {lat, lon} object', { lat: 51.5, lon: -0.12 }],
      ['a [lat, lng] array', [51.5, -0.12]],
      ['numeric strings', { lat: '51.5', lng: '-0.12' }],
    ])('should send a "lat,lng" query for %s', (_label, location) => {
      geocoder.reverse(location, 10, mockCallback, mockContext);

      expect(paramsOfLastRequest()).toMatchObject({
        q: '51.5,-0.12',
        key: 'test-api-key',
      });
    });

    it('should not send proximity or geocodingQueryParams', () => {
      geocoder.options.geocodingQueryParams = { countrycode: 'gb' };

      geocoder.reverse(
        { lat: 51.5, lng: -0.12 },
        10,
        mockCallback,
        mockContext
      );

      const params = paramsOfLastRequest();
      expect(params).not.toHaveProperty('proximity');
      expect(params).not.toHaveProperty('countrycode');
      expect(params).not.toHaveProperty('limit');
    });

    it('should apply reverseQueryParams', () => {
      geocoder.options.reverseQueryParams = {
        language: 'de',
        no_annotations: 1,
      };

      geocoder.reverse(
        { lat: 51.5, lng: -0.12 },
        10,
        mockCallback,
        mockContext
      );

      expect(paramsOfLastRequest()).toMatchObject({
        q: '51.5,-0.12',
        language: 'de',
        no_annotations: 1,
      });
    });

    it('should deliver processed results to the callback in context', () => {
      mockMakeRequest.mockImplementation((url, params, cb) =>
        cb({
          results: [
            { formatted: 'Test Location', geometry: { lat: 51.5, lng: -0.1 } },
          ],
        })
      );

      geocoder.reverse(
        { lat: 51.5, lng: -0.12 },
        10,
        mockCallback,
        mockContext
      );

      expect(mockCallback).toHaveBeenCalledTimes(1);
      const [results] = mockCallback.mock.calls[0];
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Test Location');
      expect(mockCallback.mock.contexts[0]).toBe(mockContext);
    });

    it.each([
      ['a string', '51.5,-0.12'],
      ['an empty object', {}],
      ['null', null],
      ['undefined', undefined],
    ])('should throw a TypeError for %s', (_label, location) => {
      expect(() =>
        geocoder.reverse(location, 10, mockCallback, mockContext)
      ).toThrow(TypeError);
      expect(mockMakeRequest).not.toHaveBeenCalled();
    });

    it('should never stringify the location into the query', () => {
      geocoder.reverse(L.latLng(51.5, -0.12), 10, mockCallback, mockContext);

      const queryString = new URLSearchParams(paramsOfLastRequest()).toString();
      expect(queryString).toContain('q=51.5%2C-0.12');
      expect(queryString).not.toContain('LatLng');
      expect(queryString).not.toContain('object+Object');
    });
  });

  describe('_makeRequest', () => {
    it('should fetch the correct URL and call callback with data', async () => {
      const mockData = { results: [] };
      global.fetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      });

      await new Promise((resolve) => {
        geocoder._makeRequest(
          'https://api.opencagedata.com/geocode/v1/json/',
          { key: 'test-api-key', q: 'London' },
          (data) => {
            expect(data).toEqual(mockData);
            resolve();
          }
        );
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://api.opencagedata.com/geocode/v1/json/?'
        )
      );
    });

    it('should call callback with empty results on non-ok response', async () => {
      global.fetch.mockResolvedValue({ ok: false });

      await new Promise((resolve) => {
        geocoder._makeRequest(
          'https://api.opencagedata.com/geocode/v1/json/',
          { key: 'test-api-key', q: 'London' },
          (data) => {
            expect(data).toEqual({ results: [] });
            resolve();
          }
        );
      });
    });

    it('should call callback with empty results on network error', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await new Promise((resolve) => {
        geocoder._makeRequest(
          'https://api.opencagedata.com/geocode/v1/json/',
          { key: 'test-api-key', q: 'London' },
          (data) => {
            expect(data).toEqual({ results: [] });
            resolve();
          }
        );
      });
    });
  });
});
