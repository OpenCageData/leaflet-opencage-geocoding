import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenCageGeocodingControl } from '../src/js/L.Control.OpenCageGeocoding.js';

describe('OpenCageGeocodingControl', () => {
  let control;
  let mockMap;

  beforeEach(() => {
    mockMap = {
      getCenter: vi.fn().mockReturnValue({ lat: 51.505, lng: -0.09 }),
      fitBounds: vi.fn(),
      panTo: vi.fn(),
      removeLayer: vi.fn(),
      addLayer: vi.fn(),
      on: vi.fn(),
    };

    control = new OpenCageGeocodingControl({
      key: 'test-api-key',
    });
  });

  describe('constructor', () => {
    it('should create control with default options', () => {
      const defaultControl = new OpenCageGeocodingControl();
      expect(defaultControl.options.position).toBe('topright');
      expect(defaultControl.options.placeholder).toBe('Search...');
      expect(defaultControl.options.collapsed).toBe(true);
    });

    it('should create control with custom options', () => {
      expect(control.options.key).toBe('test-api-key');
      expect(control.options.geocoder).toBeDefined();
    });
  });

  describe('onAdd', () => {
    it('should create and return container element', () => {
      const container = control.onAdd(mockMap);

      expect(container).toBeDefined();
      expect(control._map).toBe(mockMap);
      expect(control._container).toBe(container);
      expect(control._input).toBeDefined();
      expect(control._errorElement).toBeDefined();
      expect(control._alts).toBeDefined();
    });
  });

  describe('markGeocode', () => {
    beforeEach(() => {
      control.onAdd(mockMap);
    });

    it('should fit bounds when result has bounds', () => {
      const result = {
        name: 'Test Location',
        center: { lat: 51.5, lng: -0.1 },
        bounds: { sw: { lat: 51.4, lng: -0.2 }, ne: { lat: 51.6, lng: 0.0 } },
      };

      control.markGeocode(result);
      expect(mockMap.fitBounds).toHaveBeenCalledWith(result.bounds);
    });

    it('should pan to center when result has no bounds', () => {
      const result = {
        name: 'Test Location',
        center: { lat: 51.5, lng: -0.1 },
      };

      control.markGeocode(result);
      expect(mockMap.panTo).toHaveBeenCalledWith(result.center);
    });
  });

  describe('_toggle', () => {
    beforeEach(() => {
      control.onAdd(mockMap);
    });

    it('should expand when collapsed', () => {
      const expandSpy = vi.spyOn(control, '_expand');
      control._container.className = 'test-class';

      control._toggle();
      expect(expandSpy).toHaveBeenCalled();
    });

    it('should collapse when expanded', () => {
      const collapseSpy = vi.spyOn(control, '_collapse');
      control._container.className =
        'test-class leaflet-control-opencage-geocoding-expanded';

      control._toggle();
      expect(collapseSpy).toHaveBeenCalled();
    });
  });

  describe('_geocodeResult', () => {
    it('should replace the previous result list', () => {
      // setup.js mocks document.createElement; use real jsdom elements
      const el = (tag) => Document.prototype.createElement.call(document, tag);
      control.onAdd(mockMap);
      control._alts = el('ul');
      control._createAlt = (r) =>
        Object.assign(el('li'), { textContent: r.name });

      control._geocodeResult([{ name: 'a' }, { name: 'b' }, { name: 'c' }]);
      control._geocodeResult([{ name: 'x' }, { name: 'y' }]);

      expect(control._alts.textContent).toBe('xy');
    });
  });

  describe('_keydown', () => {
    // jsdom leaves keyCode at 0, so these only pass when e.key is used
    const press = (key, init) => {
      const e = new KeyboardEvent('keydown', {
        key,
        cancelable: true,
        ...init,
      });
      control._keydown(e);
      return e;
    };
    let selected;

    beforeEach(() => {
      control.onAdd(mockMap);
      // real jsdom <ul>; setup.js mocks document.createElement
      control._alts = Document.prototype.createElement.call(document, 'ul');
      control._alts.innerHTML =
        '<li><a data-result-index="0"></a></li><li><a data-result-index="1"></a></li>';
      control._results = ['first', 'second'];
      selected = vi.spyOn(control, '_geocodeResultSelected');
      selected.mockImplementation(() => {});
    });

    it('should navigate with arrow keys and select with Enter', () => {
      press('ArrowDown');
      press('ArrowDown');
      expect(press('ArrowUp').defaultPrevented).toBe(true);
      expect(press('Enter').defaultPrevented).toBe(true);
      expect(selected).toHaveBeenCalledWith('first');
    });

    it('should close the result list on Escape', () => {
      press('Escape');
      expect(control._alts.className).toContain('alternatives-minimized');
    });

    it('should ignore Enter while an IME composition is in progress', () => {
      press('ArrowDown');
      press('Enter', { isComposing: true });
      expect(selected).not.toHaveBeenCalled();
    });
  });

  describe('_geocodeResultSelected', () => {
    const mockResult = {
      name: 'Test Location',
      center: { lat: 51.5, lng: -0.1 },
    };

    beforeEach(() => {
      control.onAdd(mockMap);
    });

    it('should call onResultClick callback when provided', () => {
      const onResultClick = vi.fn();
      control.options.onResultClick = onResultClick;

      control._geocodeResultSelected(mockResult);
      expect(onResultClick).toHaveBeenCalledWith(mockResult);
    });

    it('should mark geocode when addResultToMap is true', () => {
      const markGeocodeSpy = vi.spyOn(control, 'markGeocode');
      control.options.addResultToMap = true;

      control._geocodeResultSelected(mockResult);
      expect(markGeocodeSpy).toHaveBeenCalledWith(mockResult);
    });

    it('should not mark geocode when addResultToMap is false', () => {
      const markGeocodeSpy = vi.spyOn(control, 'markGeocode');
      control.options.addResultToMap = false;

      control._geocodeResultSelected(mockResult);
      expect(markGeocodeSpy).not.toHaveBeenCalled();
    });
  });
});
