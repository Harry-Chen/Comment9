const settings = require('../settings');
const mongoose = require('../utils/db');
const querystring = require('querystring');
const crypto = require('crypto');
const request = require('request-promise');
const debug = require('debug')('c9:models:wechat_users');

const wechatUserSchema = mongoose.Schema({
    nickname: String,
    headimgurl: String,
    openid: String,
    appid: String
});

class WeChatUserClass {
    static async getWeChatUser(wechatConfig, openid) {
        return await this.findOne({
            appid: wechatConfig.appid,
            openid
        });
    }

    static async setHeadImgUrl(wechatConfig, openid, url) {
        let user = await this.findOne({
            appid: wechatConfig.appid,
            openid
        });
        if (!user) {
            user = new this();
            user.openid = openid;
            user.appid = wechatConfig.appid;
        }
        user.headimgurl = url;
        await user.save();
        return user;
    }

    static async setNickname(wechatConfig, openid, nickname) {
        let user = await this.findOne({
            appid: wechatConfig.appid,
            openid
        });
        if (!user) {
            user = new this();
            user.openid = openid;
            user.appid = wechatConfig.appid;
        }
        user.nickname = nickname;
        await user.save();
        return user;
    }

    /*
    static getRedirectionUrl(wechatConfig) {
        const redirect_uri = `https://${settings.host}${settings.rootPath}/wechat`;
        const query = querystring.stringify({
            appid: wechatConfig.appid,
            redirect_uri,
            response_type: "code",
            scope: "snsapi_userinfo",
            state: crypto.randomBytes(10).toString('hex')
        });
        debug(redirect_uri);
        debug(query);
        return `https://open.weixin.qq.com/connect/oauth2/authorize?${query}#wechat_redirect`
    }

    static async callback(wechatConfig, code) {
        const result = await request({
            url: "https://api.weixin.qq.com/sns/oauth2/access_token?" + querystring.stringify({
                appid: wechatConfig.appid,
                secret: wechatConfig.appSecret,
                code,
                grant_type: "authorization_code"
            }),
            json: true
        });
        debug(result);
        const access_token = result.access_token;
        const openid = result.openid;
        const info = await request({
            url: "https://api.weixin.qq.com/sns/userinfo?" + querystring.stringify({
                access_token,
                openid,
                lang: "zh_CN"
            }),
            json: true
        });
        debug(info);
        let user = await this.findOne({
            openid,
            appid: wechatConfig.appid
        });
        if (!user) {
            user = new this();
            user.openid = openid;
            user.appid = wechatConfig.appid;
        }
        user.nickname = info.nickname;
        user.headimgurl = info.headimgurl;
        await user.save();
        return true;
    }
    */
}

wechatUserSchema.loadClass(WeChatUserClass);
const WeChatUser = mongoose.model('WeChatUser', wechatUserSchema);

module.exports = WeChatUser;