$().ready(function(){

	$("#mainForm").submit(function(e){
		$.post("app/new", {m: $("#text").prop("value")}, "json");
		$("#text").prop("value", "");
		e.preventDefault();
	});

});