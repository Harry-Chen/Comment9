$(window).load(function(){
	$('<link rel="stylesheet" type="text/css" href="stylesheets/fonts-chinese.css" />').appendTo("head").load(function(){
		waitForWebfonts(['PingHei','"Myriad Set Pro"'], function(){
			$("<style/>").text('body{font-family: "Consolas", "Myriad Set Pro", "Lucida Grande", "Microsoft Yahei", "PingHei", "Helvetica Neue", "Helvetica", "Arial", "Verdana", "sans-serif";}').appendTo("head");
			//console.log("hi");
		});
	})
	$('<link rel="stylesheet" type="text/css" href="app/special/custom.css?token='+getUrlParameter('token')+'" />').appendTo("head");
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
		var $newArticle = $("<div />").append($("<article />", {class: "item"})
			.append($("<div>", {
				class: "headImg",
				style: "background-image:url("
					+ (m.headImg || "http://burridgecenter.colorado.edu/html/images/conference/2017_conference/anonymous-head-shot.jpg")
					+ ")"
			}))
			.append($("<div />").text(m.m)))
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

});

