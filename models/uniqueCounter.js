

module.exports = function(db, name, callback){
	db.collection('counters', function(err, collection){
		if(err){
			return callback(err);
		}
		collection.findAndModify(
			{ _id: name },
			[['_id', 1]],
			{ $inc: { seq: 1 } },
			{new: true, upsert: true},
			function(err, ret){
				if(err){
					return callback(err);
				}
				callback(null, ret.seq);
			}
		);
	});
};