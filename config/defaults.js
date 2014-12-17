'use strict';

module.exports = {
	app: {
		title: 'LitePost.io',
		description: 'Publish instantly to a live audience',
		keywords: 'live blog microblog socket.io mongodb express angularjs node mean'
	},
	port: 3000,
	db: 'mongodb://localhost',
	sessionSecret: 'litepost.io',
  assets: {
    lib: {
      js: [
        'public/components/jquery/dist/jquery.js',
        'public/components/socket.io-client/socket.io.js',
        'public/components/FlipClock/compiled/flipclock.min.js',
        'public/components/moment/moment.js',
        'public/components/marked/lib/marked.js',
        'public/components/bootstrap-markdown/js/bootstrap-markdown.js',
        '//cdnjs.cloudflare.com/ajax/libs/highlight.js/8.4/highlight.min.js',
        'public/components/angular/angular.js',
        'public/components/angular-resource/angular-resource.js', 
        'public/components/angular-socket-io/socket.js', 
        'public/components/angular-cookies/angular-cookies.js', 
        'public/components/angular-animate/angular-animate.js', 
        'public/components/angular-touch/angular-touch.js', 
        'public/components/angular-sanitize/angular-sanitize.js', 
        'public/components/angular-ui-router/release/angular-ui-router.js',
        'public/components/angular-moment/angular-moment.js',
        'public/components/angular-scroll/angular-scroll.js',
        'public/components/ng-parallax/angular-parallax.js',
        'public/components/angular-strap/dist/angular-strap.js',
        'public/components/angular-strap/dist/angular-strap.tpl.js',
        'public/components/angular-waypoints/dist/angular-waypoints.all.js'
      ],
      css: [

      ],
    },
    css: [    
      'public/dist/application.min.css'
    ],
    js: [
      'public/js/marked-setup.js',
      'public/config.js',
      'public/application.js',
      'public/modules/*/*.js',
      'public/modules/*/*[!tests]*/*.js'
    ],
    tests: [
      'public/components/angular-mocks/angular-mocks.js',
      'public/components/angular-socket-io/mock/socket-io.js',
      'public/modules/*/tests/*.js'
    ]
  }
};
