# OpenCage Geocoding Control for Leaflet

A [Leaflet](http://leafletjs.com/) geocoding control that uses OpenCage's [geocoding API](https://opencagedata.com).

Check out a demo page in `/demo`. Or take a look at the live [demo](https://opencagedata.com/tutorials/geocode-in-leaflet).

Note: if you want location autosuggest then what you want is [OpenCage's geosearch](https://opencagedata.com/geosearch), not geocoding.

## Dependencies

Leaflet version 0.7+ to 1.9.x

For Leaflet version 2: check the [release branch v3.x](https://github.com/OpenCageData/leaflet-opencage-geocoding/tree/release/v3.0.0)

## Breaking changes

Starting with version 2.1, Bower is no longer supported. The package is now published on npm in both UMD and ESM formats.

## Installation

### Via npm

```bash
npm install leaflet-opencage-geocoding
# or
pnpm add leaflet-opencage-geocoding
# or
yarn add leaflet-opencage-geocoding
```

The package includes both UMD and ESM builds, which you can import based on your project setup:

```javascript
// ESM
import 'leaflet-opencage-geocoding';

// CommonJS
require('leaflet-opencage-geocoding');
```

### Via CDN (for vanilla JS/HTML projects)

For classic HTML projects, you can use the CDN:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/opencagedata/leaflet-opencage-geocoding@v2.1.0/dist/css/L.Control.OpenCageGeocoding.min.css"
/>
<script src="https://cdn.jsdelivr.net/gh/opencagedata/leaflet-opencage-geocoding@v2.1.0/dist/js/L.Control.OpenCageGeocoding.min.js"></script>
```

### Other options

- Clone from GitHub: `git@github.com:opencagedata/leaflet-opencage-geocoding.git`
- Download a [zip or tarball archive](https://github.com/opencagedata/leaflet-opencage-geocoding/tags)

## Usage

Load the plugin's CSS and JavaScript files:

```HTML
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/opencagedata/leaflet-opencage-geocoding@v2.1.0/dist/css/L.Control.OpenCageGeocoding.min.css" />
<script src="https://cdn.jsdelivr.net/gh/opencagedata/leaflet-opencage-geocoding@v2.1.0/dist/js/L.Control.OpenCageGeocoding.min.js"></script>
```

Add the plugin's control to an `L.Map` instance:

```javascript
var map = L.map('map').setView([51.52255, -0.10249], 13);
var options = {
  key: 'your-api-key-here',
  limit: 10,
};
var control = L.Control.openCageGeocoding(options).addTo(map);
L.tileLayer('http://tile.osm.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);
```

## Customizing

By default, when a geocoding result is found, the control will centre the map on it and place a marker
at its location. This can be customised by overwriting the control's markGeocode function to perform
any action desired.

For example:

```javascript
var control = L.Control.openCageGeocoding(options).addTo(map);

control.markGeocode = function (result) {
  var bbox = result.bbox;
  L.polygon([
    bbox.getSouthEast(),
    bbox.getNorthEast(),
    bbox.getNorthWest(),
    bbox.getSouthWest(),
  ]).addTo(map);
};
```

This will add a polygon representing the result's bounding box when a result is selected.

## Options

You can overwrite the following options, for example, to translate.

```javascript
var options = {
    key: '', // your OpenCage API key
    limit: 5 // number of results to be displayed
    position: 'topright',
    placeholder: 'Search...', // the text in the empty search box
    errorMessage: 'Nothing found.',
    showResultIcons: false,
    collapsed: true,
    expand: 'click',
    addResultToMap: true, // if a map marker should be added after the user clicks a result
    onResultClick: undefined, // callback with result as first parameter
    resultExtension: {
        geohash: "annotations.geohash",
        what3words: "annotations.what3words",
        addressComponents: "components"
    } //if additional attributes from OpenCage search API should be added to the result
};

var control = L.Control.openCageGeocoding(options).addTo(map);

```

## Contributing

See `CONTRIBUTING.md` file.

## License

See `LICENSE` file.

### Who is OpenCage GmbH?

<a href="https://opencagedata.com"><img src="opencage_logo_300_150.png"></a>

We run the [OpenCage Geocoder](https://opencagedata.com). Learn more [about us](https://opencagedata.com/about).

We also run [Geomob](https://thegeomob.com), a series of regular meetups for location based service creators, where we do our best to highlight geoinnovation. If you like geo stuff, you will probably enjoy [the Geomob podcast](https://thegeomob.com/podcast/).
