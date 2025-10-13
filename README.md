# OpenCage Geocoding Control for Leaflet

A [Leaflet](http://leafletjs.com/) geocoding control that uses OpenCage's [geocoding API](https://opencagedata.com).

Check out a demo page in `/demo`. Or take a look at the live [demo](https://opencagedata.com/tutorials/geocode-in-leaflet).

Note: if you want location autosuggest, then what you want is [OpenCage's geosearch](https://opencagedata.com/geosearch), not geocoding.

## Dependencies

- [Leaflet](https://www.npmjs.com/package/leaflet) version 2.0.0+
- [opencage-api-client](https://www.npmjs.com/package/opencage-api-client) version 2+

## Breaking changes

Starting with version 3, the supported Leaflet version is 2.0 and superior; for CDN usage, the filenames have changed, and there are no more `L.Control` prefixes.

## Installation

### Via npm, yarn or pnpm

```bash
npm install leaflet-opencage-geocoding
# or
yarn add leaflet-opencage-geocoding
# or
pnpm add leaflet-opencage-geocoding
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
  href="https://cdn.jsdelivr.net/gh/opencagedata/leaflet-opencage-geocoding@v3.0.0-alpha.1/dist/css/OpenCageGeocoding.min.css"
/>

<script type="importmap">
  {
    "imports": {
      "OpenCageGeocoding": "https://cdn.jsdelivr.net/gh/opencagedata/leaflet-opencage-geocoding@v3.0.0-alpha.1/dist/js/OpenCageGeocoding.esm.js"
    }
  }
</script>
```

## Usage

Load the plugin's CSS and JavaScript files as shown in above:

Add the plugin's control to a `Map` instance:

```javascript
const map = new Map('map').setView([51.52255, -0.10249], 13);

const options = {
  key: 'your-api-key-here',
  limit: 10,
};
const control = new OpenCageGeocoding(options).addTo(map);

new TileLayer('http://tile.osm.org/{z}/{x}/{y}.png', {
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
const control = new OpenCageGeocoding(options).addTo(map);

control.markGeocode = function (result) {
  const bbox = result.bbox;
  new Polygon([
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
const options = {
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

const control = new OpenCageGeocoding(options).addTo(map);

```

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) file.

## License

See [`LICENSE`](./LICENSE) file.

## Credits

See [`CREDITS`](./CREDITS) file.

### Who is OpenCage GmbH?

<a href="https://opencagedata.com"><img src="opencage_logo_300_150.png"></a>

We run the [OpenCage Geocoder](https://opencagedata.com). Learn more [about us](https://opencagedata.com/about).

We also run [Geomob](https://thegeomob.com), a series of regular meetups for location based service creators, where we do our best to highlight geoinnovation. If you like geo stuff, you will probably enjoy [the Geomob podcast](https://thegeomob.com/podcast/).
