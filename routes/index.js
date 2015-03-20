var express = require('express');
var router = express.Router();
ClientQueue = require('../utils/clientQueue.js');
Settings = require('../settings.js');
var Message = require('../models/messages.js');
var counter = require('../models/uniqueCounter.js')
var Activity = require('../models/activities.js');

var toProcess = [];
var waitingClients = ClientQueue(Settings.longQueryTimeout);
var waitingScreens = ClientQueue(Settings.longQueryTimeout);

function checkToken (type, req, res, next) {
	var token = req.query.token;
	if(!token){
	    res.status(403).end();
	    return;
	}
	Activity.getActivityIdByToken(type, token, function(err, activity){
		console.log(activity);
		if(err || !activity){
		    res.status(403).end();
		}else{
			req.activityId = activity._id;
			next();
		}
	});
}


router.post('/new', function(req, res, next){ 
		return checkToken('sending', req, res, next);
	}, function(req, res){ 
	//接到请求，存入messages
	//var id = messages.push(req.body.m) - 1;
	function postOne(msg){
		counter("messages", function(err, id){
			if(err){
				console.error(err);
				res.status(500).end();
				return;
			}else{
				var m = new Message({id: id, m: msg.m});
				m.save(function(err, newM){
					if(err){
						console.error(err);
						res.status(500).end();
						return;
					}else{
						//取出等待的管理员，分配给他
						var c = waitingClients.getOne();
						if(c !== undefined){
							c.json({"id": newM.id, "m": newM.m});
							c.end();
						}else{ 
						//如果没人在等待，放入队列
							toProcess.push(newM.id);
						}
					}
				});
			}
		});
	};
	if(Array.isArray(req.body)){
		req.body.map(postOne);
	}else{
		postOne(req.body);
	}
	res.end();
});

router.get('/admin/fetch', function(req, res, next){ 
		return checkToken('audit', req, res, next);
	}, function(req, res){
	//检查待处理队列，如果为空
	if(toProcess.length == 0){
		//将当前客户端放入等待队列
		waitingClients.enQueue(res);
	}else{
		var mid = toProcess.shift();
		Message.find({id: mid}, function(err, ret){
			var result;
			if(err || ret.length == 0){
				console.error(err);
				result = {};
			}else{
				result = {
					id: ret[0].id,
					m: ret[0].m
				};
			}
			res.json(result);
			res.end();
		});
	}
});

router.get('/admin/approve/:id', function(req, res, next){ 
		return checkToken('audit', req, res, next);
	}, function(req, res){
	Message.approveById(parseInt(req.params.id), !!parseInt(req.query.s), function(err){
		if(err){
			console.err(err);
		}else{
			Message.findOne({id: parseInt(req.params.id)}, function(err, m){
				var result;
				if(err){
					console.error(err);
					result = {};
				}else{
					result = {
						id: m.approved,
						m: m.m,
						s: m.s
					};
				}
				var screen;
				while((screen = waitingScreens.getOne()) !== undefined){
					screen.json([result]);
					screen.end();
				}
			});
		}
	});
	res.end();
	/*setTimeout(function(){
		res.end();
	},3000);*/
});
router.get('/admin/test', function(req, res, next){ 
		return checkToken('audit', req, res, next);
	}, function(req, res){

	var screen;
	while((screen = waitingScreens.getOne()) !== undefined){
		screen.json([{
		
			id: Date.now(),
			m: "弹幕试机" + Date.now(),
			s: false
		
		}]);
		screen.end();
	}
	res.end();

});
router.get('/screen', function(req, res, next){ 
		return checkToken('screen', req, res, next);
	}, function(req, res){
	res.set('Access-Control-Allow-Origin', '*');
	var start = parseInt(req.query.s);
	var length = parseInt(req.query.l);
	if(length > 20){
		length = 20;
	}
	Message.find({
		approved: {$gte: start}
	}, null, {
		limit: length,
	},function(err, ret){
		if(err){
			res.end("{}");
		}
		if(ret.length == 0){
			waitingScreens.enQueue(res);
		}else{
			res.json(ret.map(function(m){
				return {
					id: m.approved,
					m : m.m,
					s : m.s
				};
			}));
			res.end();
		}
	});
});

module.exports = router;
