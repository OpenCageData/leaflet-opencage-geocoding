import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LatLng } from 'leaflet';
import { geocode } from 'opencage-api-client';
import { OpenCageGeocoder } from '../src/js/geocoder.js';

vi.mock('opencage-api-client', () => ({ geocode: vi.fn() }));

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
      expect(defaultGeocoder.options.limit).toBe(5);
      expect(defaultGeocoder.options.key).toBe('');
      expect(defaultGeocoder.options.geocodingQueryParams).toEqual({});
    });

    it('should create geocoder with custom options', () => {
      expect(geocoder.options.key).toBe('test-api-key');
      expect(geocoder.options.limit).toBe(3);
      expect(geocoder.options.geocodingQueryParams).toEqual({});
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

    // No default parameter here: `reverse(undefined)` must stay undefined so
    // the invalid-input cases below actually exercise it.
    const london = { lat: 51.5, lng: -0.12 };
    const reverse = (location) =>
      geocoder.reverse(location, 10, mockCallback, mockContext);

    const paramsOfLastRequest = () => mockMakeRequest.mock.calls.at(-1)[0];

    it.each([
      ['a LatLng', new LatLng(51.5, -0.12)],
      ['a {lat, lng} object', { lat: 51.5, lng: -0.12 }],
      ['a [lat, lng] array', [51.5, -0.12]],
    ])('should send a "lat,lng" query for %s', (_label, location) => {
      reverse(location);

      expect(paramsOfLastRequest()).toMatchObject({
        q: '51.5,-0.12',
        key: 'test-api-key',
      });
    });

    it('should not send proximity, limit or geocodingQueryParams', () => {
      geocoder.options.geocodingQueryParams = { countrycode: 'gb' };

      reverse(london);

      const params = paramsOfLastRequest();
      expect(params).not.toHaveProperty('proximity');
      expect(params).not.toHaveProperty('countrycode');
      expect(params).not.toHaveProperty('limit');
    });

    it('should apply reverseQueryParams', () => {
      geocoder.options.reverseQueryParams = { language: 'de' };

      reverse(london);

      expect(paramsOfLastRequest()).toMatchObject({
        q: '51.5,-0.12',
        language: 'de',
      });
    });

    it('should deliver processed results to the callback in context', () => {
      mockMakeRequest.mockImplementation((params, cb) =>
        cb({
          results: [
            { formatted: 'Test Location', geometry: { lat: 51.5, lng: -0.1 } },
          ],
        })
      );

      reverse(london);

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
      expect(() => reverse(location)).toThrow(TypeError);
      expect(mockMakeRequest).not.toHaveBeenCalled();
    });
  });

  describe('_makeRequest', () => {
    const params = { key: 'test-api-key', q: 'London' };

    beforeEach(() => {
      geocode.mockReset();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should query the client and call callback with data', async () => {
      const mockData = { results: [] };
      geocode.mockResolvedValue(mockData);
      const handler = vi.fn();

      await geocoder._makeRequest(params, handler);

      expect(geocode).toHaveBeenCalledWith(params);
      expect(handler).toHaveBeenCalledWith(mockData);
    });

    it.each([
      [
        'a network error',
        () => geocode.mockRejectedValue(new Error('Network error')),
      ],
      [
        'an API error',
        () => geocode.mockRejectedValue({ status: { code: 402 } }),
      ],
    ])('should deliver empty results on %s', async (_label, stubGeocode) => {
      stubGeocode();
      const handler = vi.fn();

      await geocoder._makeRequest(params, handler);

      expect(handler).toHaveBeenCalledWith({ results: [] });
    });

    it('should invoke a throwing handler once, then re-throw asynchronously', async () => {
      vi.useFakeTimers();
      const payload = { results: [{ formatted: 'x' }] };
      geocode.mockResolvedValue(payload);
      const boom = new Error('bug in the result handler');
      const handler = vi.fn(() => {
        throw boom;
      });

      // Awaiting settles every delivery; the re-throw is a pending timer.
      await geocoder._makeRequest(params, handler);

      // Exactly one call, with the real payload - never a second, empty one.
      expect(handler.mock.calls).toEqual([[payload]]);
      expect(() => vi.runAllTimers()).toThrow(boom);
    });
  });
});
