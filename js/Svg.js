Ext.require('Whiteboard.MessageEvent');

var nodejsAddress = 'http://'+localUrl+':'+nodejsPort;

Ext.define('Whiteboard.Svg',{
    cvs: 'undefined',
    lw: 'undefined',
    lc: 'undefined',
    oldx: -1,
    oldy: -1,
   
    /**
     * Connection to server
     */
    connection: 'undefined',
    constructor: function(width, height, uid, room){
        this.cvs = new Raphael('whiteboard-container', width, height);
        this.setParams("black", "3px");
        
        this.connection = Ext.create('Whiteboard.Connection', nodejsAddress, this);
        this.connection.init(uid, room);
    },
    
    setParams: function(lineColor, lineWidth){
        this.lw = lineWidth;
        this.lc = lineColor;
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
    
    startPath: function(x, y, send){
       this.oldx = x;
       this.oldy = y;
        if(send){
            this.connection.sendPath({
                x: x,
                y: y,
                type: 'touchstart',
                lineColor: this.lc,
                lineWidth: this.lw,
            });
        }
    },
    
    continuePath: function(x, y, send){
       var p = this.cvs.path("M "+this.oldx+" "+this.oldy+" L "+x+" "+y+" Z");
       p.attr("stroke", this.lc);
       p.attr("stroke-width", this.lw)
       this.oldx = x;
       this.oldy = y;
        if(send){
            this.connection.sendPath({
                x: x,
                y: y,
                type: 'touchmove',
                lineColor: this.lc,
                lineWidth: this.lw,
            });
        }
    },
    
    endPath: function(x, y, send){
        var p = this.cvs.path("M "+this.oldx+" "+this.oldy+" L "+x+" "+y+" Z");
        p.attr("stroke", this.lineColor);
        p.attr("stroke-width", this.lineWidth)
        this.oldx = -1;
        this.oldy = -1;
        if(send){
            this.connection.sendPath({
                x: x,
                y: y,
                type: 'touchend',
                lineColor: this.lc,
                lineWidth: this.lw,
            });
        }
    },
    
    clear: function(send){
        this.cvs.clear();
        if(send)
            this.connection.sendClear();
    },
    
    setEraser: function(){
        this.setParams("#ffffff", "10px");
    },
    
    setPen: function(colour){
        this.setParams(colour, "3px");
    },
    
    save: function(){
        this.connection.save();
    },
    
    getPngUrl: function(){
        return this.cvs.toDataURL("image/png");
    },
    
    loadImage: function(url){
        this.cvs.image(url, 50, 50, 400, 215);
    }
});
