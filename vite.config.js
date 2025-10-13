import { defineConfig } from 'vite';
import fs from 'node:fs';

// Read package.json for banner information
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const banner = `/**
 * OpenCage Data Geocoding Control v${pkg.version} - ${new Date().toISOString().split('T')[0]}
 * Copyright (c) ${new Date().getFullYear()}, ${pkg.author.name} 
 * ${pkg.author.email} 
 * ${pkg.author.url} 
 * 
 * Licensed under the ${pkg.license} license. 
 * Demo: https://opencagedata.com/tutorials/geocode-in-leaflet
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

export default defineConfig(({ mode, command }) => {
  const isProduction = mode === 'production';
  const isDev = command === 'serve';

  // Development server configuration with library build
  if (isDev) {
    return {
      root: '.',
      publicDir: false,
      build: {
        outDir: 'dist',
        emptyOutDir: false,
        watch: {},
        lib: {
          entry: 'src/js/index.js',
          name: 'leaflet-control-opencage-geocoding',
          formats: ['umd', 'es'],
          fileName: (format) => {
            if (format === 'es') {
              return `js/OpenCageGeocoding.esm.js`;
            }
            return `js/OpenCageGeocoding.dev.js`;
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
              if (assetInfo.name.endsWith('.css')) {
                return `css/OpenCageGeocoding.dev.css`;
              }
              if (assetInfo.name.match(/\.(png|gif|jpg|jpeg|svg)$/)) {
                return 'images/[name][extname]';
              }
              return 'assets/[name][extname]';
            },
          },
        },
        minify: false,
        sourcemap: true,
        copyPublicDir: false,
      },
    };
  }

  // Production build configuration
  return {
    build: {
      outDir: 'dist',
      emptyOutDir: false, // Don't empty on each build since we're doing multiple builds
      lib: {
        entry: 'src/js/index.js',
        name: 'leaflet-control-opencage-geocoding',
        formats: isProduction ? ['umd'] : ['umd', 'es'],
        fileName: (format) => {
          if (format === 'es') {
            return `js/OpenCageGeocoding.esm.js`;
          }
          return `js/OpenCageGeocoding.${isProduction ? 'min' : 'dev'}.js`;
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
            if (assetInfo.name.endsWith('.css')) {
              return `css/OpenCageGeocoding.${isProduction ? 'min' : 'dev'}.css`;
            }
            if (assetInfo.name.match(/\.(png|gif|jpg|jpeg|svg)$/)) {
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
  };
});
