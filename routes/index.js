var express = require('express');
var router = express.Router();
ClientQueue = require('../utils/clientQueue.js');
Settings = require('../settings.js');
var Message = require('../models/messages.js');

var toProcess = [];
var waitingClients = ClientQueue(Settings.longQueryTimeout);
var approved = [];

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});
router.post('/new', function(req, res){ 
	//接到请求，存入messages
	//var id = messages.push(req.body.m) - 1;
	var m = new Message({m: req.body.m});
	m.save(function(err, newM){
		if(err){
			console.log("Error:");
			console.log(err);
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
	res.end();
});

router.get('/admin/fetch', function(req, res){
	//检查待处理队列，如果为空
	if(toProcess.length == 0){
		//将当前客户端放入等待队列
		waitingClients.enQueue(res);
	}else{
		var mid = toProcess.shift();
		/*
		res.json({"id": m, "m": messages[m]});
		*/
		Message.get({id: mid}, function(err, ret){
			var result;
			if(err || ret.length == 0){
				console.log("Error:");
				console.log(err);
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
	//if(messages[parseInt(req.params.id)] !== undefined){
	Message.get({id: parseInt(req.params.id)}, function(err, ret){
		//console.log(ret);
		ret.map(function(m){
			m.approve(console.log);
		});
	});
	res.end();
});
router.get('/screen', function(req, res){
	var start = parseInt(req.query.s);
	var length = parseInt(req.query.l);
	/*res.json(approved.slice(start, start + length).map(function(id, i){
		return {
			"id": i + start,
			"m": messages[id],
		};
	}));*/
	Message.get({
		id: {$gte: start},
		approved: true
	}, function(err, ret){
		if(err){
			res.end("{}");
		}
		res.json(ret.map(function(m){
			return {
				id: m.id,
				m : m.m
			};
		}));
		res.end();
	}, length);
});

module.exports = router;
