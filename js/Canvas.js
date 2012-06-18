Ext.require('Whiteboard.MessageEvent');

var nodejsAddress = 'http://'+localUrl+':4001';

Ext.define('Whiteboard.Canvas',{
    /**
     * Canvas
     */
    cvs : 'undefined',
    /**
     * 2D context from canvas
     */
    cx : 'undefined',
    /**
     * Connection to server
     */
    connection: 'undefined',
    
    constructor: function(width, height, uid, room){
        
        this.cvs = document.createElement("canvas");
        this.cvs.height = height;
        this.cvs.width = width;
        this.cvs.stype = "display: block";
        
        this.cx = this.cvs.getContext('2d');
        this.cx.fillStyle = "solid";
        this.cx.strokeStyle = "#000000";//"#1C2CA3";
        this.cx.lineWidth = 3;
        this.cx.lineCap = "round";
        this.cx.fillStyle = "#FFFF00";
        
        this.connection = Ext.create('Whiteboard.Connection', nodejsAddress, this);
        this.connection.init(uid, room);
    },
    
    joinRoom: function(room){
        this.connection.init(this.connection.uid, room);
    },
    
    makeVideo: function(){
        this.connection.makeVideo();
    },
    
    getCanvas: function(){
      return this.cvs;  
    },
    
    setParams: function(lineColor, lineWidth){
        this.cx.lineWidth = lineWidth;
        this.cx.strokeStyle = lineColor;
    },
    
    drawCircle: function(){
        this.cx.beginPath();
        this.cx.arc(75, 75, 10, 0, Math.PI*2, true); 
        this.cx.closePath();
        this.cx.fill();
    },
    
    startPath: function(x, y, send){
        this.cx.beginPath();
        this.cx.moveTo(x,y);
        if(send){
            this.connection.sendPath({
                x: x,
                y: y,
                type: 'touchstart',
                lineColor: this.cx.strokeStyle,
                lineWidth: this.cx.lineWidth,
            });
        }
    },
    
    continuePath: function(x, y, send){
        //console.log("continuePath x:y "+x+":"+y);
        this.cx.lineTo(x,y);
        this.cx.stroke();
        if(send){
            this.connection.sendPath({
                x: x,
                y: y,
                type: 'touchmove',
                lineColor: this.cx.strokeStyle,
                lineWidth: this.cx.lineWidth,
            });
        }
    },
    
    endPath: function(x, y, send){
        //console.log("endPath x:y "+x+":"+y);
        //this.cx.lineTo(x,y);
        //this.cx.stroke();
        this.cx.closePath();
        if(send){
            this.connection.sendPath({
                x: x,
                y: y,
                type: 'touchend',
                lineColor: this.cx.strokeStyle,
                lineWidth: this.cx.lineWidth,
            });
        }
    },
    
    clear: function(send){
        this.cx.clearRect(0, 0, this.cvs.width, this.cvs.height);
        if(send)
            this.connection.sendClear();
    },
    
    setEraser: function(){
        this.setParams("#ffffff", 10);
    },
    
    setPen: function(colour){
        this.setParams(colour, 3);
    },
    
    save: function(){
        this.connection.save();
    },
    
    getPngUrl: function(){
        return this.cvs.toDataURL("image/png");
    }
});
