(function() {
    var App;
    App = {};
    /*
     Init
     */
    App.init = function() {
        // App.canvas = document.createElement('canvas');
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
        App.socket.on('draw', function(data) {
            return App.draw(data.x, data.y, data.type);
        });
        App.socket.emit('init', {
            uid: "test"
        });
        App.draw = function(x, y, type) {
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
        App.socket.on('draw-many', function(datas){
           //console.log(JSON.stringify(datas.datas));
           // console.log("Sup"); 
           ds = datas.datas;
           // console.log(JSON.stringify(ds));
           for(d in ds){
               // console.log(JSON.stringify(ds[d]));
               // console.log("Drawing:"+ds[d].x+":"+ds[d].y+":"+ds[d].type);
               App.draw(ds[d].x, ds[d].y, ds[d].type);
           }
        });
    };
    /*
     Draw Events
     */
    $('canvas').live('drag dragstart dragend', function(e) {
        var offset, type, x, y;
        type = e.handleObj.type;
        offset = $(this).offset();
        e.offsetX = e.layerX - offset.left;
        e.offsetY = e.layerY - offset.top;
        x = e.offsetX;
        y = e.offsetY;
        //console.log(x + " " + y + " " + type);
        App.draw(x, y, type);
        App.socket.emit('drawClick', {
            x : x,
            y : y,
            type : type
        });
    });

    $('canvas').live('touchstart touchmove touchend', function(e) {
        //console.log(e);
        e.preventDefault();
        type = e.handleObj.origType;
        f = e.originalEvent;
        //console.log(f.touches[0]);
        touch = f.touches[0];
        offset = $(this).offset();
        e.offsetX = touch.pageX - offset.left;
        e.offsetY = touch.pageY - offset.top;
        x = e.offsetX;
        y = e.offsetY;
        //console.log(x+" "+y+" "+type);
        App.draw(x, y, type);
        App.socket.emit('drawClick', {
            x : x,
            y : y,
            type : type
        });
    });
    $('#clear').live('click', function(){
        App.socket.emit('clear',{
            uid: "test"
        });
        App.ctx.clearRect(0,0,App.canvas.width,App.canvas.height);
    });
    $(function() {
        //console.log("Init");
        return App.init();
    });
}).call(this);
