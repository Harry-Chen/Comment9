var express = require('express');
var router = express.Router();
var settings = require('../settings.js');
var Activity = require('../models/activities.js');
var User = require('../models/users.js');

function checkAuth(req, res, next) {
  if (!req.session.manage_user_id) {
    res.status(403).end();

  } else {
    next();
  }
}

function getActivity (req, res, next) {
	Activity.getActivity(req.params.id, function(err, activity){
		if(err){
			res.status(500).end();
		}else if(!activity){
			res.json({success: false, reason: 'activity not exist'});
			res.end();
		}else if(activity.owner != req.session.manage_user_id){
			res.json({success: false, reason: 'permission denied'});
			res.end();
		}else{
			req.activityObj = activity;
			next();
		}
	})
}

router.post('/login', function(req, res){ 
	var post = req.body;
	User.userLogin(post.user, post.password, function(err, success, uid){
		if(err){
			res.status(500).end();
		}
		else if(!success){
			res.json({success: false, reason: 'wrong user/password'});
		}
		else{
			req.session.manage_user_id = uid;
			res.json({success: true});
		}
	});
});

router.post('/reg', function(req, res){ 
	var post = req.body;
	if (post.user && post.password && /\w+/.test(post.user)) {
		User.createUser(post.user, post.password, function(err, uid){
			res.json({success: err==null});
		});
	} else {
		res.json({success: false, reason: 'invalid user/password'});
	}
});

router.get('/logout', function (req, res) {
	delete req.session.manage_user_id;
	res.json({success: true});
}); 

router.get('/activities', checkAuth, function(req, res){
	Activity.findByOwner(req.session.manage_user_id, function(err, data){
		if(err)
			res.json({success: false, reason: 'unknown'});
		else
			res.json({success: true, activities: data});
	})
});

router.post('/activity/new', checkAuth, function(req, res){
	var post = req.body;
	if(!post.name)
		res.json({success: false, reason: 'wrong name'});
	else{
		Activity.createActivity(req.session.manage_user_id, post.name, function(err, _id){
			res.json({success: !err});
		});
	}
});

router.post('/activity/:id/delete', checkAuth, getActivity, function(req, res){
	req.activityObj.remove(function(err){
		res.json({success: !err});
	})
});

router.get('/activity/:id/config', checkAuth, getActivity, function(req, res){
	res.json({success: true, config: req.activityObj.config, tokens: req.activityObj.tokens});
});

router.post('/activity/:id/config', checkAuth, getActivity, function(req, res){
	req.activityObj.updateConfig(req.body, function(err){
		res.json({success: !err});
	});
});

router.get('/activity/:id/wechat', checkAuth, getActivity, function(req, res){
	res.json({success: true, wechat: req.activityObj.config.wechatParams});
});

router.post('/activity/:id/wechat', checkAuth, getActivity, function(req, res){
	req.activityObj.updateWechatConfig(req.body, function(err){
		res.json({success: !err});
	});
});

router.get('/activity/:id/forbidden', checkAuth, getActivity, function(req, res){
	res.json({success: true, forbidden: req.activityObj.forbiddenWordList});
});

router.post('/activity/:id/forbidden', checkAuth, getActivity, function(req, res){
	req.activityObj.updateForbiddenWords(req.body, function(err){
		res.json({success: !err});
	});
});

router.get('/activity/:id/urls', checkAuth, getActivity, function(req, res){
	var base = req.protocol + '://' + req.get('host');
	var urls={
		scrUrl: base+"/app/screen?token=" + req.activityObj.tokens.screenToken,
		wallUrl: base+"/wall.html?token=" + req.activityObj.tokens.screenToken,
		auditUrl: base+"/admin.html?token=" + req.activityObj.tokens.auditToken,
		testUrl: base+"/app/admin/test?token=" + req.activityObj.tokens.auditToken,
		newCommentApiUrl: base+"/app/new?token=" + req.activityObj.tokens.sendingToken,
		wechatSvrUrl: base+"/app/wechat/comment/" + req.activityObj.tokens.sendingToken,
		screenToken: req.activityObj.tokens.screenToken,
	};
	res.json({success: true, urls: urls});
});

router.post('/activity/:id/reset/:type', checkAuth, getActivity, function(req, res){
	switch(req.params.type){
	case "audit":
		req.activityObj.tokens.auditToken = Activity.genToken();
		break;	
	case "screen":
		req.activityObj.tokens.screenToken = Activity.genToken();
		break;
	case "sending":
		req.activityObj.tokens.sendingToken = Activity.genToken();
		break;
	default:
		res.json({success: false, reason: "unknown type"});
		return;
	}
	req.activityObj.save(function(err){
		res.json({success: !err});
	});
});


module.exports = router;
