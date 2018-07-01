/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const WTF = require('./WTFTree');
module.exports = function(timeout){
  const queue = new WTF();
  return {
    enQueue(aid, client){
      return queue.insert(aid, { 
        res: client,
        aid,
        timer: setTimeout(function(){
          client.json({});
          client.end();
          return queue.findAndRemove(aid);
        }
        , timeout)
      }
      );
    },
    getOne(aid){
      const value = queue.findAndRemove(aid);
      if (value != null) {
        clearTimeout(value.timer);
        return value.res;
      } else {
        return undefined;
      }
    }
  };
};
