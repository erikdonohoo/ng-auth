'use strict';

module.exports = function (grunt) {

	// Load grunt tasks automatically
	require('load-grunt-tasks')(grunt);

	// Define the configuration for all the tasks
	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		// Concat files
		concat: {
			dist: {
				src: [
				'module.prefix',
				'.tmp/main.js',
				'.tmp/*.js',
				'module.suffix'],
				dest: 'dist/<%= pkg.name %>.js'
			}
		},

		// Clean
		clean: ['.tmp/', 'dist/'],

		// Remove 'use strict' repetition
		replace: {
			strict: {
				src: ['src/js/**/*.js'],
				dest: '.tmp/',
				replacements: [{
					from: '\'use strict\';\n\n',
					to: ''
				}]
			}
		},

		// Minify
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> v<%= pkg.version %> */\n'
			},
			dist: {
				files: {
					'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
				}
			}
		},

		// JShint
		jshint: {
			options: {
				jshintrc: '.jshintrc',
				reporter: require('jshint-stylish')
			},
			all: ['src/**/*.js'],
			test: {
				options: {
					jshintrc: 'test/.jshintrc'
				},
				src: ['test/spec/**/*.js']
			}
		},

		// copy
		copy: {
			css: {
				files: [{
					expand: true,
					flatten: true,
					src: ['src/css/oauth2.css'],
					dest: 'dist/'
				}]
			},
			mock: {
				files: [{
					flatten: true,
					expand: true,
					src: ['src/mock/ng-auth.mock.js'],
					dest: 'dist/'
				}]
			}
		},

		// JSCS
		jscs: {
			main: {
				files: {
					src: ['src/**/*.js', 'test/spec/**/*.js']
				},
				options: {
					config: '.jscsrc'
				}
			}
		},

		// Test Server
		connect: {
			options: {
				hostname: 'localhost'
			},
			test: {
				options: {
					port: 9001,
					base: [
					'test',
					'src'
					]
				}
			},
			coverage: {
				options: {
					port: 9090,
					base: ['coverage/html'],
					open: 'http://<%= connect.options.hostname %>:9090',
					keepalive: true
				}
			}
		},

		// Test settings
		karma: {
			options: {
				configFile: 'karma.conf.js'
			},
			test: {},
			debug: {
				singleRun: false
			},
			coverage: {
				preprocessors: {
					'src/js/**/*.js': 'coverage'
				},
				reporters: ['coverage'],
				coverageReporter: {
					reporters: [{
						type: 'html',
						subdir: 'html'
					}]
				}
			}
		},

		bumpup: {
			files: ['package.json', 'bower.json']
		}

	});

	// Register tasks
	grunt.registerTask('build', ['clean', 'jshint:all', 'jscs', 'replace:strict', 'concat', 'uglify', 'copy:css', 'copy:mock']);
	grunt.registerTask('test', ['jshint:all', 'jscs', 'jshint:test', 'connect:test', 'karma:test']);
	grunt.registerTask('test-ci', ['jshint:all', 'jscs', 'jshint:test', 'connect:test', 'karma:test']);
	grunt.registerTask('coverage', ['connect:test', 'karma:coverage', 'connect:coverage']);
	grunt.registerTask('default', ['test', 'build']);
	grunt.registerTask('debug', ['connect:test', 'karma:debug']);
};
