'use strict';

// Setting up route
angular.module('postmessage').config(function ($stateProvider) {
  $stateProvider

    .state('post', {
      url: '/events/:channel/post',
      templateUrl: 'modules/postmessage/views/postmessage.view.html',
      controller: 'PostController',
      data: { title: 'New Message - LitePost.io' }
    })

    .state('editPost', {
      url: '/events/:channel/post/:messageId',
      templateUrl: 'modules/postmessage/views/postmessage.view.html',
      controller: 'PostController',
      data: { title: 'Edit Message - LitePost.io' }
    });
});