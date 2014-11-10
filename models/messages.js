var settings = require('../settings');
var mongoose = require('../utils/db');
var getSeq = require('./uniqueCounter');

var messageSchema = mongoose.Schema({
    id: Number,
    m: String,
    approved: {type: Number, default: 0},
    s: {type: Boolean, default: false},
});

messageSchema.methods.approve = function(stared, callback){
	var _this = this;
	getSeq("approve", function(err, id){
		if(err){
			return callback(err);
		}
		_this.approved = id;
		_this.s = !!stared;
		if(!callback){
			callback = function(){};
		}
		_this.save(callback);
	});
};

messageSchema.statics.approveById = function(id, stared, callback){
	if(!callback){
		callback = function(){};
	}
	var _this=this;
	//getSeq("approve", function(err, id){
		/*if(err){
			return callback(err);
		}*/
		_this.findOneAndUpdate({id: id}, {approved: Date.now(), s: !!stared}, callback);
	//});
}

var Message = mongoose.model('Message', messageSchema);

module.exports = Message;