import { OpenCageGeocoder } from './geocoder.js';
import { OpenCageGeocodingControl } from './geocoding.js';

const OpenCageGeocoding = OpenCageGeocodingControl;
// Factory function for backwards compatibility
const openCageGeocoding = (options) => {
  return new OpenCageGeocodingControl(options);
};

// Attach geocoder to the control class
OpenCageGeocodingControl.Geocoder = OpenCageGeocoder;
OpenCageGeocodingControl.geocoder = (options) => {
  return new OpenCageGeocoder(options);
};

// TODO: decide if we want to attach to L.Control or not
// Attach to L.Control for global usage
Object.assign(L.Control, {
  OpenCageGeocoding: OpenCageGeocodingControl,
  openCageGeocoding: openCageGeocoding,
});

// Export for ES modules
export { OpenCageGeocoder, openCageGeocoding, OpenCageGeocoding };
export default OpenCageGeocodingControl;
