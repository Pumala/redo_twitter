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
const Tweet = mongoose.model('Tweet', {
  content: { type: String, required: true },
  date: Date,
  author: String,
  likes: [String], // username
  retweets: [{ _id: String, count: Number }] // username
});

// const Retweet = mongoose.model('Retweet', {
//   retweeter: String,
//   date: Date,
//   tweet: ObjectId
// });

const User = mongoose.model('User', {
  _id: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  password: { type: String, required: true },
  followers: [String],
  following: [String],
  likes: [ObjectId],
  tweets: [ObjectId], // tweet _id
  retweets: [{ _id: ObjectId, count: Number }], // retweetid
  avatar: String,
  joined: Date,
  authToken: { token: String, expires: Date }
});

// ********************************
//          WORLD TIMELINE
// ********************************
app.get('/api/worldtimeline', function(request, response) {
  console.log('in the world timelines api');
  Tweet.find().limit(20)
    .then(function(tweets) {
      return response.json({
        tweets: tweets
      });
    })
    .catch(function(err) {
      console.log('err retrieving the world timeline tweets from the db...', err.message);
    });

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
      console.log('user retweets ', userInfo.retweets);

      return [ Tweet.find({ _id: { $in: userTweets} }), userInfo ];
    })
    .spread(function(allTweets, userInfo) {
      console.log('tweets:', allTweets);
      return response.json({
        userInfo: userInfo,
        tweets: allTweets
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
    retweets: []
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
//            UPDATE USER RETWEET
// **************************************************************
app.put('/api/retweet/new/add', function(request, response) {

  console.log('RETWEET INFO', request.body);

  var tweetId = request.body.tweetId;
  var username = request.body.username;
  var alreadyRetweeted = request.body.alreadyRetweeted;

  if (alreadyRetweeted) {
    console.log('already retweeted');
    bluebird.all([
        Tweet.update({
          _id: tweetId,
          "retweets._id": username
        }, {
          $inc: { "retweets.$.count": 1 }
        }), User.update({
          _id: username,
          "retweets._id": tweetId
        }, {
          $inc: { "retweets.$.count": 1 }
        })
      ])
      .spread(function(updatedTweet, updatedUser) {
        console.log('after incrementing?');
        return response.json({
          message: 'success updating adding retweet!'
        });
      })
      .catch(function(err) {
        response.status(500);
        response.json({
          error: err.message
        });
        console.log('err updating adding retweet to db...', err.message);
      });

  } else {

    console.log('before crash');
    bluebird.all([
        Tweet.update({
          _id: tweetId,
          "retweets._id": { $ne: username }
        }, {
          $addToSet: { "retweets": { "_id" : username, "count": 1 } }
        }), User.update({
          _id: username,
          "retweets._id": { $ne: tweetId }
        }, {
          $addToSet: { "retweets": { "_id": tweetId, "count": 1 } }
        })
      ])
      .then(function(updatedTweet) {
        console.log('after incrementing?');
        return response.json({
          message: 'success updating adding retweet!'
        });
      })
      .catch(function(err) {
        response.status(500);
        response.json({
          error: err.message
        });
        console.log('err updating adding retweet to db...', err.message);
      });
  }

});

app.put('/api/user/following/status/update', function(request, response) {
  console.log('hmmm .... j', request.body);

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
