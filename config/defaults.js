'use strict';

module.exports = {
	app: {
		title: 'LitePost.io',
		description: 'Publish instantly to a live audience',
		keywords: 'live blog microblog socket.io mongodb express angularjs node mean'
	},
	PORT: 3000,
	db: 'mongodb://localhost',
	sessionSecret: 'litepost.io',
  jwtSecret: 'litepost.io',
  jwtLifetimeInMin: 60 * 24 * 7, // Tokens last for a week
  assets: {
    lib: {
      js: [
        'public/components/jquery/dist/jquery.js',
        'public/components/socket.io-client/socket.io.js',
        'public/components/moment/moment.js',
        'public/components/marked/lib/marked.js',
        '//cdnjs.cloudflare.com/ajax/libs/highlight.js/8.4/highlight.min.js',
        'public/components/angular/angular.js',
        'public/components/angular-resource/angular-resource.js', 
        'public/components/angular-socket-io/socket.js', 
        'public/components/angular-local-storage/dist/angular-local-storage.js', 
        'public/components/angular-animate/angular-animate.js', 
        'public/components/angular-touch/angular-touch.js', 
        'public/components/angular-sanitize/angular-sanitize.js', 
        'public/components/angular-ui-router/release/angular-ui-router.js',
        'public/components/angular-moment/angular-moment.js',
        'public/components/angular-scroll/angular-scroll.js',
        'public/components/ng-parallax/angular-parallax.js',
        'public/components/angular-strap/dist/angular-strap.js',
        'public/components/angular-strap/dist/angular-strap.tpl.js',
        'public/components/angular-inview/angular-inview.js',
        'public/components/angular-scroll/angular-scroll.js'
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
      'public/js/test/ui-router.stateMock.js',
      'public/js/test/matchers.js',
      'public/modules/*/tests/*.js'
    ]
  }
};
