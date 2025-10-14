import L from 'leaflet';
import { OpenCageGeocoder } from './geocoder.js';
import '../css/L.Control.OpenCageGeocoding.css';

/**
 * OpenCage Geocoding Control for Leaflet
 */
export class OpenCageGeocodingControl extends L.Control {
  constructor(options = {}) {
    super(options);
    this.options = {
      showResultIcons: false,
      collapsed: true,
      expand: 'click',
      position: 'topright',
      placeholder: 'Search...',
      errorMessage: 'Nothing found.',
      key: '',
      onResultClick: undefined,
      addResultToMap: true,
      limit: 5,
      ...options,
    };

    this._callbackId = 0;

    if (!this.options.geocoder) {
      this.options.geocoder = new OpenCageGeocoder(this.options);
    }
  }
  onAdd(map) {
    const className = 'leaflet-control-opencage-geocoding';
    const container = L.DomUtil.create('div', className);
    const icon = L.DomUtil.create(
      'div',
      'leaflet-control-opencage-geocoding-icon',
      container
    );
    const form = L.DomUtil.create('form', className + '-form', container);
    this._form = form;

    this._map = map;
    this._container = container;

    const input = L.DomUtil.create('input');
    this._input = input;
    input.type = 'text';
    input.placeholder = this.options.placeholder;

    L.DomEvent.addListener(input, 'keydown', this._keydown, this);

    this._errorElement = document.createElement('div');
    this._errorElement.className = className + '-form-no-error';
    this._errorElement.innerHTML = this.options.errorMessage;

    this._alts = L.DomUtil.create(
      'ul',
      className +
        '-alternatives leaflet-control-opencage-geocoding-alternatives-minimized'
    );

    form.appendChild(input);
    form.appendChild(this._errorElement);
    container.appendChild(this._alts);

    L.DomEvent.addListener(form, 'submit', this._geocode, this);

    if (this.options.collapsed) {
      if (this.options.expand === 'click') {
        L.DomEvent.addListener(
          icon,
          'click',
          (e) => {
            if (e.button === 0 && e.detail !== 2) {
              this._toggle();
            }
          },
          this
        );
      } else {
        L.DomEvent.addListener(icon, 'mouseover', this._expand, this);
        L.DomEvent.addListener(icon, 'mouseout', this._collapse, this);
        this._map.on('movestart', this._collapse, this);
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
      'leaflet-control-opencage-geocoding-spinner'
    );

    if (results.length === 1) {
      this._geocodeResultSelected(results[0]);
    } else if (results.length > 0) {
      this._alts.innerHTML = '';
      this._results = results;
      L.DomUtil.removeClass(
        this._alts,
        'leaflet-control-opencage-geocoding-alternatives-minimized'
      );
      for (let i = 0; i < results.length; i++) {
        this._alts.appendChild(this._createAlt(results[i], i));
      }
    } else {
      L.DomUtil.addClass(
        this._errorElement,
        'leaflet-control-opencage-geocoding-error'
      );
    }
  }

  /**
   * Mark geocode result on map
   */
  markGeocode(result) {
    if (result.bounds) {
      // console.log(`fit bounds`, result.bounds);
      this._map.fitBounds(result.bounds);
    } else {
      // console.log(`pan to`, result.center);
      this._map.panTo(result.center);
    }

    if (this._geocodeMarker) {
      this._map.removeLayer(this._geocodeMarker);
    }

    this._geocodeMarker = new L.Marker(result.center)
      .bindPopup(result.name)
      .addTo(this._map)
      .openPopup();

    return this;
  }

  /**
   * Perform geocoding
   */
  _geocode(event) {
    L.DomEvent.preventDefault(event);

    L.DomUtil.addClass(
      this._container,
      'leaflet-control-opencage-geocoding-spinner'
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

    if (
      this.options.onResultClick &&
      typeof this.options.onResultClick === 'function'
    ) {
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
    if (
      this._container.className.indexOf(
        'leaflet-control-opencage-geocoding-expanded'
      ) >= 0
    ) {
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
      'leaflet-control-opencage-geocoding-expanded'
    );
    this._input.select();
  }

  /**
   * Collapse the control
   */
  _collapse() {
    this._container.className = this._container.className.replace(
      ' leaflet-control-opencage-geocoding-expanded',
      ''
    );
    L.DomUtil.addClass(
      this._alts,
      'leaflet-control-opencage-geocoding-alternatives-minimized'
    );
    L.DomUtil.removeClass(
      this._errorElement,
      'leaflet-control-opencage-geocoding-error'
    );
  }

  /**
   * Clear results display
   */
  _clearResults() {
    L.DomUtil.addClass(
      this._alts,
      'leaflet-control-opencage-geocoding-alternatives-minimized'
    );
    this._selection = null;
    L.DomUtil.removeClass(
      this._errorElement,
      'leaflet-control-opencage-geocoding-error'
    );
  }

  /**
   * Create alternative result element
   */
  _createAlt(result, index) {
    const li = document.createElement('li');
    li.innerHTML =
      '<a href="#" data-result-index="' +
      index +
      '">' +
      (this.options.showResultIcons && result.icon
        ? '<img src="' + result.icon + '"/>'
        : '') +
      result.name +
      '</a>';

    L.DomEvent.addListener(
      li,
      'click',
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
          'leaflet-control-opencage-geocoding-selected'
        );
        this._selection =
          this._selection[dir > 0 ? 'nextSibling' : 'previousSibling'];
      }

      if (!this._selection) {
        this._selection = this._alts[dir > 0 ? 'firstChild' : 'lastChild'];
      }

      if (this._selection) {
        L.DomUtil.addClass(
          this._selection.firstChild,
          'leaflet-control-opencage-geocoding-selected'
        );
      }
    };

    switch (e.keyCode) {
      case 38: // Up
        select(-1);
        L.DomEvent.preventDefault(e);
        break;
      case 40: // Down
        select(1);
        L.DomEvent.preventDefault(e);
        break;
      case 13: // Enter
        if (this._selection) {
          const index = parseInt(
            this._selection.firstChild.getAttribute('data-result-index'),
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

// Factory function for backwards compatibility
const openCageGeocoding = (options) => {
  return new OpenCageGeocodingControl(options);
};

// Attach geocoder to the control class
OpenCageGeocodingControl.Geocoder = OpenCageGeocoder;
OpenCageGeocodingControl.geocoder = (options) => {
  return new OpenCageGeocoder(options);
};

// Attach to L.Control for global usage
Object.assign(L.Control, {
  OpenCageGeocoding: OpenCageGeocodingControl,
  openCageGeocoding: openCageGeocoding,
});

// Export for ES modules
export { OpenCageGeocoder, openCageGeocoding };
export default OpenCageGeocodingControl;
