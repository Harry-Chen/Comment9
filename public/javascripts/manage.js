var activityId = null;

// 填充表单
function populate($frm, data) {
    $.each(data, function(key, value){
        var $elem = $frm.find('[name='+key+']');
        if($elem.is("[type='checkbox']"))
            $elem.prop('checked',value);
        else
            $elem.val(value);
    });
}

// 重载入活动列表,整理菜单
function reloadActivities () {
    var $slt = $('#activitySelector');
    $slt.html('');
    
    var $del = $('#activityDeleteSelector');
    $del.html('');

    reloadMenuLabel(null);
    
    $.getJSON('manage/activities', function(result){
        if(result.success){
            $.each(result.activities, function() {
                // 插入
                var $a = $("<a />").attr("href", "javascript:reload(\"" + this._id + "\", \"" + this.name + "\");void(0);")
                        .text(this.name);
                $slt.prepend($a);
                
                if(this._id == activityId)
                {
                        reloadMenuLabel(this.name);
                }
                
                // 删除
                var $b = $("<a />").attr("href", "javascript:deleteActivity(\"" + this._id + "\");void(0);")
                        .text("Delete: " + this.name);
                $del.prepend($b);
            });
            
            $slt.trigger('change');
            $del.trigger('change');
        }
    });
}


// 更改菜单标签.
function reloadMenuLabel(name)
{
    var $label = $('#activityMenuLabel');
    if(name != null)
    {
        $label.html(': ' + name);
    }
    else
    {
        $label.html('');
    }
    
    $label.trigger('change');
}

// 载入配置文件
// GET /manage/activity/xxxxxxxxxx/config
function reloadActivityConfig() {
    if(activityId != null)
    {
        $.getJSON('manage/activity/'　+　activityId　+　'/config', function(result){
            if(result.success){
                populate($('#configForm'), result.config);
            }
        });
    }
}

// 载入配置的 URL 
// GET /manage/activity/xxxxxxxxxx/config
function reloadUrls() {
    if(activityId != null)
    {
        $.getJSON('manage/activity/'　+　activityId　+　'/urls', function(result){
            if(result.success){
                populate($('#urlForm'), result.urls);
            }
        });
    }
}

function reloadBoard(){
    if(activityId != null)
    {
        $('#welcomeBoard').hide();
        $('#settingBoard').show();
    }
    else
    {
        $('#welcomeBoard').show();
        $('#settingBoard').hide();
    }    

}

// 整体重新载入
function reload(id, name) {
    activityId = id;
    
    reloadMenuLabel(name);
    reloadActivityConfig();
    reloadUrls();
    reloadBoard();
}

function deleteActivity(id) {
        var ok = confirm("确认删除活动？");
        if(ok){
            if(activityId == id) reload(null, null);
            $.post('manage/activity/'+id+'/delete', {}, function(res){
                reloadActivities();
            });
        }
        e.preventDefault();
}

function newActivity()
{
        var name = prompt("活动名称", "33届学生节");
        if(name != null){
            $.post('manage/activity/new', {name: name}, function(res){
                reloadActivities();
            });
        }
        e.preventDefault();
}

$().ready(function(){
    reload(null, null);
    reloadActivities();
    
    
    
    $('#keywordList').hide();

    $('#logoutBtn').click(function(e){
        $.get('manage/logout', function(res){
            if(res.success)
                location.href='/';
        });
    });

    $('#configForm').submit(function(e){
        var id = activityId;
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
                    var id = activityId;
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
        var id = activityId;
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
        var id = activityId;
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
        var id = activityId;
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
        var id = activityId;
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
        var id = activityId;
        $.get('manage/activity/'+id+'/wechat', function(result){
            if(result.success){
                populate($('#wechatSettings').show(), result.wechat);
            }
        });
        e.preventDefault();
    });
    
    $('#wechatSettings').submit(function(e){
        e.preventDefault();
        var id = activityId;
        var form = this;
        $.post('manage/activity/'+id+'/wechat', $(form).serialize(), function(result){
            if(result.success){
                $(form).hide();
            }
        }, 'json');
    });
});
