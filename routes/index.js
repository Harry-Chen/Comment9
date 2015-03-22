var express = require('express');
var router = express.Router();
ClientQueue = require('../utils/clientQueue');
Settings = require('../settings');
var Message = require('../models/messages');
var counter = require('../models/uniqueCounter')
var Activity = require('../models/activities');
var messageFilter = require('../models/messageFilter');
var WTF = require('../utils/WTFTree');

var toProcess = new WTF;
var waitingClients = ClientQueue(Settings.longQueryTimeout);
var waitingScreens = ClientQueue(Settings.longQueryTimeout);

function checkToken (type){
  return function(req, res, next) {
    var token = req.query.token;
    if(!token){
        res.status(403).end();
        return;
    }
    Activity.getActivityIdByToken(type, token, function(err, activity){
      if(err){
          res.status(500).end();
      }else if(!activity){
          res.status(403).end();
      }else{
        req.activity = activity;
        next();
      }
    });
  }
}

function pushToScreens (approved, content, star, aid) {
  
  var screen, result = {
    id: approved,
    m: content,
    s: star
  };
  while((screen = waitingScreens.getOne(aid)) !== undefined){
    screen.json([result]);
    screen.end();
  }
}

function pushToAuditors (id, content, aid) {
  //取出等待的管理员，分配给他
  var c = waitingClients.getOne(aid);
  if(c !== undefined){
    c.json({"id": id, "m": content});
    c.end();
  }else{ 
    //如果没人在等待，放入队列
    toProcess.insert(aid, id);
  }
}

router.post('/new', checkToken('sending'), function(req, res){ 
	//接到请求，存入messages
	//var id = messages.push(req.body.m) - 1;
	function postOne(msg){
		counter("messages", function(err, id){
			if(err){
				console.error(err);
				res.status(500).end();
				return;
			}else{
				var msgObj = new Message({id: id, m: msg.m, activity: req.activity.getId()});
				//对消息应用自动过滤器
				var state = messageFilter.filter(req.activity, msgObj.m);
				if(state < 0)
					msgObj.approved = state; //被自动屏蔽
				else if(!req.activity.isManualAudit())
					msgObj.approved = Date.now(); //无人工审核则自动设置为通过
				else
					msgObj.approved = 0;
				msgObj.save(function(err, newM){
					if(err){
						console.error(err);
						res.status(500).end();
						return;
					}else{
						res.end();
						//需要人工审核
						if(newM.approved == 0){
							pushToAuditors(newM.id, newM.m, req.activity.getId());
						}else if(newM.approved > 0){
							pushToScreens(newM.approved, newM.m, false, req.activity.getId());
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
});

router.get('/admin/fetch', checkToken('audit'), function(req, res){
  var mid = toProcess.findAndRemove(req.activity.getId());
  //检查待处理队列，如果为空
  if(mid === undefined){
    //将当前客户端放入等待队列
    waitingClients.enQueue(req.activity.getId(), res);
  }else{
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

router.get('/admin/approve/:id', checkToken('audit'), function(req, res){
  Message.approveById(parseInt(req.params.id), !!parseInt(req.query.s), req.activity.getId(), function(err){
    if(err){
      console.err(err);
    }else{
      Message.findOne({id: parseInt(req.params.id)}, function(err, m){
        if(err){
          console.error(err);
        }else{
          pushToScreens(m.approved, m.m, m.s, req.activity.getId());
        }
      });
    }
  });
  res.end();
  /*setTimeout(function(){
    res.end();
  },3000);*/
});
router.get('/admin/test', checkToken('audit'), function(req, res){
  res.end();
  pushToScreens(Date.now(), "弹幕试机" + Date.now(), false, req.activity.getId());
});
router.get('/screen', checkToken('screen'), function(req, res){
  res.set('Access-Control-Allow-Origin', '*');
  var start = parseInt(req.query.s);
  var length = parseInt(req.query.l);
  if(length > 20){
    length = 20;
  }
  Message.find({
    approved: {$gte: start},
    activity: req.activity.getId(),
  }, null, {
    limit: length,
  },function(err, ret){
    if(err){
      res.end("{}");
      return;
    }
    if(ret.length == 0){
      waitingScreens.enQueue(req.activity.getId(), res);
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
