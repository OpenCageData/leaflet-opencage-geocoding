/**
 * Development entry point
 */
import { Map as LeafletMap, Marker, TileLayer } from 'leaflet';
import {
  openCageGeocoding,
  OpenCageGeocoding,
  OpenCageGeocoder,
} from './js/index.js';
import 'leaflet/dist/leaflet.css';
import './css/OpenCageGeocoding.css';

// Initialize the map
const map = new LeafletMap('map').setView([51.52255, -0.10249], 13);
// Add a tile layer (OpenStreetMap)
new TileLayer('http://tile.osm.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Geocoding options
const options = {
  key: '3c38d15e76c02545181b07d3f8cfccf0', // DEMO KEY - Replace with your API key
  limit: 10,
  placeholder: 'Search for places...',
  errorMessage: 'Location not found. Try a different search.',
  collapsed: true,
  onResultClick: (result) => {
    console.log('🎯 Result clicked:', result);
  },
};

console.log('⏳ Loading OpenCage Geocoding Control...');
// const control1 =
new OpenCageGeocoding(options).addTo(map);
// or using the factory function
// const control2 =
openCageGeocoding(options);

const geocoder = new OpenCageGeocoder(options);
let marker;

// Demo: Programmatic geocoding
console.log('🤖 Running programmatic search demo...');
geocoder.geocode('Brandenburg Gate, Berlin', function (results) {
  if (results && results.length > 0) {
    console.log('🗺️ Programmatic search result:', results[0]);
  }
});

map.on('click', function (e) {
  const query = e.latlng.lat.toString() + ',' + e.latlng.lng.toString();
  geocoder.geocode(query, function (results) {
    const r = results[0];
    if (r) {
      console.log('📌 Reverse geocoding result:', r);
      if (marker) {
        marker.setLatLng(r.center).setPopupContent(r.name).openPopup();
      } else {
        marker = new Marker(r.center).bindPopup(r.name).addTo(map).openPopup();
      }
    }
  });
});
