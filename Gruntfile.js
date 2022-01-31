module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		meta: {
			banner: '/* \n' +
				' * OpenCage Data Geocoding Control v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
				' * Copyright (c) <%= grunt.template.today("yyyy") %>, <%= pkg.author.name %> \n' +
				' * <%= pkg.author.email %> \n' +
				' * <%= pkg.author.url %> \n' +
				' * \n' +
				' * Licensed under the <%= pkg.license %> license. \n' +
				' * Demo: <%= pkg.homepage %> \n' +
				' * Source: <%= pkg.repository.url %> \n' +
				' */\n'
		},
		clean: {
			dist: {
				src: ['dist/*']
			}
		},
		jshint: {
			options: {
				globals: {
					console: true,
					module: true
				},
				'-W069': false,
	            'reporterOutput': "",
	            'esnext': true
			},
			files: ['src/**/*.js']
		},
		concat: {
			options: {
				banner: '<%= meta.banner %>'
			},
			dist: {
				files: {
					'dist/js/L.Control.OpenCageGeocoding.dev.js': ['src/js/L.Control.OpenCageGeocoding.js'],
					'dist/css/L.Control.OpenCageGeocoding.dev.css': ['src/css/L.Control.OpenCageGeocoding.css']
				}
			}
		},
		uglify: {
			options: {
				banner: '<%= meta.banner %>'
			},
			dist: {
				files: {
					'dist/js/L.Control.OpenCageGeocoding.min.js': ['dist/js/L.Control.OpenCageGeocoding.dev.js']
				}

			}
		},
		cssmin: {
			options: {
				banner: '<%= meta.banner %>'
			},
			minify: {
				expand: true,
				cwd: 'dist/css',
				files: {
					'dist/css/L.Control.OpenCageGeocoding.min.css': ['dist/css/L.Control.OpenCageGeocoding.dev.css']
				}
			}
		},
		copy: {
			images: {
				files: [
					{
						expand: true,
						cwd: 'src/images/',
						src: ['**/*.{gif,png}'],
						dest: 'dist/images'
					}
				]
			}
		},
		watch: {
			dist: {
				options: {
					livereload: true
				},
				files: ['src/**/*'],
				tasks: ['clean', 'jshint', 'concat', 'uglify', 'cssmin', 'copy']
			}
		}
	});

	grunt.registerTask('default', [
		'clean',
		'jshint',
		'concat',
		'uglify',
		'cssmin',
		'copy'
	]);
};
