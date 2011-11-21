var App;

(function()
{
    App = {};

    /*
     Init
     */
    App.init = function()
    {
        App.datas = [];
        App.canvas = document.getElementById('whiteboard');
        App.canvas.height = 400;
        App.canvas.width = 800;
        document.getElementsByTagName('article')[0].appendChild(App.canvas);
        App.ctx = App.canvas.getContext("2d");
        App.ctx.fillStyle = "solid";
        App.ctx.strokeStyle = "#1C2CA3";
        App.ctx.lineWidth = 3;
        App.ctx.lineCap = "round";
        App.socket = io.connect('http://128.83.74.33:4001');

        App.socket.on('draw', function(data)
        {
            if(data == null)
                return;
            setParams(data.lineColor, data.lineWidth);
            return App.draw(data.x, data.y, data.type);
        });

        App.socket.emit('init', {
            uid : "test"
        });

        /**
         * Function that does the actual drawing on the canvas
         */
        App.draw = function(x, y, type)
        {
            var data = {};
            data.x = x;
            data.y = y;
            data.type = type;
            App.datas[App.datas.length] = data;

            if(type === "dragstart" || type === "touchstart") {
                App.ctx.beginPath();
                return App.ctx.moveTo(x, y);
            } else if(type === "drag" || type === "touchmove") {
                App.ctx.lineTo(x, y);
                return App.ctx.stroke();
            } else {
                return App.ctx.closePath();
            }
        };

        App.drawAll = function(datas)
        {
            ds = datas.datas;
            function xyz(d)
            {
                setTimeout(function()
                {
                    dd = d;
                    //console.log("Hello "+dd);
                    setParams(ds[dd].lineColor, ds[dd].lineWidth);
                    App.draw(ds[dd].x, ds[dd].y, ds[dd].type);
                }, d);
            }

            for(d in ds) {
                //console.log("Helloo "+d);
                // console.log(JSON.stringify(ds[d]));
                if(ds[d] === null) {
                    //console.log("Null");
                    continue;
                }
                xyz(d);

            }
        }

        App.socket.on('draw-many', App.drawAll);

        App.socket.on('clear', function(uid)
        {
            App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);
        });

        App.socket.on('madeVideo', function(uid)
        {
            console.log("Video!");
            $('#waitmessage').hide(500);
            $('#html5video').html('<!-- "Video For Everybody" http://camendesign.com/code/video_for_everybody -->' + '<video controls="controls" width="800" height="400">' + '<source src="test/test.mp4" type="video/mp4" />' + '<source src="test/test.webm" type="video/webm" />' + '<span title="No video playback capabilities, please download the video below">Your browser does not support HTML5!</span>' + '</video>' + '<p><strong>Download video:</strong> <a href="test/test.mp4">MP4 format</a> | <a href="test/test.webm">WebM format</a></p>');
        });

        App.socket.on('savedCanvas', function(uid)
        {
            $('#savedMessage').show(500);
            setTimeout(function()
            {
                $('#savedMessage').hide(500);
            }, 3000);
        })
    };
    /*
     * Utility functions
     */
    var drawAndSend = function(x, y, type, lineColor, lineWidth)
    {
        App.draw(x, y, type);
        App.socket.emit('drawClick', {
            x : x,
            y : y,
            type : type,
            lineColor : lineColor,
            lineWidth : lineWidth
        });
    }
    var setParams = function(lineColor, lineWidth)
    {
        App.ctx.strokeStyle = lineColor;
        App.ctx.lineWidth = lineWidth;
    }
    /*
     Draw Events
     */
    $('canvas').live('drag dragstart dragend', function(e)
    {
         var offset, type, x, y;
         type = e.handleObj.type;
         offset = $(this).offset();
         e.offsetX = e.layerX - offset.left;
         e.offsetY = e.layerY - offset.top;
         x = e.offsetX;
         y = e.offsetY;
         drawAndSend(x, y, type, App.ctx.strokeStyle, App.ctx.lineWidth);
    });

    $('canvas').live('touchstart touchmove touchend', function(e)
    {
        //console.log(e);
        e.preventDefault();
        type = e.handleObj.origType;
        f = e.originalEvent;
        //console.log(f.touches[0]);
        touch = f.touches[0];
        offset = $(this).offset();
        e.offsetX = touch.pageX - offset.left;
        e.offsetY = touch.pageY - offset.top;
        //alert(touch.clientX);
        x = e.offsetX;
        y = e.offsetY;
        drawAndSend(x, y, type, App.ctx.strokeStyle, App.ctx.lineWidth);
    });
    /**
     * Other user events
     */
    $('#clear').live('click', function()
    {
        App.socket.emit('clear', {
            uid : "test"
        });
        App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);
    });

    $('#eraser').live('click', function()
    {
        setParams("#ffffff", 10);
    });

    $('#bluepen').live('click', function()
    {
        setParams("#1C2CA3", 3);
    });

    $('#getVideo').live('click', function()
    {
        $('#waitmessage').show(500);
        $('#html5video').html('<img src="img/ajax-loader.gif" />');
        App.socket.emit('video', {
            uid : "test"
        });
    });

    $('#doSave').live('click', function()
    {
        App.socket.emit('saveCanvas', {
            uid : "test",
            canvasName : $("#saveName").val()
        });
        $("#saveNameDialog").modal('hide');
    });

    $('#cancelSave').live('click', function()
    {
        $("#saveNameDialog").modal('hide');
    });

    $('#fullScreen').live('click', function()
    {
        //$('#canvasDiv').css('height',100);
        //        document.getElementById('whiteboard').webkitEnterFullscreen();
        //console.log(JSON.stringify(App.datas));
        //console.log($(window).width());
        
        var oldCanvas = canvas.toDataURL("image/png");
        var img = new Image();
        img.src = oldCanvas;       
        App.canvas.height = $(window).height();
        App.canvas.width = $(window).width();
        App.ctx.restore();
        /*
        console.log("Done resizing canvas");
        console.log("Clearing canvas now");
        App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);
        console.log("Redrawing with data " + JSON.stringify(App.datas));
        App.drawAll(App.datas);*/
       /*
       App.ctx.save();
       App.ctx.scale(2,2);
       App.ctx.restore();*/
       //App.drawAll(App.datas);
    });
    /*
     * Initialize. Entry point.
     */
    $(function()
    {
        return App.init();
    });
}).call(this);

$(document).ready(function()
{
    $(".alert-message").alert();
});
