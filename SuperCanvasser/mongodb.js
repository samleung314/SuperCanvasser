var mongoose = require('mongoose');
// mongodb://username:password@serverip:27017/dbname
var mongoDB = 'mongodb://user308:cse308@35.229.71.230:27017/superCanvasser';
var options = {
    useNewUrlParser: true 
  }

mongoose.connect(mongoDB, options);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
    console.log("Connected to Mongoose!");
});