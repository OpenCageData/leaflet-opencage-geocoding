import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import fs from 'node:fs';

// Read package.json for banner information
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// The banner must not depend on the build date: dist/ is committed, so a
// date would rewrite every bundle on every rebuild. Take the copyright years
// from LICENSE so the two cannot drift apart.
const copyrightYears = fs
  .readFileSync('./LICENSE', 'utf8')
  .match(/^Copyright \(c\) ([\d-]+) /m)?.[1];
if (!copyrightYears) {
  throw new Error('vite.config.js: no "Copyright (c) <years>" line in LICENSE');
}

const banner = `/**
 * OpenCage Data Geocoding Control v${pkg.version}
 * Copyright (c) ${copyrightYears}, ${pkg.author.name}
 * ${pkg.author.email}
 * ${pkg.author.url}
 *
 * Licensed under the ${pkg.license} license.
 * Demo: ${pkg.homepage}
 * Source: ${pkg.repository.url}
 */
`;

const footer = ``;

/**
 * https://github.com/vitejs/vite/issues/8412#issuecomment-2377366474
 */
const RollupBannerPlugin = {
  name: 'banner',
  enforce: 'post',
  generateBundle(options, bundle) {
    for (const module of Object.values(bundle)) {
      if (module.type === 'chunk') {
        const shebang = module.code.match(/^#![^\n]*\n/);
        if (shebang) {
          module.code =
            shebang[0] + banner + module.code.slice(shebang[0].length) + footer;
        } else {
          module.code = banner + module.code + footer;
        }
      }
    }
  },
};

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    build: {
      outDir: 'dist',
      emptyOutDir: false, // Don't empty on each build since we're doing multiple builds
      lib: {
        entry: resolve(
          import.meta.dirname,
          'src/js/L.Control.OpenCageGeocoding.js'
        ),
        name: 'leaflet-control-opencage-geocoding',
        formats: isProduction ? ['umd'] : ['umd', 'es'],
        fileName: (format) => {
          if (format === 'es') {
            return `js/L.Control.OpenCageGeocoding.esm.js`;
          }
          return `js/L.Control.OpenCageGeocoding.${isProduction ? 'min' : 'dev'}.js`;
        },
      },
      rollupOptions: {
        external: ['leaflet'],
        plugins: [RollupBannerPlugin],
        output: {
          globals: {
            leaflet: 'L',
          },
          exports: 'named',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.names?.[0] ?? assetInfo.name ?? '';
            if (name.endsWith('.css')) {
              return `css/L.Control.OpenCageGeocoding.${isProduction ? 'min' : 'dev'}.css`;
            }
            if (name.match(/\.(png|gif|jpg|jpeg|svg)$/)) {
              return 'images/[name][extname]';
            }
            return 'assets/[name][extname]';
          },
        },
      },
      minify: isProduction,
      sourcemap: !isProduction,
      copyPublicDir: false,
    },
    publicDir: false,
    assetsInclude: ['**/*.png', '**/*.gif'],
  };
});
