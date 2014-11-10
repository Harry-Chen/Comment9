var settings = require('../settings');

module.exports = mongoose = require('mongoose');
mongoose.connected = false;
mongoose.connection.on('open', function(){
  mongoose.connected = true;
});
mongoose.connect(settings.dbAddr);
