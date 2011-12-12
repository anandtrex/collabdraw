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
        App.canvas.height = 550;
        App.canvas.width = 920;
        document.getElementsByTagName('article')[0].appendChild(App.canvas);
        App.ctx = App.canvas.getContext("2d");
        App.ctx.fillStyle = "solid";
        App.ctx.strokeStyle = "#1C2CA3";
        App.ctx.lineWidth = 3;
        App.ctx.lineCap = "round";
        App.socket = io.connect('http://128.83.74.33:4001');
        
        App.singlePath = [];

        App.socket.emit('init', {
            uid : "test",
            roomName: "one",
        });
        
        App.roomName = "one";

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
            App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);
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
        
        App.socket.on('draw', function(input)
        {
            // console.log("Input: "+JSON.stringify(input));
            var sPath = input.singlePath;
            // console.log("Single Path: "+JSON.stringify(sPath));
            var data = {};
            for(d in sPath){
                data = sPath[d];
                // console.log("This is a data"+JSON.stringify(sPath[d]));
                if(data == null)
                    continue;
                setParams(data.lineColor, data.lineWidth);
                App.draw(data.x, data.y, data.type);
            }
            return;
        });

        App.socket.on('draw-many', App.drawAll);

        App.socket.on('clear', function(uid)
        {
            App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);
        });

        App.socket.on('madeVideo', function(uid)
        {
            //console.log("Video!");
            $('#waitmessage').hide(0);
            $('#saveVideo').show(0);
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
        //console.log("In draw and snd");
        App.draw(x, y, type);
        
        if(type === "dragstart" || type === "touchstart"){
            App.singlePath = [];
        }
        // Append data to the array
        App.singlePath.push({
            x : x,
            y : y,
            type : type,
            lineColor : lineColor,
            lineWidth : lineWidth
        });
        
        if(type === "dragend" || type === "touchend" || App.singlePath.length > 1) {
            //console.log("Sending path");
            //App.singlePath[2].type="drag";
            //App.singlePath[App.singlePath.length-1].type="dragend";
            var lastPoint = App.singlePath[App.singlePath.length-1];
            App.socket.emit('drawClick', {
                singlePath : App.singlePath,
            });
            // console.log("This the singlePath array being sent: " + JSON.stringify(App.singlePath));
            App.singlePath = [];
            //App.singlePath.push(lastPoint);
            //App.singlePath.push(lastPoint);
            //App.singlePath[0].type="dragstart";
            //App.singlePath[1].type="drag";
        }
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

        type = e.handleObj.origType;
        f = e.originalEvent;
        if(f.touches.length <= 1) {
            e.preventDefault();
            touch = f.touches[0];
            
            if(touch) {
                offset = $(this).offset();
                e.offsetX = touch.pageX - offset.left;
                e.offsetY = touch.pageY - offset.top;
                x = e.offsetX;
                y = e.offsetY;
            }
            else {
                x = null;
                y = null;
            }

            drawAndSend(x, y, type, App.ctx.strokeStyle, App.ctx.lineWidth);
            return false;
        } else {
            return true;
        }

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
        $('#waitmessage').show(0);
        $('#html5video').html('<img src="img/ajax-loader.gif" />');
        App.socket.emit('video', {
            uid : "test"
        });
        App.socket.on('message', function(data){
            alert(data.message);
            $('#html5video').html("");
            $('#waitmessage').hide(0);
        });
    });

    $('#save').live('click', function()
    {
        App.socket.emit('saveCanvas', {
            uid : "test",
            canvasName : App.roomName
        });
    });

    $('#join').live('click', function(){
        $("#joinRoom").val(App.roomName);
    });

    $('#doJoin').live('click', function()
    {
        //console.log("Joining room "+$("#joinRoom").val());
        App.socket.emit('init', {
            uid : "test",
            roomName : $("#joinRoom").val()
        });
        App.roomName = $("#joinRoom").val();
        $("#joinRoomDialog").modal('hide');
    });

    $('#cancelJoin').live('click', function()
    {
        $("#joinRoomDialog").modal('hide');
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
