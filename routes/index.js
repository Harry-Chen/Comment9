var express = require('express');
var router = express.Router();
ClientQueue = require('../utils/clientQueue');
Settings = require('../settings');
var Message = require('../models/messages');
var counter = require('../models/uniqueCounter')
var Activity = require('../models/activities');
var messageFilter = require('../models/messageFilter');
var WTF = require('../utils/WTFTree');
var wechat = require('wechat');
const debug = require('debug')('c9:routes:index');
const WeChatAPI = require('wechat-api');
const fs = require('fs');
const util = require('util');
const WeChatUser = require('../models/wechat_users');

var toProcess = new WTF;
var waitingClients = ClientQueue(Settings.longQueryTimeout);
var waitingScreens = ClientQueue(Settings.longQueryTimeout);

function checkToken (type){
  return function(req, res, next) {
    var token = req.params.token || req.query.token;
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

function pushToScreens (approved, content, star, headImg, aid) {
  
  var screen, result = {
    id: approved,
    m: content,
    s: star,
    headImg
  };
  while((screen = waitingScreens.getOne(aid)) !== undefined){
    screen.json([result]);
    screen.end();
  }
}

function pushToAuditors (id, content, headImg, aid) {
  //取出等待的管理员，分配给他
  var c = waitingClients.getOne(aid);
  if(c !== undefined){
    c.json({"id": id, "m": content, headImg});
    c.end();
  }else{ 
    //如果没人在等待，放入队列
    toProcess.insert(aid, id);
  }
}

//接到请求，存入messages
function postOne(req, res, msg){
  if(!msg)
    return;
  counter("messages", function(err, id){
    if(err){
      console.error(err);
      res.status(500).end();
      return;
    }else{
      var msgObj = new Message({id: id, m: msg.m, headImg: msg.headImg, activity: req.activity.getId()});
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
            pushToAuditors(newM.id, newM.m, newM.headImg, req.activity.getId());
          }else if(newM.approved > 0){
            pushToScreens(newM.approved, newM.m, false, newM.headImg,req.activity.getId());
          }
        }
      });
    }
  });
};

router.all('/wechat/comment/:token', checkToken('sending'), function(req, res, next){
  const wechatConfig = req.activity.getWechatConfig();
  var middleware = wechat(wechatConfig, function (req, res, next) {
    // 微信输入信息都在req.weixin上
    var message = req.weixin;
    debug("Got wechat message %o", message);
    if (message.MsgType == "text") {
      var content = '';
      try{
        content =  message.Content.toString();
      }catch(e){
      }
      if (/^[Dd][Mm]/.test(content)) {
        debug("Sending danmaku %s", content.substr(2));
        postOne(req, res, { m: content.substr(2) });
        res.reply('弹幕发送成功');
      } else if(/^[Ss][Qq]/.test(content)){
        debug("Sending wall %s", content.substr(2));
        (async () => {
          const user_info = await WeChatUser.getWeChatUser(wechatConfig, message.FromUserName);
          debug(user_info);
          if (!user_info) {
            res.reply(`请先发送头像照片到公众号`);
          } else {
            postOne(req, res, { m: content.substr(2), headImg: user_info.headimgurl });
            res.reply('上墙发送成功');
          }
        })().catch((err) => {
          debug(err);
          res.reply('上墙发送失败, 请稍后再试');
        });
      }else{
        res.reply();
      }
    } else if (message.MsgType == "image") {
      WeChatUser.setHeadImgUrl(wechatConfig, message.FromUserName, message.PicUrl).then(() => {
        res.reply("头像设置成功");
      }).catch((err) => {
          debug(err);
          res.reply('头像设置失败, 请稍后再试');
      });
    } else {
      res.reply("不支持此类消息");
    }
  });
  return middleware(req, res, next);
});

router.post('/new', checkToken('sending'), function(req, res){ 
	if(Array.isArray(req.body)){
    for (var i = 0; i < req.body.length; i++) {
      postOne(req, res, req.body[i]);
    };
	}else{
		postOne(req, res, req.body);
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
          m: ret[0].m,
          headImg: ret[0].headImg
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
          pushToScreens(m.approved, m.m, m.s, m.headImg, req.activity.getId());
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
          s: m.s,
          headImg: m.headImg
        };
      }));
      res.end();
    }
  });
});
router.get('/special/custom.css', checkToken('screen'), function(req, res){
  res.set('Access-Control-Allow-Origin', '*');
  res.header("Content-Type", "text/css");
  res.end(req.activity.getCustomCSS());
});

module.exports = router;
