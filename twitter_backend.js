const   express       =       require('express'),
        mongoose      =       require("mongoose"),
        bodyParser    =       require('body-parser'),
        bluebird      =       require("bluebird"),
        uuidV4        =       require("uuid/v4");

// BCRYPT
const bcrypt        = require('bcrypt-promise');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

const app           = express();
mongoose.Promise    = bluebird;
const ObjectId      = mongoose.Schema.ObjectId;

app.use(bodyParser.json());
app.use(express.static('public'));

// NEW DB
mongoose.connect('mongodb://localhost/redo_twitter_db');

// ********************************
//              SCHEMAS
// ********************************
// const Tweet = mongoose.model('Tweet', {
//   content: { type: String, required: true },
//   date: Date,
//   author: String,
//   likes: [String], // username
//   isRetweet: Boolean,
//   retweet: { _id: ObjectId, retweeter: String, date: Date }
// });

const Tweet = mongoose.model('Tweet', {
  content: { type: String, required: true },
  date: Date,
  author: String,
  likes: [String], // username
  retweetCount: Number
  // isRetweet: Boolean,
  // retweet: { _id: ObjectId, retweeter: String, date: Date }
});

const Retweet = mongoose.model('Retweet', {
  retweeter: String,
  date: Date,
  tweet: ObjectId // tweet _id
});

const User = mongoose.model('User', {
  _id: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  password: { type: String, required: true },
  followers: [String],
  following: [String],
  likes: [ObjectId],
  tweets: [ObjectId], // tweet _id
  retweets: [ObjectId], // retweet _id
  avatar: String,
  joined: Date,
  authToken: { token: String, expires: Date }
});

// ********************************
//          WORLD TIMELINE
// ********************************
app.get('/api/worldtimeline', function(request, response) {
  console.log('in the world timelines api');

  bluebird.all([
      Retweet.find().limit(10),
      Tweet.find().limit(10)
    ])
    .spread(function(retweets, tweets) {
      console.log('retweets:', retweets);

      var origTweets = retweets.map(function(tweet) {
        return tweet.tweet;
      });
      console.log('originals!!', origTweets);
      return [ Tweet.find({
          _id: {
            $in: origTweets
          }
        }), retweets, tweets
      ];
    })
    .spread(function(origTweets, retweets, tweets) {
      return response.json({
        origTweets: origTweets,
        retweets: retweets,
        tweets: tweets
      });
    })
    .catch(function(err) {
      console.log('err retrieving the world timeline tweets from the db...', err.message);
    });

  // Tweet.find().limit(10)
  //   .then(function(tweets) {
  //     return response.json({
  //       tweets: tweets
  //     });
  //   })
  //   .catch(function(err) {
  //     console.log('err retrieving the world timeline tweets from the db...', err.message);
  //   });

});

// ********************************
//          USER SIGN UP
// ********************************
app.put('/api/signup', function(request, response) {

  var data = request.body;
  var username = data.username;
  var password = data.password;

  bcrypt.genSalt(saltRounds)
    .then(function(salt) {
      return bcrypt.hash(password, salt);
    })
    .then(function(hashedPassword) {

      // save the hash form of the password in the db

      var newUser = new User({
        _id: username,
        firstName: "",
        lastName: "",
        password: hashedPassword,
        followers: [],
        following: [],
        likes: [],
        tweets: [],
        retweets: [],
        avatar: "",
        joined: new Date(),
        // update token expires date
        authToken: { token: uuidV4(), expires: new Date() }
      });

      return newUser.save();
    })
    .then(function(newUser) {
      console.log('blue');
      return response.json({
        userInfo: newUser
      });
    })
    .catch(function(err) {
      response.status(500);
      response.json({
        error: err.message
      });
    });

});

// ********************************
//            USER LOGIN
// ********************************
app.post('/api/login', function(request, response) {

  var data = request.body;
  var username = data.username;
  var password = data.password;

  User.findOne({ _id: username })
    .then(function(userInfo) {
      var hashedPassword = userInfo.password;

      return [ userInfo, bcrypt.compare(password, hashedPassword) ];
    })
    .spread(function(userInfo, passwordsMatch) {
      console.log('red');
      if (passwordsMatch) {
        return [ User.findOneAndUpdate(
          { _id: username },
          // DO: update expires date
          { $set: { authToken: { token: uuidV4(), expires: new Date() } } }
        ), passwordsMatch ];
      }
      return response.json({
        message: passwordsMatch
      });
    })
    .spread(function(updatedUser, passwordsMatch) {
      return response.json({
        message: passwordsMatch,
        userInfo: updatedUser
      });
    })
    .catch(function(err) {
      console.log('err logging in user...', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
    });

});

// ********************************
//           USER LOGOUT
// ********************************
app.put('/api/logout', function(request, response) {

  var username = request.body.username;

  User.update({
      _id: username,
    }, {
      $set: { authToken: { token: "", expires: "" } }
    })
    .then(function(updatedUser) {
      return response.json({
        message: "success logging out user"
      });
    })
    .catch(function(err) {
      console.log('err logging out user...', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
    });

});



// ********************************
//      GET USER PROFILE INFO
// ********************************
app.get('/api/profile/:username', function(request, response) {

  var username = request.params.username;

  User.findOne({ _id: username })
    .then(function(userInfo) {
      var userTweets = userInfo.tweets;
      var userRetweets = userInfo.retweets;

      return [ Tweet.find({ _id: { $in: userTweets} }),
        Retweet.find({ retweeter: username }),
        userInfo
      ];
    })
    .spread(function(allTweets, allRetweets, userInfo) {
      console.log('tweets:', allTweets);
      console.log('REtweets:', allRetweets);

      var origTweets = allRetweets.map(function(retweet) {
        return retweet.tweet;
      });

      return [ Tweet.find({
          _id: {
            $in: origTweets
          }
        }), allTweets, allRetweets, userInfo
      ];

    })
    .spread(function(origTweets, allTweets, allRetweets, userInfo) {
      return response.json({
        userInfo: userInfo,
        tweets: allTweets,
        origTweets: origTweets,
        allRetweets: allRetweets
      });
    })
    .catch(function(err) {
      console.log('err retrieving user info from db...', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
    });

  // User.findOne({ _id: username })
  //   .then(function(userInfo) {
  //     var userTweets = userInfo.tweets;
  //     console.log('user retweets ', userInfo.retweets);
  //
  //     return [ Tweet.find({ _id: { $in: userTweets} }), userInfo ];
  //   })
  //   .spread(function(allTweets, userInfo) {
  //     console.log('tweets:', allTweets);
  //     return response.json({
  //       userInfo: userInfo,
  //       tweets: allTweets
  //     });
  //   })
  //   .catch(function(err) {
  //     console.log('err retrieving user info from db...', err.message);
  //     response.status(500);
  //     response.json({
  //       error: err.message
  //     });
  //   });

  // User.findOne({ _id: username })
  //   .then(function(userInfo) {
  //     var userTweets = userInfo.tweets;
  //     console.log('bfore ', userTweets);
  //
  //     return [ Tweet.find({ _id: { $in: userTweets} }), userInfo ];
  //   })
  //   .spread(function(allTweets, userInfo) {
  //     console.log('tweets:', allTweets);
  //     return response.json({
  //       userInfo: userInfo,
  //       tweets: allTweets
  //     });
  //   })
  //   .catch(function(err) {
  //     console.log('err retrieving user info from db...', err.message);
  //     response.status(500);
  //     response.json({
  //       error: err.message
  //     });
  //   });

});

// ********************************
//      ADD NEW TWEET TO DB
// ********************************
app.post('/api/profile/tweet/new', function(request, response) {

  var username = request.body.username;
  var content = request.body.content;

  var newTweet = new Tweet({
    content: content,
    date: new Date(),
    author: username,
    likes: [],
    retweetCount: 0
    // isRetweet: false,
    // retweet: { _id: "", retweeter: "", date: "" }
  });

  newTweet.save()
    .then(function(savedTweet) {
      var tweetId = savedTweet._id;

      return User.update({
        _id: username
      }, {
        $addToSet: { tweets: tweetId }
      });
    })
    .then(function(updatedUser) {
      console.log('before returning');
      return response.json({
        message: 'success adding tweet to db!'
      });
    })
    .catch(function(err) {
      console.log('err adding new tweet to db...', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
    });

});

// **************************************************************
//                     UPDATE TWEET CONTENT
// **************************************************************
app.put('/api/tweet/edit/update', function(request, response) {

  var tweetId = request.body.tweetId;
  var content = request.body.content;

  Tweet.update({
      _id: tweetId
    }, {
      $set: { content: content }
    })
    .then(function(updatedTweet) {
      return response.json({
        message: 'success updating tweet content in the db!'
      })
    })
    .catch(function(err) {
      console.log('err updating tweet to db...', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
    });

});

// **************************************************************
//      DELETE TWEET AND UPDATE USER TWEETS TO REFLECT CHANGES
// **************************************************************
app.put('/api/tweet/edit/delete', function(request, response) {

  var username = request.body.username;
  var tweetId = request.body.tweetId;

  bluebird.all([
      Tweet.remove({ _id: tweetId }),
      User.update({
        _id: username
      }, { $pull: { tweets: tweetId } })
    ])
    .spread(function(removedTweet, updatedUser) {
      return response.json({
        message: "success deleting tweet from db!"
      });
    })
    .catch(function(err) {
      console.log('err deleting tweet from db...', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
    });

});

// **************************************************************
//            UPDATE USER LIKE TWEET STATUS
// **************************************************************
app.put('/api/tweet/status/update', function(request, response) {
  console.log('hello there', request.body);
  var tweetId = request.body.tweetId;
  var username = request.body.username;
  var likedStatus = request.body.likedStatus;

  if (likedStatus) {
    console.log('it is true');
    bluebird.all([
      Tweet.update({
            _id: tweetId
          }, {
            $addToSet: { likes: username }
          }), User.update({
            _id: username
          }, {
            $addToSet: { likes: tweetId }
          })
      ])
      .spread(function(updatedTweet, updatedUser) {
        return response.json({
          message: 'success updating user likes!'
        });
      })
      .catch(function(err) {
        console.log('err updating tweet and user tweet likes array...', err.message);
      });
  } else {
    bluebird.all([
      Tweet.update({
            _id: tweetId
          }, {
            $pull: { likes: username }
          }), User.update({
            _id: username
          }, {
            $pull: { likes: tweetId }
          })
      ])
      .spread(function(updatedTweet, updatedUser) {
        return response.json({
          message: 'success updating user likes!'
        })
      })
      .catch(function(err) {
        response.status(500);
        response.json({
          error: err.message
        });
        console.log('err updating tweet and user tweet likes array...', err.message);
      });
  };

});

// **************************************************************
//                      DELETE RETWEET
// **************************************************************
app.put('/api/retweet/edit/delete', function(request, response) {

  var username = request.body.username;
  var retweetId = request.body.retweetId;
  console.log('delete retweet i think', request.body);

  bluebird.all([
      Retweet.remove({ _id: retweetId }),
      User.update({
        _id: username
      }, { $pull: { retweets: retweetId } })
    ])
    .spread(function(removedTweet, updatedUser) {
      return response.json({
        message: "success deleting retweet from db!"
      });
    })
    .catch(function(err) {
      console.log('err deleting retweet from db...', err.message);
      response.status(500);
      response.json({
        error: err.message
      });
    });

});

// **************************************************************
//            UPDATE USER RETWEET
// **************************************************************
app.put('/api/retweet/new/add', function(request, response) {

  console.log('RETWEET INFO', request.body);

  var tweetId = request.body.tweetId;
  var username = request.body.username;
  // var alreadyRetweeted = request.body.alreadyRetweeted;

  // create a new retweet
  var newRetweet = new Retweet({
    retweeter: username,
    date: new Date(),
    tweet: tweetId
  });

  newRetweet.save()
  .then(function(savedRetweet) {
    var retweetId = savedRetweet._id;

    return [ Tweet.update({
        _id: tweetId
      }, {
        $inc: { retweetCount: 1 }
      }),
      User.update({
        _id: username
      }, {
        $addToSet: { retweets: retweetId }
      })
    ];
  })
  .spread(function(updatedTweet, updatedUser) {
    return response.json({
      message: "success saving new retweet to db!"
    });
  })
  .catch(function(err) {
    console.log('err saving new retweet to db..', err.message);
  });

  // bluebird.all([
  //     newRetweet.save(),
  //     Tweet.update({
  //       _id: tweetId
  //     }, {
  //       $inc: { retweetCount: 1 }
  //     }),
  //     User.update({
  //       _id: username
  //     }, {
  //       $addToSet: { retweets: retweetId }
  //     })
  //   ])
  //   .spread(function(savedRetweet, updatedUser) {
  //     return response.json({
  //       message: "success saving new retweet to db!"
  //     });
  //   })
  //   .catch(function(err) {
  //     console.log('err saving new retweet to db..', err.message);
  //   });
  //
  // newRetweet.save()
  //   .then(function(newRetweet) {
  //     var newRetweetId = newRetweet._id;
  //
  //     return User.update({
  //       _id: username
  //     }, {
  //       $addToSet: { retweets: newRetweetId }
  //     })
  //   })
  //   .then(function(updatedUser) {
  //     return response.json({
  //       message: "success saving new retweet to db!"
  //     });
  //   })
  //   .catch(function(err) {
  //     console.log('err saving new retweet to db..', err.message);
  //   });

  // if (alreadyRetweeted) {
  //   console.log('already retweeted');
  //   bluebird.all([
  //       Tweet.update({
  //         _id: tweetId,
  //         "retweets._id": username
  //       }, {
  //         $inc: { "retweets.$.count": 1 }
  //       }), User.update({
  //         _id: username,
  //         "retweets._id": tweetId
  //       }, {
  //         $inc: { "retweets.$.count": 1 }
  //       })
  //     ])
  //     .spread(function(updatedTweet, updatedUser) {
  //       console.log('after incrementing?');
  //       return response.json({
  //         message: 'success updating adding retweet!'
  //       });
  //     })
  //     .catch(function(err) {
  //       response.status(500);
  //       response.json({
  //         error: err.message
  //       });
  //       console.log('err updating adding retweet to db...', err.message);
  //     });

  // } else {
  //
  //   console.log('before crash');
  //   bluebird.all([
  //       Tweet.update({
  //         _id: tweetId,
  //         "retweets._id": { $ne: username }
  //       }, {
  //         $addToSet: { "retweets": { "_id" : username, "count": 1 } }
  //       }), User.update({
  //         _id: username,
  //         "retweets._id": { $ne: tweetId }
  //       }, {
  //         $addToSet: { "retweets": { "_id": tweetId, "count": 1 } }
  //       })
  //     ])
  //     .then(function(updatedTweet) {
  //       console.log('after incrementing?');
  //       return response.json({
  //         message: 'success updating adding retweet!'
  //       });
  //     })
  //     .catch(function(err) {
  //       response.status(500);
  //       response.json({
  //         error: err.message
  //       });
  //       console.log('err updating adding retweet to db...', err.message);
  //     });
  // }


  // if (alreadyRetweeted) {
  //   console.log('already retweeted');
  //   bluebird.all([
  //       Tweet.update({
  //         _id: tweetId,
  //         "retweets._id": username
  //       }, {
  //         $inc: { "retweets.$.count": 1 }
  //       }), User.update({
  //         _id: username,
  //         "retweets._id": tweetId
  //       }, {
  //         $inc: { "retweets.$.count": 1 }
  //       })
  //     ])
  //     .spread(function(updatedTweet, updatedUser) {
  //       console.log('after incrementing?');
  //       return response.json({
  //         message: 'success updating adding retweet!'
  //       });
  //     })
  //     .catch(function(err) {
  //       response.status(500);
  //       response.json({
  //         error: err.message
  //       });
  //       console.log('err updating adding retweet to db...', err.message);
  //     });
  //
  // } else {
  //
  //   console.log('before crash');
  //   bluebird.all([
  //       Tweet.update({
  //         _id: tweetId,
  //         "retweets._id": { $ne: username }
  //       }, {
  //         $addToSet: { "retweets": { "_id" : username, "count": 1 } }
  //       }), User.update({
  //         _id: username,
  //         "retweets._id": { $ne: tweetId }
  //       }, {
  //         $addToSet: { "retweets": { "_id": tweetId, "count": 1 } }
  //       })
  //     ])
  //     .then(function(updatedTweet) {
  //       console.log('after incrementing?');
  //       return response.json({
  //         message: 'success updating adding retweet!'
  //       });
  //     })
  //     .catch(function(err) {
  //       response.status(500);
  //       response.json({
  //         error: err.message
  //       });
  //       console.log('err updating adding retweet to db...', err.message);
  //     });
  // }

});

// **************************************************************
//                    UPDATE FOLLOWING STATUS
// **************************************************************
app.put('/api/user/following/status/update', function(request, response) {

  var currUser = request.body.currUser;
  var following = request.body.following;
  var followingStatus = request.body.status;

  if (followingStatus) {
    // add currUser to following's followers array
    // add following to currUser's following array
    bluebird.all([
        User.update({
          _id: following
        }, {
          $addToSet: { followers: currUser }
        }), User.update({
          _id: currUser
        }, {
          $addToSet: { following: following }
        })
      ])
      .spread(function(updatedFollowingUser, updatedCurrUser) {
        return response.json({
          message: "success updating following status!"
        })
      })
      .catch(function(err) {
        console.log('err updating following status to db...', err.message);
        response.status(500);
        response.json({
          error: err.message
        });
      });
  } else {
    // remove currUser from following's followers array
    // remove following from currUser's following array
    bluebird.all([
        User.update({
          _id: following
        }, {
          $pull: { followers: currUser }
        }), User.update({
          _id: currUser
        }, {
          $pull: { following: following }
        })
      ])
      .spread(function(updatedFollowingUser, updatedCurrUser) {
        return response.json({
          message: "success updating following status!"
        })
      })
      .catch(function(err) {
        console.log('err updating following status to db...', err.message);
        response.status(500);
        response.json({
          error: err.message
        });
      });
  };

});


app.listen(3005, function() {
  console.log('The server is listening on port 3005....');
});
