var settings = require('../settings');
var mongoose = require('../utils/db');
var getSeq = require('./uniqueCounter');

var messageSchema = mongoose.Schema({
    id: Number,
    m: String,
    approved: {type: Boolean, default: false},
    s: {type: Boolean, default: false},
});

messageSchema.methods.approve = function(stared, callback){
	this.approved = true;
	this.s = !!stared;
	if(!callback){
		callback = function(){};
	}
	this.save(callback);
};

messageSchema.statics.approveById = function(id, stared, callback){
	if(!callback){
		callback = function(){};
	}
	this.findOneAndUpdate({id: id}, {approved: true, s: !!stared}, callback);
}

var Message = mongoose.model('Message', messageSchema);

module.exports = Message;