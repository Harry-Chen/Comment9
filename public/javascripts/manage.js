function populate($frm, data) {
    $.each(data, function(key, value){
        var $elem = $frm.find('[name='+key+']');
        if($elem.is("[type='checkbox']"))
            $elem.prop('checked',value);
        else
            $elem.val(value);
    });
}

function reloadActivities () {
    var $slt = $('#activitySelector');
    $slt.html('');
    $.getJSON('manage/activities', function(result){
        if(result.success){
            $.each(result.activities, function() {
                $slt.append($("<option />").val(this._id).text(this.name));
            });
            $slt.trigger('change');
        }
    });
}

function reloadActivityConfig (id) {
    $.getJSON('manage/activity/'+id+'/config', function(result){
        if(result.success){
            populate($('#configForm'), result.config);
        }
    });
}

function reloadUrls(id) {
    $.getJSON('manage/activity/'+id+'/urls', function(result){
        if(result.success){
            populate($('#urlForm'), result.urls);
        }
    });
}

$().ready(function(){

	reloadActivities();

    $('#logoutBtn').click(function(e){
        $.get('manage/logout', function(res){
            if(res.success)
                location.href='/';
        });
    });

    $('#newActivity').click(function(e){
        var name = prompt("活动名称", "xx届学生节");
        if(name != null){
            $.post('manage/activity/new', {name: name}, function(res){
                reloadActivities();
            });
        }
        e.preventDefault();
    });
    $('#deleteActivity').click(function(e){
        var ok = confirm("确认删除活动？");
        if(ok){
            var id=$('#activitySelector').val();
            $.post('manage/activity/'+id+'/delete', {}, function(res){
                reloadActivities();
            });
        }
        e.preventDefault();
    });
    $('#activitySelector').change(function(e){
        reloadActivityConfig(this.value);
        reloadUrls(this.value);
    });
    $('#configForm').submit(function(e){
        var id = $('#activitySelector').val();
        $.post('manage/activity/'+id+'/config', $(this).serialize(), function(res){
            if(res.success)
                reloadActivityConfig(id);
        }, 'json');
        e.preventDefault();
    });
    $('#urlForm').click(function(e){
        var $target = $(e.target);
        if($target.is('button')){
            var reset = $target.attr('data-reset');
            var id = $('#activitySelector').val();
            $.post('manage/activity/'+id+'/reset/'+reset, {}, function(res){
                if(res.success)
                    reloadUrls(id);
            }, 'json');
            e.preventDefault();
        }
    });
    $('#testCommentBtn').click(function(e){
        var testUrl = $('#testUrl').val();
        $.get(testUrl);
    });
    $('#manualCommentBtn').click(function(e){
        var content = $('#manualCommentContent').val();
        var newCommentApiUrl = $('#newCommentApiUrl').val();
        $.ajax({
          url:newCommentApiUrl,
          type:"POST",
          data: JSON.stringify({m:content}),
          contentType:"application/json; charset=utf-8",
          dataType:"json",
          success: function(){
          }
        });
    });
});
