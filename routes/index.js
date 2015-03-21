var express = require('express');
var router = express.Router();
ClientQueue = require('../utils/clientQueue');
Settings = require('../settings');
var Message = require('../models/messages');
var counter = require('../models/uniqueCounter')
var Activity = require('../models/activities');
var messageFilter = require('../models/messageFilter');

var toProcess = [];
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
        req.activityId = activity._id;
        next();
      }
    });
  }
}

function pushToScreens (approved, content, star) {
  
  var screen, result = {
    id: approved,
    m: content,
    s: star
  };
  while((screen = waitingScreens.getOne()) !== undefined){
    screen.json([result]);
    screen.end();
  }
}

function pushToAuditors (id, content) {
  //取出等待的管理员，分配给他
  var c = waitingClients.getOne();
  if(c !== undefined){
    c.json({"id": id, "m": content});
    c.end();
  }else{ 
    //如果没人在等待，放入队列
    toProcess.push(id);
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
        var m = new Message({id: id, m: msg.m, activity: req.activityId});
        //对消息应用自动过滤器
        var state = messageFilter.filter(req.activityId, msg.m);
        if(state < 0)
          m.approved = state; //被自动屏蔽
        else if(!Activity.isManualAudit(req.activityId))
          m.approved = Date.now(); //无人工审核则自动设置为通过
        else
          m.approved = 0;
        m.save(function(err, newM){
          if(err){
            console.error(err);
            res.status(500).end();
            return;
          }else{
            res.end();
            //需要人工审核
            if(newM.approved == 0){
              pushToAuditors(newM.id, newM.m);
            }else if(newM.approved > 0){
              pushToScreens(newM.approved, newM.m, false);
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

router.get('/admin/approve/:id', checkToken('audit'), function(req, res){
  Message.approveById(parseInt(req.params.id), !!parseInt(req.query.s), function(err){
    if(err){
      console.err(err);
    }else{
      Message.findOne({id: parseInt(req.params.id)}, function(err, m){
        if(err){
          console.error(err);
        }else{
          pushToScreens(m.approved, m.m, m.s);
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
  pushToScreens(Date.now(), "弹幕试机" + Date.now(), false);
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
