var app = angular.module('twitterApp', ['ui.router', 'ngCookies']);

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state({
    name: 'home',
    url: '/',
    templateUrl: '/templates/world_timeline.html',
    controller: 'WorldTimelineController'
  })
  .state({
    name: 'signup',
    url: '/signup',
    templateUrl: '/templates/signup.html',
    controller: 'SignUpController'
  })
  .state({
    name: 'login',
    url: '/login',
    templateUrl: '/templates/login.html',
    controller: 'LoginController'
  })
  .state({
    name: 'profile',
    url: '/profile/{username}',
    templateUrl: '/templates/profile.html',
    controller: 'ProfileController'
  })

  $urlRouterProvider.otherwise('/');

});

app.run(function($rootScope, $cookies, $http) {

  // when page reloads, check if cookies exists
  // if so, that means a user is currently logged in
  // because when the page refreshes, we then need to reassign data from
  // the cookies back to rootScope variables

  var cookieData = $cookies.getObject('cookieData');

  if (cookieData) {
    // reassign all the rootScope variables
    $rootScope.rootUsername = cookieData._id;
  }

  $rootScope.rootLogout = function() {
    console.log('logging out');
    var url = '/api/logout';
    return $http({
      method: 'PUT',
      url: url,
      data: {
        username: $rootScope.rootUsername
      }
    })
    .then(function() {
      // reassign rootScope variables to null
      $rootScope.rootUsername = null;
      // clear cookies
      $cookies.remove('cookieData');
    })
    .catch(function(err) {
      console.log('err loggin out...', err.message);
    });
  };

});

app.factory('TwitterFactory', function($http) {
  var service = {};

  service.login = function(loginInfo) {
    console.log('huh?', loginInfo);
    var url = '/api/login';

    return $http({
      method: 'POST',
      url: url,
      data: loginInfo
    });
  };

  service.signUp = function(signUpInfo) {
    var url = '/api/signup';

    return $http({
      method: 'PUT',
      url: url,
      data: signUpInfo
    });
  };

  return service;
});

app.controller('WorldTimelineController', function($rootScope, $state, $scope, TwitterFactory) {

});

app.controller('LoginController', function($rootScope, $state, $scope, $cookies, TwitterFactory) {

  $scope.login = function() {
    var loginInfo = {
      username: $scope.username,
      password: $scope.password
    };
    TwitterFactory.login(loginInfo)
      .then(function(returnedInfo) {
        console.log('returned:', returnedInfo);
        if (returnedInfo.data.message) {
          $cookies.putObject('cookieData', returnedInfo.data.userInfo);
          $rootScope.rootUsername = returnedInfo.data.userInfo._id;
          $state.go('profile', { username: $rootScope.rootUsername });
        } else {
          //
        };
      })
      .catch(function(err) {
        console.log('err logging in...', err.message);
      });
  };

});

app.controller('SignUpController', function($cookies, $rootScope, $state, $scope, TwitterFactory) {

  $scope.signUp = function() {
    var signUpInfo = {
      username: $scope.username,
      password: $scope.password
    };
    TwitterFactory.signUp(signUpInfo)
      .then(function(returnedInfo) {
        $cookies.putObject('cookieData', returnedInfo.data.userInfo);
        $rootScope.rootUsername = returnedInfo.data.userInfo._id;
        $state.go('profile', { username: $rootScope.rootUsername });
      })
      .catch(function(err) {
        console.log('err signing up...', err.message);
      });
  };

});

app.controller('ProfileController', function($cookies, $state, $rootScope, $scope, TwitterFactory) {

});
