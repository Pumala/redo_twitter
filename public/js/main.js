var app = angular.module('twitterApp', ['ui.router']);

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state({
    name: 'home',
    url: '/',
    templateUrl: '/templates/world_timeline.html',
    controller: 'WorldTimelineController'
  })

  $urlRouterProvider.otherwise('/');

});

app.factory('TwitterFactory', function($http) {
  var service = {};
  return service;
});

app.controller('WorldTimelineController', function($state, $scope, TwitterFactory) {

});
