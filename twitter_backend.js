const   express       =       require('express'),
        mongoose      =       require("mongoose"),
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

app.use(express.static('public'));

// NEW DB
mongoose.connect('mongodb://localhost/redo_twitter_db');

// ********************************
//              SCHEMAS
// ********************************
const User = mongoose.model('User', {
  _id: { type: String, required: true, unique: true },
  firstName: { type: String, required: true, unique: true },
  lastName: { type: String, required: true, unique: true },
  password: { type: String, required: true, unique: true },
  followers: [String],
  following: [String],
  likes: [ObjectId],
  tweets: [ObjectId], // tweet _id
  retweets: [ObjectId] // tweet._id
  avatar: String,
  joined: Date,
  authToken: { token: String, expires: Date }
});

const Tweet = mongoose.model('Tweet' {
  author: String,
  date: Date,
  content: String,
  likes: [String], // username
  retweets: [String] // username
});

app.listen(3005, function() {
  console.log('The server is listening on port 3005....');
});
