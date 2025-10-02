import { vi } from 'vitest';

// Mock Leaflet
const mockControl = vi.fn();
mockControl.prototype = {};

global.L = {
  Control: mockControl,
  DomUtil: {
    create: vi.fn((tag, className, parent) => {
      const element = {
        tagName: tag.toUpperCase(),
        className: className || '',
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(),
        },
        style: {},
        appendChild: vi.fn(),
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        click: vi.fn(),
        focus: vi.fn(),
        blur: vi.fn(),
        select: vi.fn(),
        value: '',
        innerHTML: '',
        textContent: '',
        type: '',
      };

      if (parent) {
        parent.appendChild(element);
      }

      return element;
    }),
    addClass: vi.fn(),
    removeClass: vi.fn(),
  },
  DomEvent: {
    addListener: vi.fn(),
    preventDefault: vi.fn(),
    disableClickPropagation: vi.fn(),
  },
  Util: {
    setOptions: vi.fn(),
    getParamString: vi.fn(() => '?param=value'),
    bind: vi.fn((fn, context) => fn.bind(context)),
  },
  latLng: vi.fn((lat, lng) => ({ lat, lng })),
  latLngBounds: vi.fn((sw, ne) => ({ sw, ne })),
  Marker: vi.fn(() => ({
    bindPopup: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    openPopup: vi.fn().mockReturnThis(),
  })),
  Class: {
    extend: vi.fn((options) => {
      function MockClass(opts) {
        if (options.initialize) {
          options.initialize.call(this, opts);
        }
      }
      Object.assign(MockClass.prototype, options);
      return MockClass;
    }),
  },
};

// Mock the Control constructor to be extendable
L.Control.extend = vi.fn((options) => {
  function ExtendedControl(opts) {
    Object.assign(this, options);
    if (options.initialize) {
      options.initialize.call(this, opts);
    }
  }
  Object.assign(ExtendedControl.prototype, options);
  return ExtendedControl;
});

// Create a mock for the DOM
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
  },
});

// Mock DOM utilities that Leaflet uses
global.document.createElement = vi.fn().mockImplementation((tagName) => {
  const element = {
    tagName: tagName.toUpperCase(),
    className: '',
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
    },
    style: {},
    appendChild: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    click: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    select: vi.fn(),
    value: '',
    innerHTML: '',
    textContent: '',
    placeholder: '',
    type: '',
  };

  if (tagName === 'img') {
    element.onload = null;
    element.onerror = null;
    element.src = '';
  }

  return element;
});

global.document.getElementsByTagName = vi.fn(() => [{ appendChild: vi.fn() }]);

// Mock fetch for API calls
global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});
