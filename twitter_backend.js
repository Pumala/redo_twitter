const   express       =       require('express'),
        mongoose      =       require("mongoose"),
        bodyParser    =       require('body-parser'),
        bluebird      =       require("bluebird"),
        uuidV4        =       require("uuid/v4"),
        path          =       require('path');


// BCRYPT
const bcrypt        = require('bcrypt-promise');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

const app           = express();
mongoose.Promise    = bluebird;
const ObjectId      = mongoose.Schema.ObjectId;

// module.exports        = function (app) {
const multer        = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/upload');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const id = uuidV4();
    cb(null, id + ext);
  }
});

// where to store the files => upload
const upload        = multer({
  storage
});

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
  likes: [String], // username,
  retweetIds: [ObjectId],
  retweeters: [String], // username
  avatar: String
});

const File = mongoose.model('File', {
  fieldname: String,
  originalname: String,
  encoding: String,
  mimetype: String,
  destination: String,
  filename: String,
  path: String,
  size: Number
});

const Retweet = mongoose.model('Retweet', {
  retweeter: String,
  date: Date,
  tweet: ObjectId, // tweet _id
  avatar: String
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
      console.log('tweets', tweets);

      var retweetNames = retweets.map(function(retweet) {
        return retweet.retweeter;
      });

      var tweetNames = tweets.map(function(tweet) {
        return tweet.author;
      });

      var allNames = retweetNames.concat(tweetNames);

      allNames = allNames.filter(function(name, pos) {
        return allNames.indexOf(name) == pos;
      })

      var origTweets = retweets.map(function(tweet) {
        return tweet.tweet;
      });
      console.log('originals!!', origTweets);
      return [ Tweet.find({
          _id: {
            $in: origTweets
          }
        }), retweets, tweets, User.find({ _id: { $in: allNames }})
      ];
    })
    .spread(function(origTweets, retweets, tweets, allNames) {
      return response.json({
        origTweets: origTweets,
        retweets: retweets,
        tweets: tweets,
        allNames: allNames
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
        }), allTweets, allRetweets, userInfo, User.find({ tweets: { $in: origTweets }})
      ];

    })
    .spread(function(origTweets, allTweets, allRetweets, userInfo, allTheUsers) {

      return response.json({
        allTheUsers: allTheUsers.concat([userInfo]),
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

});

// ********************************
//      GET FOLLOWING INFO
// ********************************
app.get('/api/profile/following/:username/:rootuser', function(request, response) {

  console.log(request.params);
  var username = request.params.username;
  var rootuser = request.params.rootuser;

  if (rootuser !== 'null') {

    User.findOne({ _id: username })
      .then(function(userInfo) {
        var following = userInfo.following;
        return [ User.find({
          _id: {
            $in: following
          }
        }), User.findOne({ _id: rootuser })]
      })
      .spread(function(following, rootInfo) {
        response.json({
          following: following,
          rootFollowing: rootInfo.following
        })
      })
      .catch(function(err) {
        console.log('err retrieving user following info from db...', err.message);
        response.status(500);
        response.json({
          error: err.message
        });
      });

  } else {

    User.findOne({ _id: username })
      .then(function(userInfo) {
        var following = userInfo.following;
        return User.find({
          _id: {
            $in: following
          }
        })
      })
      .then(function(following) {
        response.json({
          following: following,
          rootFollowing: []
        })
      })
      .catch(function(err) {
        console.log('err retrieving user following info from db...', err.message);
        response.status(500);
        response.json({
          error: err.message
        });
      });
  }

});

// ********************************
//      GET FOLLOWERS INFO
// ********************************
app.get('/api/profile/followers/:username/:rootuser', function(request, response) {

  console.log(request.params);
  var username = request.params.username;
  var rootuser = request.params.rootuser;

  if (rootuser !== 'null') {

    User.findOne({ _id: username })
      .then(function(userInfo) {
        var followers = userInfo.followers;
        return [ User.find({
          _id: {
            $in: followers
          }
        }), User.findOne({ _id: rootuser })]
      })
      .spread(function(followers, rootInfo) {
        response.json({
          followers: followers,
          rootFollowing: rootInfo.following
        })
      })
      .catch(function(err) {
        console.log('err retrieving user followers info from db...', err.message);
        response.status(500);
        response.json({
          error: err.message
        });
      });

  } else {

    User.findOne({ _id: username })
      .then(function(userInfo) {
        var followers = userInfo.followers;
        return User.find({
          _id: {
            $in: followers
          }
        })
      })
      .then(function(followers) {
        response.json({
          followers: followers,
          rootFollowing: []
        })
      })
      .catch(function(err) {
        console.log('err retrieving user following info from db...', err.message);
        response.status(500);
        response.json({
          error: err.message
        });
      });
  }

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
    retweetIds: [],
    retweeters: [],
    avatar: ""
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
//      DELETE TWEET AND UPDATE USERS TO REFLECT CHANGES
// **************************************************************
app.put('/api/tweet/edit/delete', function(request, response) {

  var username = request.body.username;
  var tweetId = request.body.tweetId;

  // 1. make a query to find the tweet info for later queries
  // 1A. from the tweet info, we want 2 things: retweetIds and retweeters
  // 2. remove all retweets whose ids match any of the ids found in retweetIds
  // 3. remove the original tweet
  // 4. update all users who are found in retweeters by removing any of their retweetIds
  // that match any of the retweetIds
  // 5. update the original tweet owner and remove tweet id from tweets array

  Tweet.findOne({ _id: tweetId })
    .then(function(tweetInfo) {
      var retweetIds = tweetInfo.retweetIds;
      var retweeters = tweetInfo.retweeters;

      return[ Retweet.remove({ _id: { $in: retweetIds }}),
        Tweet.remove({ _id: tweetId }),
        User.update({ _id: { $in: retweeters }},
          {
            $pullAll: { retweets: retweetIds }
          },
          {
            multi: true
          }
        ), User.update({
          _id: username
        }, {
          $pull: { tweets: tweetId }
        })
      ]
    })
    .spread(function(removeAllRetweets, removeOrigTweet, updatedUsers, updateOrigTweetUser) {
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
  console.log('hello there UPDATE TWEET STATUS', request.body);
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
    console.log('FALSE YES');
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
  var origTweetId = request.body.origTweetId;

  // 1. remove the retweet Id
  // 2. remove the retweet Id from the user retweets array
  // 3. remove the retweet Id from the original tweet retweetIds array

  bluebird.all([
      Retweet.remove({ _id: retweetId }),
      User.update({
        _id: username
      }, { $pull: { retweets: retweetId } }),
      Tweet.update({
        _id: origTweetId
      }, { $pull: { retweetIds: retweetId } })
    ])
    .spread(function(removedTweet, updatedUser, updatedTweet) {
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

  // create a new retweet
  var newRetweet = new Retweet({
    retweeter: username,
    date: new Date(),
    tweet: tweetId,
    avatar: ""
  });

  newRetweet.save()
  .then(function(savedRetweet) {
    var retweetId = savedRetweet._id;

    // add retweeters name to retweeter array in original tweet
    // if it's already there, it does nothing
    // increment retweetCount by 1
    // also, add retweet Id to user's array of retweets
    return [ Tweet.update({
        _id: tweetId
      }, {
        $addToSet: { retweeters: username, retweetIds: retweetId }
        // $inc: { retweetCount: 1 }
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

});

app.put('/api/profile/edit/save', function(request, response) {
  console.log('saved', request.body);

  var username = request.body.username;
  var filename = request.body.filename;
  var origFileName = request.body.origFileName;

  // delete old user avatar
  // update user's avatar

  bluebird.all([
    File.remove({ filename: origFileName }),
    User.update({
        _id: username
      }, {
        $set: {
          avatar: filename
        }
      })
    ])
    .spread(function(removedFile, updatedUser) {
      return response.json({
        message: "success removing file and updating user edits!"
      });
    })
    .catch(function(err) {
      console.log('err saving new profile edits...', err.message);
    });

});

// **************************************************************
//                GET USER INFO TO EDIT PROFILE
// **************************************************************
app.get('/api/profile/edit/user/:username', function(request, response) {

  var username = request.params.username;

  User.findOne({ _id: username })
    .then(function(userInfo) {
      return response.json({
        userInfo: userInfo
      });
    })
    .catch(function(err) {
      console.log('err retrieving user info to edit profile...', err.message);
    });
});

// **************************************************************
//                        FILE UPLOAD API
// **************************************************************
app.post('/api/profile/files/upload/user/:username', upload.single('file'), function(request, response) {

  console.log('upload me!');
  var username = request.params.username;

  var file = request.file;

  var newFile = new File(file);

  newFile.save()
    .then(function(newFile) {
      console.log('new file made..', newFile);
      // var fileId = newFile._id;

      return response.json({
        originalname: newFile.originalname,
        filename: newFile.filename,
        fileId: newFile._id
      });

    })
    .catch(function(err) {
      console.log('err saving new file...', err.message);
    });

});

// **************************************************************
//                    UPDATE FOLLOWING STATUS
// **************************************************************
app.put('/api/user/following/status/update', function(request, response) {

  console.log('HUHUH!', request.body);

  var currUser = request.body.currUser;
  var following = request.body.following;
  var followingStatus = request.body.status;

  if (followingStatus) {
    console.log('inside?');
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

// **************************************************************
//                    UPDATE FOLLOWING STATUS
// **************************************************************
app.delete('/api/profile/edit/delete/file/:fileid', function(request, response) {
  var fileId = request.params.fileId;

  File.remove({ _id: fileId })
    .then(function(removedFile) {
      return response.json({
        message: 'success deleting file from db!'
      });
    })
    .catch(function(err) {
      console.log('err deleting file from db...', err.message);
    });
});

app.listen(3005, function() {
  console.log('The server is listening on port 3005....');
});
