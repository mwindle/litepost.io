/* 
* Routes for postmessage module
*/
(function () {
  'use strict';

  // Setting up route
  angular.module('postmessage').config(function ($stateProvider) {
    $stateProvider

      .state('app.event.post', {
        url: '/post',
        templateUrl: 'modules/postmessage/views/postmessage.view.html',
        controller: 'PostController',
        data: { title: 'New Message - LitePost.io' }
      })

      .state('app.event.editPost', {
        url: '/post/:messageId',
        templateUrl: 'modules/postmessage/views/postmessage.view.html',
        controller: 'PostController',
        data: { title: 'Edit Message - LitePost.io' }
      });
  });
})();