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
      iconLabel: 'Search',
      errorMessage: 'Nothing found.',
      key: '',
      onResultClick: undefined,
      addResultToMap: true,
      limit: 5,
      ...options,
    };

    if (!this.options.geocoder) {
      this.options.geocoder = new OpenCageGeocoder(this.options);
    }
  }
  onAdd(map) {
    const className = 'leaflet-control-opencage-geocoding';
    const container = L.DomUtil.create('div', className);
    // A real button when it opens the control, so keyboard users can reach
    // it; otherwise it only shows the spinner and stays out of the tab order.
    const icon = L.DomUtil.create(
      this.options.collapsed ? 'button' : 'div',
      'leaflet-control-opencage-geocoding-icon',
      container
    );
    this._icon = icon;
    if (this.options.collapsed) {
      icon.type = 'button';
      icon.setAttribute('aria-label', this.options.iconLabel);
      icon.setAttribute('aria-expanded', 'false');
    }
    const form = L.DomUtil.create('form', className + '-form', container);
    this._form = form;

    this._map = map;
    this._container = container;

    const input = L.DomUtil.create('input');
    this._input = input;
    input.type = 'text';
    input.placeholder = this.options.placeholder;

    // Combobox pattern: focus stays in the input, which tells screen readers
    // which result is highlighted via aria-activedescendant.
    const listId = `${className}-results-${L.stamp(this)}`;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', listId);
    input.setAttribute('autocomplete', 'off');

    L.DomEvent.addListener(input, 'keydown', this._keydown, this);

    // A status region. Its text is only filled in when the error is shown:
    // screen readers announce changes, not text that was always there.
    this._errorElement = document.createElement('div');
    this._errorElement.className = className + '-form-no-error';
    this._errorElement.setAttribute('role', 'status');

    this._alts = L.DomUtil.create(
      'ul',
      className +
        '-alternatives leaflet-control-opencage-geocoding-alternatives-minimized'
    );
    this._alts.id = listId;
    this._alts.setAttribute('role', 'listbox');
    this._alts.setAttribute('aria-label', this.options.iconLabel);

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
        // keyboard users cannot hover; Enter/Space on the button opens it
        L.DomEvent.addListener(icon, 'click', this._expand, this);
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
      this._alts.replaceChildren();
      this._results = results;
      L.DomUtil.removeClass(
        this._alts,
        'leaflet-control-opencage-geocoding-alternatives-minimized'
      );
      for (let i = 0; i < results.length; i++) {
        this._alts.appendChild(this._createAlt(results[i], i));
      }
      this._setListOpen(true);
    } else {
      this._errorElement.textContent = this.options.errorMessage;
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

    // .bindPopup treats the input as HTML
    const popupEl = document.createElement('div');
    popupEl.textContent = result.name;

    this._geocodeMarker = new L.Marker(result.center)
      .bindPopup(popupEl)
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
    this._setExpanded(true);
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
    this._setExpanded(false);
    L.DomUtil.addClass(
      this._alts,
      'leaflet-control-opencage-geocoding-alternatives-minimized'
    );
    this._setListOpen(false);
    L.DomUtil.removeClass(
      this._errorElement,
      'leaflet-control-opencage-geocoding-error'
    );
    this._errorElement.textContent = '';
  }

  /**
   * Tell assistive technology whether the toggle button's control is open
   */
  _setExpanded(expanded) {
    if (this.options.collapsed) {
      this._icon.setAttribute('aria-expanded', String(expanded));
    }
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
    this._setListOpen(false);
    L.DomUtil.removeClass(
      this._errorElement,
      'leaflet-control-opencage-geocoding-error'
    );
    this._errorElement.textContent = '';
  }

  /**
   * Tell screen readers whether the result list is showing. A closed list
   * has no highlighted result.
   */
  _setListOpen(open) {
    this._input.setAttribute('aria-expanded', String(open));
    if (!open) {
      this._input.removeAttribute('aria-activedescendant');
    }
  }

  /**
   * Create alternative result element
   */
  _createAlt(result, index) {
    const li = document.createElement('li');
    li.id = `${this._alts.id}-${index}`;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    const a = document.createElement('a');
    a.href = '#';
    // Results are reached with the arrow keys from the input, not with Tab.
    // An option's content is presentational to screen readers, so the link
    // needs no role of its own.
    a.tabIndex = -1;
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
        this._selection.setAttribute('aria-selected', 'false');
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
        this._selection.setAttribute('aria-selected', 'true');
        this._input.setAttribute('aria-activedescendant', this._selection.id);
      }
    };

    // Ignore keys that confirm an IME composition (e.g. Japanese input):
    // Enter there must not pick a result. keyCode 229 covers Safari, which
    // reports isComposing: false on that keydown.
    if (e.isComposing || e.keyCode === 229) {
      return true;
    }

    switch (e.key) {
      case 'ArrowUp':
        select(-1);
        L.DomEvent.preventDefault(e);
        break;
      case 'ArrowDown':
        select(1);
        L.DomEvent.preventDefault(e);
        break;
      case 'Escape':
        // Close the result list only. Collapsing the whole control would
        // strand keyboard users, since the icon that reopens it cannot be
        // focused.
        this._clearResults();
        break;
      case 'Enter':
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
