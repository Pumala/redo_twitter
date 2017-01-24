var app = angular.module('twitterApp', ['ui.router', 'ngCookies', 'angularFileUpload']);

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
  .state({
    name: 'editProfile',
    url: '/profile/edit/{username}',
    templateUrl: '/templates/editprofile.html',
    controller: 'EditProfileController'
  })

  $urlRouterProvider.otherwise('/');

});

app.run(function($rootScope, $cookies, $http, $state) {

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
      $state.go('home');
    })
    .catch(function(err) {
      console.log('err loggin out...', err.message);
    });
  };

});

app.factory('TwitterFactory', function($http, $rootScope) {
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

  service.getUserProfile = function(username) {
    var url = '/api/profile/' + username;
    return $http({
      method: 'GET',
      url: url
    });
  };

  service.addNewTweet = function(newTweet) {
    var url = '/api/profile/tweet/new';
    return $http({
      method: 'POST',
      url: url,
      data: newTweet
    });
  };

  service.removeTweet = function(tweetInfo) {
    var url = '/api/tweet/edit/delete';
    return $http({
      method: 'PUT',
      url: url,
      data: tweetInfo
    });
  };

  service.deleteRetweet = function(retweetInfo) {
    var url = '/api/retweet/edit/delete';
    return $http({
      method: 'PUT',
      url: url,
      data: retweetInfo
    });
  };

  service.getWorldTimeline = function() {
    console.log('hmm hmm');
    var url = '/api/worldtimeline';
    return $http({
      method: 'GET',
      url: url
    });
  };

  service.updateTweet = function(tweetInfo) {
    var url = '/api/tweet/edit/update';
    return $http({
      method: 'PUT',
      url: url,
      data: tweetInfo
    });
  };

  service.updateLikedTweetStatus = function(tweetInfo) {
    var url = '/api/tweet/status/update';
    return $http({
      method: 'PUT',
      url: url,
      data: tweetInfo
    });
  };

  service.checkIfUserExistsInArr = function(arr) {
    console.log('arr?', arr);
    if (arr.indexOf($rootScope.rootUsername) > -1) {
      return true;
    } else {
      return false;
    };
  };

  service.checkIfUserExistsInArrObj = function(arrObj) {
    var found = arrObj.filter(function(user) {
      return user._id === $rootScope.rootUsername;
    });
    console.log('what did i find?', found);
    if (found.length > 0) {
      return true;
    } else {
      return false;
    }
  };

  service.toggleLikedStatus = function(isLiked) {
    if (isLiked) {
      return false;
    } else {
      return true;
    };
  };

  service.retweetTweet = function(tweetInfo) {
    var url = '/api/retweet/new/add';
    return $http({
      method: 'PUT',
      url: url,
      data: tweetInfo
    });
  };

  service.getRetweetCount = function(arrObj) {
    var count = arrObj.reduce(function(total, retweet) {
      return total + retweet.count
    }, 0);

    return count;
  };

  service.updateFollowingStatus = function(followingObj) {
    var url = '/api/user/following/status/update';
    return $http({
      method: 'PUT',
      url: url,
      data: followingObj
    });
  };

  service.returnAllTweets = function(allRetweets, origTweets, tweets) {
    allRetweets.forEach(function(retweet, index) {
      origTweets.forEach(function(origTweet) {
        if (retweet.tweet.toString() === origTweet._id.toString()) {
          allRetweets[index].tweet = origTweet;
        }
      });
    });

    return allRetweets.concat(tweets);
  };

  service.getUserInfo = function() {
    var url = '/api/profile/edit/user/' + $rootScope.rootUsername;
    return $http({
      method: 'GET',
      url: url
    });
  };

  service.saveProfileEdits = function(editProfileObj) {
    var url = '/api/profile/edit/save';
    return $http({
      method: 'PUT',
      url: url,
      data: editProfileObj
    });
  };

  service.deleteTempFile = function(fileId) {
    var url = '/api/profile/edit/delete/file/' + fileId;
    return $http({
      method: 'DELETE',
      url: url
    });
  };

  return service;
});

app.controller('WorldTimelineController', function($rootScope, $state, $scope, TwitterFactory) {

  $scope.loadWorldTimlinePage = function() {
    TwitterFactory.getWorldTimeline()
      .then(function(returnedInfo) {

        $scope.origTweets = returnedInfo.data.origTweets;
        $scope.retweets = returnedInfo.data.retweets;
        $scope.tweets = returnedInfo.data.tweets;

        console.log('returning:', returnedInfo);
        $scope.allTweets = TwitterFactory.returnAllTweets($scope.retweets, $scope.origTweets, $scope.tweets);
        console.log('everything!!', $scope.allTweets);
      })
      .catch(function(err) {
        console.log('err loading world timeline page..', err.message);
      });
  };

  // load page once initially
  $scope.loadWorldTimlinePage();

  // delete Tweet (only tweet author has permission)
  $scope.deleteTweet = function(tweetId, author) {
    var tweetInfo = {
      tweetId: tweetId,
      author: author
    };
    TwitterFactory.removeTweet(tweetInfo)
      .then(function() {
        $scope.loadWorldTimlinePage();
      })
      .catch(function(err) {
        console.log('err removing tweet in world timeline...', err.message);
      });
  };

  $scope.saveTweet = function(tweetId, content) {
    var tweetInfo = {
      tweetId: tweetId,
      content: content
    };
    TwitterFactory.updateTweet(tweetInfo)
      .then(function() {
        $scope.loadWorldTimlinePage();
      })
      .catch(function(err) {
        console.log('err saving tweet in world timeline....', err.message);
      });
  };

  $scope.checkIfUserExists = function(arr) {
    console.log('sent in array', arr);
    return TwitterFactory.checkIfUserExistsInArr(arr);
  };

  $scope.likeTweet = function(tweetId, arr, author) {

    // check if user is logged in
    // for now it's set up where users can like their own tweets
    if ($rootScope.rootUsername) {
      var isLiked = $scope.checkIfUserExists(arr);

      isLiked = TwitterFactory.toggleLikedStatus(isLiked);

      var tweetInfo = {
        tweetId: tweetId,
        likedStatus: isLiked,
        username: $rootScope.rootUsername
      };
    } else {
      var message = 'Sorry, you need to be signed in to like tweets!'
      $state.go('login', message);
    }
    TwitterFactory.updateLikedTweetStatus(tweetInfo)
      .then(function() {
        $scope.loadWorldTimlinePage();
      })
      .catch(function(err) {
        console.log('err updating liked status of tweet in timeline controller...', err.message);
      });
  };

  $scope.retweetTweet = function(tweetId, arrObj) {
    if ($rootScope.rootUsername) {
      var alreadyRetweeted = TwitterFactory.checkIfUserExistsInArrObj(arrObj);
      var tweetInfo = {
        tweetId: tweetId,
        username: $rootScope.rootUsername,
        alreadyRetweeted: alreadyRetweeted
      };
      TwitterFactory.retweetTweet(tweetInfo)
        .then(function() {
          $scope.loadWorldTimlinePage();
        })
        .catch(function(err) {
          console.log('err retweeting tweet in world timeline...', err.message);
        });
    } else {
      $state.go("login");
    }
  };

  $scope.getRetweetCount = function(arrObj) {
    return TwitterFactory.getRetweetCount(arrObj);
  };

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


app.controller('FileController', function($timeout, $scope, TwitterFactory, $rootScope, $state, FileUploader) {

  var uploader = $scope.uploader = new FileUploader({
    url: '/api/profile/files/upload/user/' + $rootScope.rootUsername
  });

  uploader.onCompleteAll = function(file) {
    // console.log('is this it?', file);
    // $scope.$emit('newEditMode', false);
  };

  uploader.onSuccessItem = function(fileItem, response, status, headers) {
    // so far, do nothing
    console.log('hahaha2', response);
    $scope.$emit('profileEditMode', response);

  };
});

app.controller('EditProfileController', function($cookies, $state, $stateParams, $rootScope, $scope, TwitterFactory) {

  $scope.$on('profileEditMode', function(event, file) {
    // save the original file in case user chooses to cancel changes
    $scope.origFile = $scope.userInfo.avatar;
    $scope.tempFileInfo = file;
    $scope.userInfo.avatar = file.filename;
    console.log($scope.userInfo.avatar);
  });

  $scope.deleteTempFile = function() {
    if ($scope.tempFileInfo) {
      TwitterFactory.deleteTempFile($scope.tempFileInfo.fileId)
      .then(function() {
        // $state.go('profile', { username: $rootScope.rootUsername });
      })
      .catch(function(err) {
        console.log('err deleting temp file...', err.message);
      });
    }
    $state.go('profile', { username: $rootScope.rootUsername });

  };

  $scope.saveProfileEdits = function() {
    var editProfileObj = {
      username: $rootScope.rootUsername,
      filename: $scope.tempFileInfo.filename,
      origFilename: $scope.origFile
    };
    TwitterFactory.saveProfileEdits(editProfileObj)
      .then(function() {
        $state.go('profile', { username: $rootScope.rootUsername });
      })
      .catch(function(err) {
        console.log('err saving profile edits...', err.message);
      });
  };

  $scope.loadEditProfilePage = function() {
    TwitterFactory.getUserInfo()
      .then(function(results) {
        console.log('1, 2, 3, 4', results.data.userInfo);
        $scope.userInfo = results.data.userInfo;
      })
      .catch(function(err) {
        console.log('err retrieving user info in edit profile controller...', err.message);
      });
  };

  $scope.loadEditProfilePage();


});

app.controller('ProfileController', function($cookies, $state, $stateParams, $rootScope, $scope, TwitterFactory) {
  $scope.username = $stateParams.username;

  $scope.loadProfilePage = function() {
    TwitterFactory.getUserProfile($scope.username)
      .then(function(returnedInfo) {
        $scope.userInfo = returnedInfo.data.userInfo;
        $scope.tweets = returnedInfo.data.tweets;
        $scope.allRetweets = returnedInfo.data.allRetweets;
        $scope.origTweets = returnedInfo.data.origTweets;

        $scope.allTweets = TwitterFactory.returnAllTweets($scope.allRetweets, $scope.origTweets, $scope.tweets);
      })
      .catch(function(err) {
        console.log('err retrieving user profile info...', err.message);
      });
  };

  // load profile once user enters controller
  $scope.loadProfilePage();

  $scope.postTweet = function() {
    var newTweet = {
      username: $scope.username,
      content: $scope.content
    };
    TwitterFactory.addNewTweet(newTweet)
      .then(function(message) {
        console.log('i returned');
        console.log(message.data.message);
        $scope.loadProfilePage();
        $scope.content = "";
      })
      .catch(function(err) {
        console.log('err posting new tweet...', err.message);
      });
  };

  $scope.deleteTweet = function(tweetId) {
    var tweetInfo = {
      tweetId: tweetId,
      username: $scope.username
    };
    TwitterFactory.removeTweet(tweetInfo)
      .then(function(message) {
        console.log(message.data.message);
        $scope.loadProfilePage();
      })
      .catch(function(err) {
        console.log('err deleting tweet...', err.message);
      });
  };

  $scope.deleteRetweet = function(retweetId) {
    var retweetInfo = {
      retweetId: retweetId,
      username: $rootScope.rootUsername
    };
    TwitterFactory.deleteRetweet(retweetInfo)
      .then(function() {
        $scope.loadProfilePage();
      })
      .catch(function(err) {
        console.log('err deleting retweet id in profile controller...', err.message);
      });
  };

  $scope.saveTweet = function(tweetId, content) {
    var tweetInfo = {
      tweetId: tweetId,
      content: content
    };
    console.log('tweet info:', tweetInfo);
    TwitterFactory.updateTweet(tweetInfo)
      .then(function() {
        $scope.loadProfilePage();
      })
      .catch(function(err) {
        console.log('err updating tweeter in profile controller...', err.message);
      });
  };

  $scope.checkIfUserExists = function(arr) {
    return TwitterFactory.checkIfUserExistsInArr(arr);
  };

  $scope.updateTweetLikedStatus = function(tweetId, author, arr) {
    if ($rootScope.rootUsername) {
      console.log('arr?', arr);
      var isLiked = TwitterFactory.checkIfUserExistsInArr(arr);
      console.log('likes 1?', isLiked);

      isLiked = TwitterFactory.toggleLikedStatus(isLiked);
      console.log('likes?', isLiked);
      var tweetInfo = {
        tweetId: tweetId,
        username: author,
        likedStatus: isLiked
      };
    } else {
      $state.go("login");
    }
    TwitterFactory.updateLikedTweetStatus(tweetInfo)
      .then(function() {
        $scope.loadProfilePage();
      })
      .catch(function(err) {
        console.log('err updating tweet liked status in profile controller...', err.message);
      });
  };

  $scope.followUser = function(user, currFollowing) {
    // check if user is logged in
    if ($rootScope.rootUsername) {
      var followObj = {
        currUser: $rootScope.rootUsername,
        following: user,
        status: !currFollowing
      };
      TwitterFactory.updateFollowingStatus(followObj)
        .then(function() {
          $scope.loadProfilePage();
        })
        .catch(function(err) {
          console.log('err updating following user status in profile...', err.message);
        });
    } else {
      $state.go("login");
    }

  };

  $scope.retweetTweet = function(tweetId, arrObj) {
    if ($rootScope.rootUsername) {
      // var alreadyRetweeted = TwitterFactory.checkIfUserExistsInArrObj(arrObj);
      var tweetInfo = {
        tweetId: tweetId,
        username: $rootScope.rootUsername
        // alreadyRetweeted: alreadyRetweeted
      };
      TwitterFactory.retweetTweet(tweetInfo)
        .then(function() {
          $scope.loadProfilePage();
        })
        .catch(function(err) {
          console.log('err adding new retweet from profile controller...', err.message );
        });
    } else {
      $state.go("login");
    };

  };

  $scope.getRetweetCount = function(arrObj) {
    return TwitterFactory.getRetweetCount(arrObj);
  };

});
