$(window).load(function(){
	$('<link rel="stylesheet" type="text/css" href="style/fonts-chinese.css" />').appendTo("head").load(function(){
		waitForWebfonts(['PingHei','"Myriad Set Pro"'], function(){
			$("<style/>").text('body{font-family: "Consolas", "Myriad Set Pro", "Lucida Grande", "Microsoft Yahei", "PingHei", "Helvetica Neue", "Helvetica", "Arial", "Verdana", "sans-serif";}').appendTo("head");
			//console.log("hi");
		});
	})
	
});

function getUrlParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
} 
$().ready(function(){
	function addMessage(m){
		var $newArticle = $("<div />").append($("<article />").append($("<div />").text(m.m)))
									  .css("height", 0).prependTo(m.s?"#pinned":"#comments")
									  .animate({
			'height': "3em"
		},function(){
			var limit = 20;
			if (m.s) limit = 3;
			$(this).parent().children().filter("div:gt(" + limit + ")").remove();
			if(m.s){
				setTimeout(function(){
					$newArticle.animate({
						'height': 0
					},function(){
						$newArticle.remove();
					});
				},15000);
			}
		});
	};

	(function getFromTime(time){
		$.getJSON("app/screen?l=1&s=" + time + "&token=" + getUrlParameter('token'), null, function(data){
			if(data.length){
				addMessage(data[0]);
				time = data[0].id + 1;
			}
			
		}).always(function(){
			setTimeout(function(){
				getFromTime(time);
			},0);
		});
	})(Date.now() - 60 * 1000);
	$("body").keyup(function(e){
		if(e.keyCode == 70){
			$("body")[0].webkitRequestFullScreen(0);
		}
	});

	rolling_text = ["WiFi名称: Young/Young-5G",
					"WiFi密码: thisisit",
					'关注微信号"酒井资讯"，发送DM+弹幕内容',
					"发送短信DM+弹幕内容到13521508053"];
	id = 0;
	$("#rolling").text(rolling_text[id]);
	setInterval(function () {
		console.log(rolling_text[id]);
		$("#rolling").animate({'height':0}, function() {
			$("#rolling").text(rolling_text[id]);
			$("#rolling").animate({'height': '100%'});
		});
		id = (id + 1) % rolling_text.length;
	}, 10000);
});

