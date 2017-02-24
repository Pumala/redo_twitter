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
    name: 'following',
    url: '/profile/{username}/following',
    templateUrl: '/templates/following.html',
    controller: 'FollowingController'
  })
  .state({
    name: 'followers',
    url: '/profile/{username}/followers',
    templateUrl: '/templates/followers.html',
    controller: 'FollowersController'
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
    var url = '/api/worldtimeline';
    return $http({
      method: 'GET',
      url: url
    });
  };

  service.getFollowingUsers = function(user) {
    var rootUsername = null;
    if ($rootScope.rootUsername) {
      rootUsername = $rootScope.rootUsername;
    }
    var url = '/api/profile/following/' + user + '/' + rootUsername;
    return $http({
      method: 'GET',
      url: url
    });
  };

  service.getFollowersUsers = function(user) {
    var rootUsername = null;
    if ($rootScope.rootUsername) {
      rootUsername = $rootScope.rootUsername;
    }
    var url = '/api/profile/followers/' + user + '/' + rootUsername;
    return $http({
      method: 'GET',
      url: url
    });
  };

  service.showUserLikes = function(currUser) {
    var rootUsername = null;
    if ($rootScope.rootUsername) {
      rootUsername = $rootScope.rootUsername;
    }
    var url = '/api/profile/likes/' + currUser + '/' + rootUsername;
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
    console.log('retweets:', allRetweets);
    console.log('originals:', origTweets);
    console.log('just tweets', tweets);
    allRetweets.forEach(function(retweet, index) {
      origTweets.forEach(function(origTweet) {
        if (retweet.tweet && origTweet._id) {
          if (retweet.tweet.toString() === origTweet._id.toString()) {
            allRetweets[index].tweet = origTweet;
          }
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

  $scope.loadWorldTimelinePage = function() {
    TwitterFactory.getWorldTimeline()
      .then(function(returnedInfo) {

        $scope.origTweets = returnedInfo.data.origTweets;
        $scope.retweets = returnedInfo.data.retweets;
        $scope.tweets = returnedInfo.data.tweets;
        $scope.allTheUsers = returnedInfo.data.allNames;

        console.log('returning:', returnedInfo);
        $scope.allTweets = TwitterFactory.returnAllTweets($scope.retweets, $scope.origTweets, $scope.tweets);
        console.log('everything!!', $scope.allTweets);

        $scope.allTweets.forEach(function(tweet) {
          $scope.allTheUsers.forEach(function(user) {
            if ((tweet.author === user._id) || (tweet.retweeter === user._id) ) {
              tweet.avatar = user.avatar;
            }
            if (tweet.retweeter) {
              if (tweet.tweet.author === user._id) {
                tweet.tweet.avatar = user.avatar;
              }
            }
          });
        });

        console.log('updated alll...', $scope.allTweets);

      })
      .catch(function(err) {
        console.log('err loading world timeline page..', err.message);
      });
  };

  // load page once initially
  $scope.loadWorldTimelinePage();

  // delete Tweet (only tweet author has permission)
  $scope.deleteTweet = function(tweetId, author) {
    var tweetInfo = {
      tweetId: tweetId,
      author: author
    };
    TwitterFactory.removeTweet(tweetInfo)
      .then(function() {
        $scope.loadWorldTimelinePage();
      })
      .catch(function(err) {
        console.log('err removing tweet in world timeline...', err.message);
      });
  };

  $scope.deleteRetweet = function(retweetId, origTweetId) {
    var tweetInfo = {
      username: $rootScope.rootUsername,
      retweetId: retweetId,
      origTweetId: origTweetId
    };
    TwitterFactory.deleteRetweet(tweetInfo)
      .then(function() {
        $scope.loadWorldTimelinePage();
      })
      .catch(function(err) {
        console.log('err deleting retweet in profile controller...', err.message);
      });
  };

  $scope.saveTweet = function(tweetId, content) {
    var tweetInfo = {
      tweetId: tweetId,
      content: content
    };
    TwitterFactory.updateTweet(tweetInfo)
      .then(function() {
        $scope.loadWorldTimelinePage();
      })
      .catch(function(err) {
        console.log('err saving tweet in world timeline....', err.message);
      });
  };

  $scope.checkIfUserExists = function(arr) {
    // console.log('sent in array', arr);
    if (arr.indexOf($rootScope.rootUsername) > -1) {
      return true;
    } else {
      return false;
    };
    // return TwitterFactory.checkIfUserExistsInArr(arr);
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
        $scope.loadWorldTimelinePage();
      })
      .catch(function(err) {
        console.log('err updating liked status of tweet in timeline controller...', err.message);
      });
  };

  $scope.retweetTweet = function(tweetId) {
    if ($rootScope.rootUsername) {
      // console.log('who am i', arrObj);
      // var alreadyRetweeted = TwitterFactory.checkIfUserExistsInArrObj(arrObj);
      var tweetInfo = {
        tweetId: tweetId,
        username: $rootScope.rootUsername
        // alreadyRetweeted: alreadyRetweeted
      };
      console.log('tweet info cluck:', tweetInfo);
      TwitterFactory.retweetTweet(tweetInfo)
        .then(function() {
          $scope.loadWorldTimelinePage();
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
  // $scope.fileChosen = 'Choose a file';
  // console.log($scope.fileChosen);
  // var uploader = $scope.uploader = new FileUploader({
  //   url: '/api/upload/' + $rootScope.rootUsername
  // });
  //
  // $scope.updateFileChosen = function() {
  //   $scope.fileChosen = 'File has been chosen';
  // }
  // uploader.onCompleteAll = function(file) {
  // };
  //
  // uploader.onSuccessItem = function(fileItem, response, status, headers) {
  //   console.log('on success..... are you?');
  //   console.log('the response is waiting...', response);
  //   $scope.$emit('profileEditMode', response);
  // };
});

app.controller('EditProfileController', function($cookies, $state, $timeout, $stateParams, FileUploader, $rootScope, $scope, TwitterFactory) {
  $scope.errorMsg = null;
  $scope.fileChosen = 'Choose a file';

  console.log($scope.fileChosen);
  var uploader = $scope.uploader = new FileUploader({
    url: '/api/upload/' + $rootScope.rootUsername
  });

  $scope.updateFileChosen = function() {
    $scope.fileChosen = 'File has been chosen';
  }
  // uploader.onCompleteAll = function(file) {
  // };

  uploader.onSuccessItem = function(fileItem, response, status, headers) {
    // console.log('on success..... are you?');
    // console.log('the response is waiting...', response);
    // $scope.$emit('profileEditMode', response);
    $scope.origFile = $scope.userInfo.avatar;
    $scope.tempFileInfo = response;
    $scope.userInfo.avatar = response.filename;
    console.log($scope.userInfo.avatar);
  };

  // $scope.$on('profileEditMode', function(event, file) {
  //   // save the original file in case user chooses to cancel changes
  //   $scope.origFile = $scope.userInfo.avatar;
  //   $scope.tempFileInfo = file;
  //   $scope.userInfo.avatar = file.filename;
  //   console.log($scope.userInfo.avatar);
  // });

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
    if ($scope.tempFileInfo) {
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
    } else {
      if ($scope.fileChosen === 'File has been chosen') {
        $scope.errorMsg = "Please proceed to step 2 before saving.";
        $timeout(function() {
          $scope.errorMsg = null;
        }, 3500);
      } else {
        $scope.errorMsg = "Please proceed to step 1 and choose a file.";
        $timeout(function() {
          $scope.errorMsg = null;
        }, 3500);
      }
    }
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
  $scope.sayingsMode = true;
  $scope.whichMode = 'Sayings';

  $scope.loadProfilePage = function(sayingsMode) {
    TwitterFactory.getUserProfile($scope.username)
      .then(function(returnedInfo) {

        console.log('sayingsMode is what?', sayingsMode);
        console.log('$scope.sayingsMode is what?', $scope.sayingsMode);
        // $scope.sayingsMode = true;
        $scope.userInfo = returnedInfo.data.userInfo;
        $scope.tweets = returnedInfo.data.tweets;
        $scope.allRetweets = returnedInfo.data.allRetweets;
        $scope.origTweets = returnedInfo.data.origTweets;
        $scope.allTheUsers = returnedInfo.data.allTheUsers;
        console.log('tweeting!', $scope.tweets);

        if (!$scope.sayingsMode) {
          console.log('so wrong....');
          $scope.showLikes($scope.username);
          $scope.whichMode = 'Likes';
        }

        // if ($scope.userInfo.avatar) {
        //   $scope.updatedTweets = [];
        //   $scope.tweets.forEach(function(tweet) {
        //     tweet.avatar = $scope.userInfo.avatar;
        //     $scope.updatedTweets.push(tweet);
        //   });
        //   console.log('tweeting!', $scope.updatedTweets);
        // }

        $scope.allTweets = TwitterFactory.returnAllTweets($scope.allRetweets, $scope.origTweets, $scope.tweets);
        console.log('all them tweets:', $scope.allTweets);

        $scope.allTweets.forEach(function(tweet) {
          $scope.allTheUsers.forEach(function(user) {
            if ((tweet.author === user._id) || (tweet.retweeter === user._id) ) {
              tweet.avatar = user.avatar;
            }
            if (tweet.retweeter) {
              if (tweet.tweet.author === user._id) {
                tweet.tweet.avatar = user.avatar;
              }
            }
          });
        });

        console.log('updated alll...', $scope.allTweets);

      })
      .catch(function(err) {
        console.log('err retrieving user profile info...', err.message);
      });
  };

  // load profile once user enters controller
  $scope.loadProfilePage();

  // show user likes
  $scope.showLikes = function(currUser) {
    $scope.sayingsMode = false;
    $scope.whichMode = 'Likes'
    TwitterFactory.showUserLikes(currUser)
      .then(function(results) {
        console.log('the results are here...', results.data);
        $scope.allLikes = results.data.likes;
        $scope.userLikes = results.data.userLikesInfo;

        $scope.userLikes.forEach(function(user) {
          $scope.allLikes.forEach(function(like) {
            if (user._id === like.author) {
              like.avatar = user.avatar;
            }
          });
        });

      })
      .catch(function(err) {
        console.log('err retrieving user likes info...', err.message);
      });
  };

  $scope.showSayings = function() {
    $scope.sayingsMode = true;
    $scope.whichMode = 'Sayings';
  }

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

  $scope.deleteRetweet = function(retweetId, origTweetId) {
    var retweetInfo = {
      retweetId: retweetId,
      username: $rootScope.rootUsername,
      origTweetId: origTweetId
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

  $scope.updateTweetLikedStatus = function(tweetId, author, arr, mode) {
    console.log('mode...', mode);
    // mode => likes or sayings
    if ($rootScope.rootUsername) {
      var isLiked = TwitterFactory.checkIfUserExistsInArr(arr);

      var tweetInfo = {
        tweetId: tweetId,
        username: $rootScope.rootUsername,
        likedStatus: !isLiked,
        mode: mode
      };
      TwitterFactory.updateLikedTweetStatus(tweetInfo)
        .then(function(results) {
          console.log('the likes results...', results);
          // $scope.allLikes = results.data.userInfo.likes;
          $scope.loadProfilePage($scope.sayingsMode);
          // console.log('all the likes??', $scope.allLikes);
          // var mode = results.data.mode;
          // $scope.loadProfilePage();
          // if (results.data.mode) {
          //   // console.log('red');
          //   $scope.sayingsMode = false;
          //   // $scope.loadProfilePage(false);
          //   $scope.showLikes();
          //   $scope.userInfo.likes = results.data.rootInfo.likes;
          // } else {
          //   $scope.sayingsMode = true;
          // }

          // $scope.loadProfilePage($scope.sayingsMode);

          // else {
            // console.log('blue');
            // $scope.loadProfilePage();
          // }
          // console.log('YOOO....', results);
        })
        .catch(function(err) {
          console.log('err updating tweet liked status in profile controller...', err.message);
        });
    } else {
      $state.go("login");
    }
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
      var tweetInfo = {
        tweetId: tweetId,
        username: $rootScope.rootUsername
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

  $scope.getWindowWidth = function() {
    // console.log('inner width: ', window.innerWidth);
  };

});

app.controller('FollowingController', function($timeout, $scope, TwitterFactory, $rootScope, $state, $stateParams) {
  $scope.currProfileUser = $stateParams.username;

  $scope.loadFollowing = function() {
    TwitterFactory.getFollowingUsers($scope.currProfileUser)
      .then(function(results) {
        $scope.following = results.data.following;
        $scope.rootFollowing = results.data.rootFollowing;
        // console.log('results...', results.data)
      })
      .catch(function(err) {
        console.log('err retrieving the user followings from following controller...', err.message );
      });
  };

  // load page once initially
  $scope.loadFollowing();

  $scope.updateFollowingStatus = function(username, status) {
    if (!$rootScope.rootUsername) {
      $state.go('login');
    }
    var followingObj = {
      currUser: $rootScope.rootUsername,
      following: username,
      status: status
    }
    console.log('hmm..', followingObj);
    TwitterFactory.updateFollowingStatus(followingObj)
      .then(function() {
        $scope.loadFollowing();
      })
      .catch(function(err) {
        console.log('err updating the user following status from following controller...', err.message );
      });
  };

});

app.controller('FollowersController', function($timeout, $scope, TwitterFactory, $rootScope, $state, $stateParams) {
  $scope.currProfileUser = $stateParams.username;

  $scope.loadFollowers = function() {
    TwitterFactory.getFollowersUsers($scope.currProfileUser)
      .then(function(results) {
        $scope.followers = results.data.followers;
        $scope.rootFollowing = results.data.rootFollowing;
        console.log('results...', results.data)
      })
      .catch(function(err) {
        console.log('err retrieving the user followers from followers controller...', err.message );
      });
  };

  // load page once initially
  $scope.loadFollowers();

  $scope.updateFollowingStatus = function(username, status) {
    if (!$rootScope.rootUsername) {
      $state.go('login');
    }
    var followingObj = {
      currUser: $rootScope.rootUsername,
      following: username,
      status: status
    }
    console.log('hmm..', followingObj);
    TwitterFactory.updateFollowingStatus(followingObj)
      .then(function() {
        $scope.loadFollowers();
      })
      .catch(function(err) {
        console.log('err updating the user following status from followers controller...', err.message );
      });
  };

});
