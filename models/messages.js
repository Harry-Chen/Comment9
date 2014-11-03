var settings = require('../settings');
var mongodb = require('../utils/db');
var getSeq = require('./uniqueCount');

function Message(message){
	this.id = message.id;
	this.m = message.m;
}
module.exports = Message;

Message.prototype.save = function save(callback){
	var msg = {
		m: this.m,
	};
	
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		getSeq(db, 'messages', function(err, id){
			if(err){
				return callback(err);
			}
			msg.id = id;
			db.collection('messages', function(err, collection){
				if(err){
					mongodb.close();
					return callback(err);
				}
				collection.ensureIndex('id', {unique: ture});
				collection.insert(msg, {safe: true}, function(err, user) {
			￼￼￼￼	mongodb.close();
					callback(err, user);
				});
			});
		});
	});
};
Message.get = function get(id, callback) { 
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		
		db.collection('messages', function(err, collection) {
			if (err) { 
				mongodb.close(); 
				return callback(err);
			}
			collection.findOne({id: id}, function(err, doc) {
				mongodb.close(); 
				if (doc) {
					// 封装文档为 User 对象
					var user = new Message(doc);
					callback(err, user);
				} else {
					callback(err, null);
				}
			});
		});
	});
};
