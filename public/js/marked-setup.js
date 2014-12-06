/*
Setup marked for both the client and the server to keep the options and overrides in one place
*/
(function (marked) {
	'use strict';

	if(!marked) return;

	var r = new marked.Renderer();

	// Add support for parallax image scrolling through an Angular directive. Author must opt-in by
	//	setting a title on the image that starts with parallax (case-insensitive, stripped from output)
	var enableParallaxMatch = /^parallax\s*/i;
  r.image = function (href, title, text) {
    var out = '<img src="' + href + '" alt="' + text + '"';
    var enableParallax = false;
   	if(title) {
   		enableParallax = !!title.match(enableParallaxMatch);
   		if(enableParallax) { title = title.replace(enableParallaxMatch); }
   		out += ' title="' + title + '"';
   	}
   	if(enableParallax) {
   		out = '<div class="parallax-image-wrapper">' + out + ' y="background" du-parallax="" /></div>';
   	} else {
   		out += ' />';
   	}
    return out;
  }

  marked.setOptions({
    renderer: r,
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false
  });

})((typeof module !== 'undefined' && module.exports)?require('marked'):(typeof window !== 'undefined' && window.marked)?window.marked:null);