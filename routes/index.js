var express = require('express');
var router = express.Router();
ClientQueue = require('../utils/clientQueue.js');
Settings = require('../settings.js');

var toProcess = [];
var messages = [];
var waitingClients = ClientQueue(Settings.longQueryTimeout);
var approved = [];

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});
router.post('/new', function(req, res){ 
	//接到请求，存入messages
	var id = messages.push(req.body.m) - 1;
	//取出等待的管理员，分配给他
	var c = waitingClients.getOne();
	if(c !== undefined){
		c.json({"id": id, "m": req.body.m});
		c.end();
	}else{ 
	//如果没人在等待，放入队列
		toProcess.push(id);
	}
	res.end();
});

router.get('/admin/fetch', function(req, res){ 
	//检查待处理队列，如果为空
	if(toProcess.length == 0){
		//将当前客户端放入等待队列
		waitingClients.enQueue(res);
	}else{
		var m = toProcess.shift();
		res.json({"id": m, "m": messages[m]});
		res.end();
	}
});

router.get('/admin/approve/:id', function(req, res){
	if(messages[parseInt(req.params.id)] !== undefined){
		approved.push(parseInt(req.params.id));
	}
	res.end();
});
router.get('/screen', function(req, res){
	var start = parseInt(req.query.s);
	var length = parseInt(req.query.l);
	res.json(approved.slice(start, start + length).map(function(id, i){
		return {
			"id": i + start,
			"m": messages[id],
		};
	}));
	res.end();
});

module.exports = router;
