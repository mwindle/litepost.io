'use strict';

module.exports = function(grunt) {
	// Unified Watch Object
	var watchFiles = {
		serverViews: ['app/views/**/*.*'],
		serverJS: ['Gruntfile.js', 'server.js', 'config/**/*.js', 'app/**/*.js'],
		clientViews: ['public/modules/**/views/**/*.html'],
		clientJS: ['public/js/*.js', 'public/modules/**/*.js'],
		clientCSS: ['public/dist/application.min.css'],
		clientLESS: ['public/less/**/*.less', 'public/modules/**/*.less']
	};

	// Project Configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		watch: {
			serverViews: {
				files: watchFiles.serverViews,
				options: {
					livereload: true
				}
			},
			serverJS: {
				files: watchFiles.serverJS,
				tasks: ['jshint:server', 'jasmine_node'],
				options: {
					livereload: true
				}
			},
			clientViews: {
				files: watchFiles.clientViews,
				options: {
					livereload: true
				}
			},
			clientJS: {
				files: watchFiles.clientJS,
				tasks: ['jshint:client', 'karma:unit'],
				options: {
					livereload: true
				}
			},
			clientLESS: {
				files: watchFiles.clientLESS,
				tasks: ['build:less'],
				options: {
					livereload: true
				}
			}
		},
		jshint: {
			client: {
				src: watchFiles.clientJS,
				options: {
					jshintrc: '.jshintrc.client'
				}
			},
			server: {
				src: watchFiles.serverJS,
				options: {
					jshintrc: '.jshintrc.server'
				}
			}
		},
		lesslint: {
			src: watchFiles.clientLESS,
			options: {
				csslint: {
					csslintrc: '.csslintrc'
				}
			}
		},
		uglify: {
			production: {
				options: {
					mangle: false
				},
				files: {
					'public/dist/application.min.js': 'public/dist/application.js'
				}
			}
		},
		clean: {
			less: ['public/dist/**/*.less']
		},
		wget: {
			'public/dist/fonts/Oxygen.less': 'https://fonts.googleapis.com/css?family=Oxygen:300,400,700',
			'public/dist/fonts/Oswald.less': 'https://fonts.googleapis.com/css?family=Oswald:300,400,700',
			'public/dist/lib/highlight.github.min.less': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/8.4/styles/github.min.css'
		},
		less: {
	    production: {
        options: {
          paths: ['public/less'],
          cleancss: true,
          strictMath: true
        },
        files: {
	        'public/dist/application.min.css': 'public/less/application.less'
        }
	    }
		},
		autoprefixer: {
			single_file: {
				src: 'public/dist/application.min.css',
				dest: 'public/dist/application.min.css'
			}
		},
		cssUrlEmbed: {
			encodeWithBaseDir: {
				options: {
					baseDir: './public'
				},
				files: {
					'public/dist/application.min.css': 'public/dist/application.min.css'
				}
			}
		},
		nodemon: {
			dev: {
				script: 'server.js',
				options: {
					nodeArgs: ['--debug'],
					ext: 'js,html',
					watch: watchFiles.serverViews.concat(watchFiles.serverJS)
				}
			}
		},
		'node-inspector': {
			custom: {
				options: {
					'web-port': 1337,
					'web-host': 'localhost',
					'debug-port': 5858,
					'save-live-edit': true,
					'no-preload': true,
					'stack-trace-limit': 50,
					'hidden': []
				}
			}
		},
		ngAnnotate: {
			production: {
				files: {
					'public/dist/application.js': '<%= applicationJavaScriptFiles %>'
				}
			}
		},
		concurrent: {
			default: ['nodemon', 'watch'],
			debug: ['nodemon', 'watch', 'node-inspector'],
			options: {
				logConcurrentOutput: true,
				limit: 10
			}
		},
		env: {
			test: {
				NODE_ENV: 'test'
			},
			production: {
				NODE_ENV: 'production'
			},
			secure: {
				NODE_ENV: 'secure'
			}
		},
		karma: {
			unit: {
				configFile: 'karma.conf.js'
			},
			production: {
				configFile: 'karma.conf.js',
				browsers: ['PhantomJS', 'Chrome', 'Firefox', 'Safari', 'Opera'],
				autoWatch: false,
				singleRun: true
			}
		},
	  jasmine_node: {
	    options: {
	      forceExit: true,
	      match: '.',
	      matchall: true,
	      extensions: 'js',
	      specNameMatcher: 'spec'
	    },
	    all: ['app/tests/']
	  }
	});

	// Load NPM tasks
	require('load-grunt-tasks')(grunt);

	// Making grunt default to force in order not to break the project.
	grunt.option('force', true);

	// A Task for loading the configuration object
	grunt.task.registerTask('loadConfig', 'Task that loads the config into a grunt option.', function() {
		var config = require('./config/config');
		
		grunt.config.set('applicationJavaScriptFiles', config.assets.lib.js.concat(config.assets.js));
		grunt.config.set('applicationCSSFiles', config.assets.lib.css.concat(config.assets.css));
	});

	// Default task(s).
	grunt.registerTask('default', ['lint', 'concurrent:default']);

	// Debug task.
	grunt.registerTask('debug', ['lint', 'concurrent:debug']);

	// Secure task(s).
	grunt.registerTask('secure', ['env:secure', 'lint', 'concurrent:default']);

	// Lint task(s).
	grunt.registerTask('lint', ['jshint:client', 'jshint:server', 'lesslint']);

	// Build LESS
	grunt.registerTask('build:less', ['lesslint', 'loadConfig', 'less', 'autoprefixer']);

	// Build Js
	grunt.registerTask('build:js', ['jshint:client', 'jshint:server', 'loadConfig', 'ngAnnotate', 'uglify']);

	// Build task(s).
	grunt.registerTask('build', ['build:js', 'build:less']);

	// Test task.
	grunt.registerTask('test', ['env:test', 'jasmine_node', 'karma:unit']);

	// Test build
	grunt.registerTask('test:build', ['env:production', 'jasmine_node', 'karma:production']);

	// Run in production
	grunt.registerTask('heroku:production', ['build']);
};
