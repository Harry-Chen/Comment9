/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let WTF;
module.exports = (WTF = function(){
  if (!this instanceof WTF) {
      return new WTF();
    }
  this.queue = [];
  return this;
});
  
WTF.prototype.insert = function(key, value){
  return this.queue.push({key, value});
};
  
WTF.prototype.findAndRemove = function(key){
  for (let i = 0, end = this.queue.length - 1; i <= end; i++) {
    if (this.queue[i].key === key) {
      const v = this.queue[i].value;
      this.queue.splice(i, 1);
      return v;
    }
  }
  return undefined;
};
