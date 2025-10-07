## Development and Production Versions

Changes should go into the source files in `src/`. Then you run the build process outlined below to generate the production-ready files which go into `dist/`. These files are bundled and minified for optimal performance.

## Rebuilding from Source

The plugin's build process is managed by [Vite](https://vitejs.dev/), a modern build tool built on top of [Node.js](http://nodejs.org/). You'll need to have Node.js installed on your machine to rebuild the plugin from source.

Assuming you have Node.js (version 18 or higher) installed, you can install all the build dependencies with a single command, from the plugin's root directory:

```bash
npm install
```

This will install all of the plugin's dependencies into the `node_modules` directory (which is also why you'll find this directory in the plugin's `.gitignore` file).

Once you have all the dependencies in place, you can rebuild the plugin from source by running `npm run build`:

```bash
npm run build
```

This command will:

- Clean the `dist/` directory
- Build both production (minified) and development versions

### Development Workflow

For active development, you can use the watch mode to automatically rebuild when
source files change:

```bash
npm run dev
```

### Testing

Run the test suite with:

```bash
npm run test
```

For watch mode during development:

```bash
npm run test:watch
```

For test coverage:

```bash
npm run test:coverage
```

### Formatting and Linting

Format code with Prettier:

```bash
npm run format
```

Check code style with ESLint:

```bash
npm run lint
```

## Releasing

1. Update version in `package.json`

2. git commit, git push

3. git tag <version>, git push --tags
