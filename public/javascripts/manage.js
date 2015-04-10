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
            if(reset){
                var ok = confirm("重置后原URL将失效，确认吗？");
                if(ok){
                    var id = $('#activitySelector').val();
                    $.post('manage/activity/'+id+'/reset/'+reset, {}, function(res){
                        if(res.success)
                            reloadUrls(id);
                    }, 'json');
                }
            }
            var qrcode = $target.attr('data-qrcode');
            if(qrcode){
                var url = $('#newCommentApiUrl').val();
                window.open('qrcode.html?'+encodeURIComponent(url),'_blank','menubar=0,toolbar=0,width=300');
            }
            e.preventDefault();
        }
    });
    $('#openKeywordList').click(function(e){
        var id = $('#activitySelector').val();
        $.get('manage/activity/'+id+'/forbidden', function(result){
            if(result.success){
                $('#keywordList').show().find('textarea').val(result.forbidden.join('\r\n'));
            }
        });
        e.preventDefault();
    });
    $('#keywordList').submit(function(e){
        e.preventDefault();
        var form = this;
        var id = $('#activitySelector').val();
        var words = $(form).find('textarea').val().split(/\r?\n/);
        words = words.map(function(ele){
          return ele.trim();
        });
        words = words.filter(function(ele){
          return ele.length>0;
        });
        $.ajax({
          url:'manage/activity/'+id+'/forbidden',
          type:"POST",
          data: JSON.stringify(words),
          contentType:"application/json; charset=utf-8",
          dataType:"json",
          success: function(result){
            if(result.success){
              $(form).hide();
            }
          }
        });
    });
    $('#openCustomCSS').click(function(e){
        var id = $('#activitySelector').val();
        $.get('manage/activity/'+id+'/customcss', function(result){
            if(result.success){
                populate($('#customCSS').show(), result);
            }
        });
        e.preventDefault();
    });
    $('#customCSS').submit(function(e){
        e.preventDefault();
        var form = this;
        var id = $('#activitySelector').val();
        var css = $(form).find('textarea').val();
        $.ajax({
          url:'manage/activity/'+id+'/customcss',
          type:"POST",
          data: JSON.stringify({css: css}),
          contentType:"application/json; charset=utf-8",
          dataType:"json",
          success: function(result){
            if(result.success){
              $(form).hide();
            }
          }
        });
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
    $('#openWechatSettings').click(function(e){
        var id = $('#activitySelector').val();
        $.get('manage/activity/'+id+'/wechat', function(result){
            if(result.success){
                populate($('#wechatSettings').show(), result.wechat);
            }
        });
        e.preventDefault();
    });
    $('#wechatSettings').submit(function(e){
        e.preventDefault();
        var id = $('#activitySelector').val();
        var form = this;
        $.post('manage/activity/'+id+'/wechat', $(form).serialize(), function(result){
            if(result.success){
                $(form).hide();
            }
        }, 'json');
    });
});
