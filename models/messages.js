var settings = require('../settings');
var mongodb = require('../utils/db');
var getSeq = require('./uniqueCounter');

function Message(message){
	this.id = message.id;
	this.m = message.m;
	this.approved = !!message.approved;
}
module.exports = Message;

Message.prototype.save = function save(callback){
	var msg = {
		m: this.m,
		approved: this.approved
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
				collection.ensureIndex('id', {unique: true}, function(err){
					if(err){
						return callback(err);
					}
					collection.insert(msg, {safe: true}, function(err, user){
						mongodb.close();
						callback(err, user[0]);
					});
				});
			});
		});
	});
};
Message.prototype.approve = function approve(callback){
	if(callback === undefined){
		callback = function(){};
	}
	this.approved = true;
	_this = this;
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		db.collection('messages', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.update({id:_this.id}, {$set:{approved:_this.approved}}, {}, function(err, collection){
				mongodb.close();
				callback(err, collection);
			});
		});
	});
}
Message.get = function get(query, callback,limit) { 
	if(limit === undefined){
		limit = 0;
	}
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		
		db.collection('messages', function(err, collection) {
			if (err) { 
				mongodb.close(); 
				return callback(err);
			}
			collection.find(query, {limit:limit}).sort({id: 1}).toArray(function(err, doc) {
				mongodb.close(); 
				if (doc) {
					var msgs = doc.map(function(m){return new Message(m)});
					callback(err, msgs);
				} else {
					callback(err, null);
				}
			});
		});
	});
};
