
var mongoose = require('../utils/db.js');

var uniqueCounterSchema = mongoose.Schema({
    name: String,
    seq: Number,
});

uniqueCounterSchema.set('autoIndex', false);

uniqueCounterSchema.statics.getNextFor = function(name, callback){
	if(! mongoose.connected){
		return callback("DB not connected");
	}
	this.findOneAndUpdate({ name: name},{ $inc: { seq: 1 } }, {new: true, upsert: true}, function(err, doc){
		if(err){
			return callback(err);
		}
		callback(null, doc.seq);
	});
}

var uniqueCounter = mongoose.model('uniqueCounter', uniqueCounterSchema);

module.exports = function(name, callback){
	uniqueCounter.getNextFor(name, callback);
};