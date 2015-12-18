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
				var $buttonAccept = $("<a />").attr("href", "#").text("Approve").addClass("btn btn-default btn-success");
				var $buttonReject = $("<a />").attr("href", "#").text("Drop").addClass("btn btn-default btn-danger");
				
				$buttonAccept.click(function(e,shiftKey){
					var thisTr = $(this).parent().parent().parent().remove().appendTo("#toApprove");
					thisTr.children().unbind("click").slice(1).remove();
					//$("#toApproveContainer").scrollTop($("#toApprove").height() - $("#toApproveContainer").height());
								
					$.get("app/admin/approve/" + data.id + "?s=" + Number(shiftKey || e.shiftKey) + "&token=" + getUrlParameter('token'), function(){
						thisTr.remove();
						thisTr = undefined;
					});
				});
				
				$buttonReject.click(function(){
					$(this).parent().parent().parent().remove();
				});

				var $label = $("<label />").addClass("col-sm-7").text(data.m);
				var $spanButton = $("<span />").addClass("btn-group btn-group-justified").wrapInner($buttonAccept);
				$spanButton.append($buttonReject)
				
				var $divButton = $("<div />").addClass("col-sm-4").wrapInner($spanButton);

				var $div = $("<div />").addClass("form-group").wrapInner($label)
				$div.append($divButton);
				
				$div.appendTo($("#main"));
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
		console.log("press: " + e.which);
		if(e.keyCode == 32 || e.keyCode == 13){
			e.preventDefault();
			$("#main div").eq(0).children().eq(1).children().eq(0).children().eq(0).trigger('click', e.shiftKey);
		}else if(e.keyCode == 27 || e.keyCode == 8 || e.keyCode == 100){
			$("#main div").eq(0).children().eq(1).children().eq(0).children().eq(1).click();
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
			$(".btn-success").removeClass("btn-success").addClass('btn btn-warning');
		}
	});
	$("body").keyup(function(e){
		//console.log("up: " + e.which);
		if(e.keyCode == 16){
			$(".btn-warning").removeClass("btn-warning").addClass('btn btn-success');
		}else if(e.keyCode == 80){
			paused = !paused;
			$("#mask").toggle();
			e.preventDefault();
		}else if(e.keyCode == 70){
			$("body")[0].webkitRequestFullscreen(0);
		}
	});
	document.body.onwebkitfullscreenerror=function(){console.log(arguments)};
});
