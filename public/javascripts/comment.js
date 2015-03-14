$().ready(function(){

	$("#mgrLoginForm").submit(function(e){
		$.post("manage/login", $(this).serialize(), function(res){
            if(res.success)
                location.href="manage.html";
            else
                alert(res.reason);
        }, "json");
		e.preventDefault();
	});

});