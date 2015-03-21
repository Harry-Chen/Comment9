var paused = 0;
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
$(function getOne(){
	if(paused){
		setTimeout(getOne, 200 + Math.random() * 40 - 20);
	}else{
		$.getJSON("app/admin/fetch?token="+getUrlParameter('token'), null, function(data){
			$("#err").hide();
			if(data.id !== undefined){
				$("<tr />").append($("<td />").text(data.m))
						   .append($("<td />").text("approve").addClass("yes").click(function(e,shiftKey){
								var thisTr = $(this).parent().remove().appendTo("#toApprove");
								thisTr.children().unbind("click").slice(1).remove();
								//$("#toApproveContainer").scrollTop($("#toApprove").height() - $("#toApproveContainer").height());
								$.get("app/admin/approve/" + data.id + "?s=" + Number(shiftKey || e.shiftKey) + "&token=" + getUrlParameter('token'), function(){
									thisTr.remove();
									thisTr = undefined;
								});
						   }))
						   .append($("<td />").text("drop").addClass("no").click(function(){
								$(this).parent().remove();
						   }))
						   .prependTo($("#main"));
				$(window).scrollTop(0);
				setTimeout(getOne, Math.random() * 10);
			}else{
				setTimeout(getOne, 0);
			}
		}).fail(function(){
			$("#err").show();
			setTimeout(getOne, 0);
		});
	}
});
$(function(){
	$("body").keypress(function(e){
		//console.log("press: " + e.which);
		if(e.keyCode == 32 || e.keyCode == 13){
			e.preventDefault();
			$("#main tr").eq(0).children().eq(1).trigger('click', e.shiftKey);
		}else if(e.keyCode == 27 || e.keyCode == 8){
			$("#main tr").eq(0).children().eq(2).click();
			e.preventDefault();
		}else if(e.keyCode == 116){
			
			$.get("app/admin/test");
			
			e.preventDefault();
		}
		$(window).scrollTop(0);
	});
	$("body").keydown(function(e){
	
		//console.log("down: " + e.which);
		if(e.keyCode == 16){
			$(".yes").addClass('star');
		}
	});
	$("body").keyup(function(e){
		//console.log("up: " + e.which);
		if(e.keyCode == 16){
			$(".yes").removeClass('star');
		}else if(e.keyCode == 80){
			paused = !paused;
			$("#mask").toggle();
			e.preventDefault();
		}else if(e.keyCode == 70){
			$("body")[0].webkitRequestFullScreen(0);
		}
	});
	document.body.onwebkitfullscreenerror=function(){console.log(arguments)};
});