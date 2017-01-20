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
  retweets: [String] // username
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
  retweets: [ObjectId], // tweet _id
  avatar: String,
  joined: Date,
  authToken: { token: String, expires: Date }
});

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

app.put('/api/logout', function(request, response) {

  console.log('username', request.body);
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









app.listen(3005, function() {
  console.log('The server is listening on port 3005....');
});
