import L, { Control, Marker } from 'leaflet';
import { OpenCageGeocoder } from './geocoder.js';
import '../css/OpenCageGeocoding.css';

/**
 * OpenCage Geocoding Control for Leaflet
 */
export class OpenCageGeocodingControl extends Control {
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

    input.addEventListener('keydown', this._keydown.bind(this));

    this._errorElement = document.createElement('div');
    this._errorElement.className = className + '-form-no-error';
    this._errorElement.innerText = this.options.errorMessage;

    this._alts = L.DomUtil.create(
      'ul',
      className +
      '-alternatives leaflet-control-opencage-geocoding-alternatives-minimized'
    );

    form.appendChild(input);
    form.appendChild(this._errorElement);
    container.appendChild(this._alts);

    form.addEventListener('submit', this._geocode.bind(this));

    if (this.options.collapsed) {
      if (this.options.expand === 'click') {
        icon.addEventListener('click', (e) => {
          if (e.button === 0 && e.detail !== 2) {
            this._toggle();
          }
        });
      } else {
        icon.addEventListener('mouseover', this._expand.bind(this));
        icon.addEventListener('mouseout', this._collapse.bind(this));
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
    this._container.classList.remove(
      'leaflet-control-opencage-geocoding-spinner'
    );

    if (results.length === 1) {
      this._geocodeResultSelected(results[0]);
    } else if (results.length > 0) {
      this._alts.innerText = '';
      this._results = results;
      this._alts.classList.remove(
        'leaflet-control-opencage-geocoding-alternatives-minimized'
      );
      for (let i = 0; i < results.length; i++) {
        this._alts.appendChild(this._createAlt(results[i], i));
      }
    } else {
      this._errorElement.classList.add(
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

    this._geocodeMarker = new Marker(result.center)
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

    this._container.classList.add('leaflet-control-opencage-geocoding-spinner');
    // this.classList.add('leaflet-control-opencage-geocoding-spinner');
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
    this._container.classList.add(
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
    this._alts.classList.add(
      'leaflet-control-opencage-geocoding-alternatives-minimized'
    );
    this._errorElement.classList.remove(
      'leaflet-control-opencage-geocoding-error'
    );
  }

  /**
   * Clear results display
   */
  _clearResults() {
    this._alts.classList.add(
      'leaflet-control-opencage-geocoding-alternatives-minimized'
    );
    this._selection = null;
    this._errorElement.classList.remove(
      'leaflet-control-opencage-geocoding-error'
    );
  }

  /**
   * Create alternative result element
   */
  _createAlt(result, index) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';
    a.dataset.resultIndex = index;

    if (this.options.showResultIcons && result.icon) {
      try {
        const u = new URL(result.icon, window.location.href);
        if (u.protocol === 'http:' || u.protocol === 'https:') {
          const img = document.createElement('img');
          img.src = u.href;
          img.alt = '';
          a.appendChild(img);
        }
      } catch {
        // ignore invalid URL
      }
    }

    a.appendChild(document.createTextNode(result.name));
    li.appendChild(a);

    // L.DomEvent.addListener(
    li.addEventListener('click', () => {
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
          'leaflet-control-opencage-geocoding-selected'
        );
        this._selection =
          this._selection[dir > 0 ? 'nextSibling' : 'previousSibling'];
      }

      if (!this._selection) {
        this._selection = this._alts[dir > 0 ? 'firstChild' : 'lastChild'];
      }

      if (this._selection) {
        this._selection.firstChild.classList.add(
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
