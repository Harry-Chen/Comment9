var paused = 0;
$(function getOne(){
	if(paused){
		setTimeout(getOne, 200 + Math.random() * 40 - 20);
	}else{
		$.getJSON("app/admin/fetch", null, function(data){
			$("#err").hide();
			if(data.id !== undefined){
				$("<tr />").append($("<td />").text(data.m))
						   .append($("<td />").text("approve").addClass("yes").click(function(e){
								var thisTr = $(this).parent().remove().appendTo("#toApprove");
								thisTr.children().unbind("click").slice(1).remove();
								//$("#toApproveContainer").scrollTop($("#toApprove").height() - $("#toApproveContainer").height());
								$.get("app/admin/approve/" + data.id + "?s=" + Number(e.metaKey), function(){
									thisTr.remove();
									thisTr = undefined;
								});
						   }))
						   .append($("<td />").text("drop").addClass("no").click(function(){
								$(this).parent().remove();
						   }))
						   .prependTo($("#main"));
				$(window).scrollTop(0);
				setTimeout(getOne, 50 + Math.random() * 40 - 20);
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
	$("body").keyup(function(e){
		if(e.keyCode == 32 || e.keyCode == 13){
			e.preventDefault();
			$("#main tr").eq(0).children().eq(1).click();
		}else if(e.keyCode == 27 || e.keyCode == 192){
			$("#main tr").eq(0).children().eq(2).click();
			e.preventDefault();
		}else if(e.keyCode == 80){
			paused = !paused;
			$("#mask").toggle();
			e.preventDefault();
		}
		$(window).scrollTop(0);
	});
});