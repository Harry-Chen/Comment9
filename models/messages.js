var settings = require('../settings');
var mongoose = require('../utils/db');
var getSeq = require('./uniqueCounter');

var messageSchema = mongoose.Schema({
    id: Number,
    m: String,
    approved: {type: Number, default: 0},
    s: {type: Boolean, default: false},
    received: {type: Date, default: Date.now},
    activity: mongoose.Schema.Types.ObjectId,
});

messageSchema.statics.approveById = function(id, stared, aid, callback){
	if(!callback){
		callback = function(){};
	}
	var _this=this;
	_this.findOneAndUpdate({id: id, activity: aid}, {approved: Date.now(), s: !!stared}, callback);
}

var Message = mongoose.model('Message', messageSchema);

module.exports = Message;