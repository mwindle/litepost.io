

# LitePost.io
Publish instantly to a live audience. 

## Description
[LitePost.io](https://litepost.io) is a blogging web app that lets people post messages to a live audience about something in real-time, be it a product announcement, tech conference, or whatever. I've created it as a fun project to show a bit of what I can do. 

## Technology
The app uses the [MEAN](http://en.wikipedia.org/wiki/MEAN) tech stack. The Express.js server is almost entirely there to serve MongoDB data via a REST API. The majority of the app is implemented on the client side in Angular.js. Grunt is used as the building tool, tests are implemented with the help of Karma and Jasmine. 

## Running
Clone this repo, then run `npm install` to download the client and server dependencies. You can run the app with `nodemon server`. The default configuration requires a MongoDB connection to localhost. If you want to use a different location or tweak other configuration settings, create a folder called `env` in `./app/config` and add a file called `development.js`. In that file, override any settings you want from `defaults.js`. 

## Building
Grunt is used to build the client-side into single, uglified JS and CSS files. Just run `grunt build`. 

## Testing
Run all client and server tests with `grunt test`. Tests can be run against the built files with `grunt test:build`. 

## Developing
Since this project is at an early stage, if you'd like to help out with new features then please contact me directly to discuss. 
If you find an issue, please log it or send me a pull request. 