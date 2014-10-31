module.exports=function(timeout){
	var queue = [];
	return {
		enQueue: function(client){
			queue.push({
				"res":client,
				"timer":setTimeout(function(){
					client.json({});
					client.end();
				}, timeout)
			});
		},
		getOne: function(){
			var cli = undefined;
			while((c = queue.shift()) !== undefined){
				if(!c.res.finished){
					cli = c.res;
					clearTimeout(c.timer);
					break;
				}
			}
			return cli;
		}
	};
};