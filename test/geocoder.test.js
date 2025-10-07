import { describe, it, expect, beforeEach, vi } from 'vitest';
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
});
