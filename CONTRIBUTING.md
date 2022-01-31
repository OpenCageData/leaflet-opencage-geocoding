## Development and Production Versions

Changes should to go the source files in `src/`. Then you run the build process
outlines below to generate the production-ready files which go into `dist/`. E.g.
those files are concatenated and minified.

## Rebuilding from Source

The plugin's build process is managed by [Grunt](http://gruntjs.com/installing-grunt),
which in turn is built on top of [Node.js](http://nodejs.org/). You'll need to have
both of these applications installed on your machine to rebuild the plugin from source.

Assuming you have both Grunt and Node.js (version 10 or higher) installed, you can
install all the build dependencies with a single command, from the plugin's root
directory:

```shell
$ yarn install
```

This will install all of the plugin's dependencies into the `node_modules` directory
(and which is also why you'll find this directory in the plugin's `.gitignore` file).

Once you have all the dependencies in place, you can rebuild the plugin from source
by simply running `yarn build`:

```shell
$ yarn build
yarn run v1.22.17
# $ grunt
Running "clean:dist" (clean) task
>> 3 paths cleaned.

Running "jshint:files" (jshint) task
>> 1 file lint free.

Running "concat:dist" (concat) task

Running "uglify:dist" (uglify) task
>> 1 file created 10.07 kB → 6.82 kB

Running "cssmin:minify" (cssmin) task
>> 1 file created. 2.83 kB → 2.18 kB

Running "copy:images" (copy) task
Copied 2 files

Done.
✨  Done in 0.59s.
```

## Releasing

1. update version in `bower.json` and `package.json`

2. git commit, git push

3. git tag <version>, git push --tags
