* version 2.5.0 - 2026-08-27
    * Fix: `reverse()` now builds its own `q=lat,lng` query instead of stringifying the location object
    * Fix: `reverseQueryParams` was declared but never used. Now used, added tests
    * Fix: a result handler that throws is no longer called a second time with an empty result set
    * Fix: exceptions from result handlers are no longer swallowed. They are now re-thrown (asynchronously)

* version 2.4.2 - unreleased
    * Demo page: the map click handler uses `reverse()` rather than hand-building a coordinate string
    * Fix: demo page escapes HTML before inserting it into the DOM
    * Code cleanup: replace deprecated `__dirname` in the vite config
    * Code cleanup: the Github Action workflow now only requests read permissions
    * Build process: Node v18 is no longer supported
    * created a CHANGED.md file and backfilled
    * NPM package updates: vite, js-yaml, undici, postcss, dev dependencies

* version 2.4.1 - 2026-06-08
    * Docs: update the npm install links in the README
    * Demo page is now labelled with the version it demonstrates

* version 2.4.0 - 2026-05-12
    * Feature: use `fetch()` instead of the old JSONP request handling
    * Test suite: tests for the new fetch based geocoder, including error responses
    * Code cleanup: upgrade Github Actions, use `npm install` instead of `npm ci`, build on Node 24
    * NPM package updates: minimatch, rollup, flatted, picomatch, vite

* version 2.3.0 - 2026-02-03
    * Code cleanup: build the result list with DOM methods instead of `.innerHTML`, though the API response data is already sanitized
    * NPM package updates: js-yaml

* version 2.2.0 - 2026-02-03
    * Docs: README mentions pnpm and yarn next to npm
    * Docs: README links to the branch with Leaflet v2 support
    * NPM package updates: vite

* version 2.1.0 - 2025-10-14
    * Code cleanup: modernise the build, replacing grunt with vite. The package now ships a UMD and an ESM build
    * Test suite: first test suite, using vitest, covering the control and the geocoder
    * Bower is no longer supported, `bower.json` removed. The package is published to npm
    * Code cleanup: eslint and prettier configuration, Github Actions run lint, tests and build
    * Demo page: OSM tiles no longer need subdomains, with http/s it is faster without
    * Docs: rewrite of README and CONTRIBUTING for the vite build
    * Docs: explain that this is geocoding, not geosearch
    * NPM package updates: minimist, grunt, async, braces, micromatch

* version 2.0.0 - 2022-02-01
    * Code cleanup: the plugin is renamed from "OpenCageSearch" to "OpenCageGeocoding". Files, the control, the constructor and the CSS classes all change name
    * Demo page: bump the Leaflet version

* version 1.4.2 - 2022-01-31
    * Add SECURITY.md
    * NPM package updates, including grunt, lodash, path-parse

* version 1.4.1 - 2021-01-09
    * Fix: don't fail when the `resultExtension` option is not provided. Thanks Suhas Pachore

* version 1.4.0 - 2021-01-07
    * Feature: new `resultExtension` option to pass additional fields of the API response into the result. Thanks Suhas Pachore
    * Leaflet 1.6.0 to 1.7.1, grunt 1.1 to 1.3
    * Docs: add a "Who is OpenCage" section to the README
    * NPM package updates: websocket-extensions, lodash, ini

* version 1.3.2 - 2020-04-06
    * NPM package updates, kind-of vulnerability CVE-2019-20149

* version 1.3.1 - 2020-03-17
    * Require minimist 1.2.2 
    * Correct the license information

* version 1.3.0 - 2019-09-25
    * Feature: new options `addResultToMap` and `onResultClick` to control what happens with a result
    * Docs: Company name changed, thus update the copyright

* version 1.2.1 - 2019-07-14
    * Update lodash, CVE-2019-10744. Only used in the grunt build process
    * Demo page: rawgit is closing, URLs moved to jsDelivr and use the min instead of the dev files
    * Demo page: upgrade to Leaflet 1.3.4
    * Demo page: mention signing up for a Thunderforest API key

* version 1.2.0 - 2018-09-30
    * Feature: use the current map center as proximity hint, so results near the visible map are preferred 

* version 1.1.5 - 2018-08-28
    * Switch from npm to yarn, update grunt 0.4 to 1.0 

* version 1.1.4 - 2018-08-28
    * Fix: handle HTTP 400 error responses from the API 
    * Update the endpoint URLs, more https

* version 1.1.3 - 2018-05-18
    * Demo page: replace Mapquest tiles with Thunderforest tiles
    * Demo page: update Leaflet to 1.3.1
    * We no longer use Github pages
    * Docs: explain the options in the README

* version 1.1.2 - 2015-08-31
    * Fix: MSIE11 click handling. Check for "not a double click" instead of an explicit single click check
    * Docs: Explains how to customize the map marker

* version 1.1.1 - 2015-08-22
    * Feature: the input placeholder text can now be set

* version 1.1.0 - 2015-06-29
    * Fix: tolerate results with a missing "bounds" field. Thanks Harry Wood
    * Fix: add API key to demo page
    * Docs: split the README file into more documents (CONTRIBUTING, CREDITS, etc)

* version 1.0.2 - 2014-09-11
    * Demo page: switch from Mapbox to Mapquest tiles

* version 1.0.1 - 2014-06-26
	* API subdomain changed after public beta.

* version 1.0.0 - 2014-06-25
    * First release. Packaged with Bower.