var express = require('express');
var router = express.Router();
ClientQueue = require('../utils/clientQueue.js');
Settings = require('../settings.js');
var Message = require('../models/messages.js');
var counter = require('../models/uniqueCounter.js')

var toProcess = [];
var waitingClients = ClientQueue(Settings.longQueryTimeout);

/* GET home page. */

router.post('/new', function(req, res){ 
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

router.get('/admin/fetch', function(req, res){
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

router.get('/admin/approve/:id', function(req, res){
	Message.approveById(parseInt(req.params.id), !!parseInt(req.query.s), function(err){
		if(err){
			console.err(err);
		}
	});
	res.end();
	/*setTimeout(function(){
		res.end();
	},3000);*/
});
router.get('/screen', function(req, res){
	var start = parseInt(req.query.s);
	var length = parseInt(req.query.l);
	Message.find({
		approved: {$gte: start}
	}, null, {
		limit: length,
	},function(err, ret){
		if(err){
			res.end("{}");
		}
		res.json(ret.map(function(m){
			return {
				id: m.approved,
				m : m.m,
				s : m.s
			};
		}));
		res.end();
	});
});

module.exports = router;
