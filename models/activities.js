var settings = require('../settings');
var mongoose = require('../utils/db');
var crypto   = require("crypto")

var activitySchema = mongoose.Schema({
    name: String,
    owner: {type: Number, index: true },
    created: { type: Date, default: Date.now },
    config: {
    	enableLenLimit: {type: Boolean, default: false},
    	lenLimit: {type: Number, default: 30},
    	enableKeywordFilter: {type: Boolean, default: false},
    	enableAudit: {type: Boolean, default: false},
        wechatParams: {
            wechatToken: String,
            wechatAppid: String,
            wechatAppSecret: String,
            wechatAESKey: String,
        },
        customCSS: {type: String, default: ''},
    },
    tokens: {
    	screenToken: { type: String, index: true, unique: true},
    	sendingToken: { type: String, index: true, unique: true},
    	auditToken: { type: String, index: true, unique: true},
    },
    forbiddenWordList: [String],
});

activitySchema.statics.genToken = genToken = function () {
	hash = crypto.createHash("sha1")
	hash.update(crypto.randomBytes(32))
	hash.update("t"+(new Date().getTime()))
	return hash.digest('hex')
}

activitySchema.methods.getWechatConfig = function(){
    //structure defined by wechat module
    return {
        token: this.config.wechatParams.wechatToken,
        appid: this.config.wechatParams.wechatAppid,
        appsecret: this.config.wechatParams.wechatAppSecret,
        encodingAESKey: this.config.wechatParams.wechatAESKey
    };
}

activitySchema.methods.updateConfig = function(config, callback){
    var _this = this;
    _this.config.enableLenLimit = (config.enableLenLimit === "on");
    _this.config.lenLimit = config.lenLimit;
    _this.config.enableKeywordFilter = (config.enableKeywordFilter === "on");
    _this.config.enableAudit = (config.enableAudit === "on");
    _this.save(callback);
};

activitySchema.methods.updateWechatConfig = function(config, callback){
    var _this = this;
    _this.config.wechatParams.wechatToken = config.wechatToken;
    _this.config.wechatParams.wechatAppid = config.wechatAppid;
    _this.config.wechatParams.wechatAppSecret = config.wechatAppSecret;
    _this.config.wechatParams.wechatAESKey = config.wechatAESKey;
    _this.save(callback);
};

activitySchema.methods.updateForbiddenWords = function(words, callback){
    var _this = this;
    _this.forbiddenWordList = words;
    _this.save(callback);
};

activitySchema.methods.isManualAudit = function(){
    return this.config.enableAudit;
}

activitySchema.methods.getId = function(){
    return this._id.toString();
}

activitySchema.methods.getEnabledFilters = function(lenFilter, keywordFilter){
    var enabled = [];
    var _this = this;
    if(_this.config.enableLenLimit){
        enabled.push(function(content){
            return lenFilter(content, _this.config.lenLimit);
        });
    }
    if(_this.config.enableKeywordFilter){
        enabled.push(function(content){
            return keywordFilter(content, _this.forbiddenWordList);
        });
    }
    return enabled;
}

activitySchema.methods.getCustomCSS = function(){
    return this.config.customCSS;
}

activitySchema.methods.updateCustomCSS = function(css,callback){
    var _this = this;
    _this.config.customCSS = css;
    _this.save(callback);
}

activitySchema.statics.createActivity = function(owner, name, callback){
	if(!callback){
		callback = function(){};
	}
	var _this=this,
		item = new Activity({name: name, owner: owner});
	item.tokens.screenToken = genToken();
	item.tokens.sendingToken = genToken();
	item.tokens.auditToken = genToken();
	item.save(function(err){
		console.log(err);
		callback(err, item._id);
	});
}

activitySchema.statics.findByOwner = function(owner, callback){
	if(!callback){
		return;
	}
	Activity.find({owner: owner}, '_id name', callback);
}

activitySchema.statics.deleteById = function(id, callback){
	if(!callback){
		callback = function(){};
	}
	Activity.findOneAndRemove({_id: id}, callback);
}

activitySchema.statics.getActivity = function(id, callback){
	if(!callback)
		return;
	Activity.findOne({_id: id}, callback);
}

activitySchema.statics.getActivityIdByToken = function(type, token, callback){
	var field = null;
	switch(type){
	case "audit":
		field='tokens.auditToken';
		break;	
	case "screen":
		field='tokens.screenToken';
		break;
	case "sending":
		field='tokens.sendingToken';
		break;
	}
	if(!callback||!field)
		return;
	var query = {};
	query[field] = token;
	Activity.findOne(query, callback);
}

var Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
