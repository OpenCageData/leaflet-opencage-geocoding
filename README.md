# OpenCage Data Search and Geocoding Control for Leaflet

A [Leaflet](http://leafletjs.com/) search control that uses [OpenCage Data's](http://geocoder.opencagedata.com/)
geocoder.

To see the plugin in action, take a look at the [demo](http://geocoder.opencagedata.com/code/leaflet-demo.html).

## Installation

Clone from GitHub: `git@github.com:lokku/leaflet-opencage-search.git`.

Install with Bower: `$ bower install Leaflet.OpenCage.Search`.

Download a [zip or tarball archive](https://github.com/lokku/leaflet-opencage-search/releases) from GitHub.

## Configuration

The control uses two image files that it expects to find in a directory with
a path relative to the control's CSS files as `../images`. If you've installed
the control using Bower you'll find these in `bower_components/Leaflet.OpenCage.Search/dist/images/`. If you've
cloned the control's GitHub repository or downloaded and unpacked an archive
from GitHub, you'll find these in 'dist/images'.

Whichever installation method you've chosen, you'll need to move a copy of these
two image files to a directory relative to the location of the control's CSS files.

## Usage

Load the plugin's CSS and JavaScript files:

```HTML
<link rel="stylesheet" href="leaflet-opencage-search/dist/css/L.Control.OpenCageSearch.dev.css" />
<script src="leaflet-opencage-search/dist/js/L.Control.OpenCageSearch.dev.js"></script>
```

Add the plugin's control to an `L.Map` instance:

```javascript
var map = L.map('map').setView([51.52255, -0.10249], 13);
var options = {
	key: 'your-api-key-here',
	limit: 10
};
var control = L.Control.openCageSearch(options).addTo(map);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

```

## Development and Production Versions

## Rebuilding from Source

The plugin's build process is managed by [Grunt](http://gruntjs.com/installing-grunt),
which in turn is built on top of [Node.js](http://nodejs.org/). You'll need to have
both of these applications installed on your machine to rebuild the plugin from source.

Assuming you have both Grunt and Node.js installed, you can install all the build
dependencies with a single command, from the plugin's root directory:

```shell
$ npm install
```

This will install all of the plugin's dependencies into the `node_modules` directory
(and which is also why you'll find this directory in the plugin's `.gitignore` file).

Once you have all the dependencies in place, you can rebuild the plugin from source
by simply running `grunt`:

```shell
$ grunt
Running "clean:dist" (clean) task
Cleaning dist/css...OK
Cleaning dist/images...OK
Cleaning dist/js...OK

Running "jshint:files" (jshint) task
>> 1 file lint free.

Running "concat:dist" (concat) task
File dist/js/L.Control.OpenCageSearch.dev.js created.
File dist/css/L.Control.OpenCageSearch.dev.css created.

Running "uglify:dist" (uglify) task
File dist/js/L.Control.OpenCageSearch.min.js created: 8.38 kB → 6.09 kB

Running "cssmin:minify" (cssmin) task
File dist/css/L.Control.OpenCageData.Search.min.css created: 2.86 kB → 2.5 kB

Running "copy:images" (copy) task
Copied 2 files

Done, without errors.
```

## Credits

This plugin was based on and inspired by [Per Liedman's](https://github.com/perliedman) [Leaflet Control Geocoder](https://github.com/perliedman/leaflet-control-geocoder).
Thanks, credits and kudos go to Per for making a well structured plugin and for
making it available under an Open Source license.
