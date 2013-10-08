var glob = require('glob');
var _ = require('underscore')
var fs = require('fs')

// Create the goo.js dummy module that depends on all other js files.
function createMainFile() {
	var sourceFiles = glob.sync('**/*.js', {cwd: 'src/goo/'})
	var allModules = _.map(sourceFiles, function(f) {
		return 'goo/' + f.replace(/\.js/, '');
	});

	fs.writeFileSync('src/goo.js', 'define([\n' +
		_.map(allModules, function(m) { return "\t'" + m + "'"; }).join(',\n') +
	'\n], function() {});\n')
}

// This should not be done every time grunt runs; only when we're minifying.
// I wonder how to make this a dependency on the requirejs task.
createMainFile();

module.exports = function(grunt) {
	var engineVersion = grunt.option('goo-version') || 'UNOFFICIAL';
	var bundleRequire = grunt.option('bundle-require');

	var gooModule = {
		name: 'goo'
	};
	var engineFilename = './out/goo.js'
	if(bundleRequire) {
		console.log('Bundling require');
		gooModule.include = ['requireLib'];
		engineFilename = './out/goo-require.js'
	}

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		requirejs: {
			build: {
				// Options: https://github.com/jrburke/r.js/blob/master/build/example.build.js
				options: {
					baseUrl: 'src/',
					optimize: 'uglify2',  // uglify, uglify2, closure, closure.keepLines
					preserveLicenseComments: false,
					useStrict: true,
					wrap: false,
					keepBuildDir: true,
					//generateSourceMaps: true,
					dir: 'out/minified/',
					modules: [gooModule],
					paths: {
						'requireLib': '../lib/require'
					},
					wrap: true,

					// I tried using a wrap block like this, but it has no effect
					// wrap: { ... }
					/*
					uglify2: {
						output: {
							beautify: true
						},
						compress: {
							sequences: false,
							global_defs: {
								DEBUG: false
							}
						},
						warnings: true,
						mangle: false
					}*/
				}
			}
		},
		wrap: {
			build: {
				src: ['out/minified/goo.js'],
				dest: engineFilename,
				options: {
					wrapper: [
						'/* Goo Engine ' + engineVersion + '\n' +
						' * Copyright 2013 Goo Technologies AB\n' +
						' */\n',
						''
					]
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-wrap');

	grunt.registerTask('default', ['minify']);
	grunt.registerTask('minify', ['requirejs:build', 'wrap']);

};
