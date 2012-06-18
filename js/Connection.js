Ext.define('Whiteboard.Connection', {
    socket : 'undefined',
    whiteboard : 'undefined',
    singlePath : [],
    currentPathLength : 0,
    uid : 'undefined',
    roomName : 'undefined',
    messageEvent : 'undefined',

    constructor : function(address, whiteboard)
    {
        this.whiteboard = whiteboard;
        this.socket = io.connect(address);
        //this.whiteboard.clear();
        //console.log(this.whiteboard);

        spr = this;

        this.socket.on('draw', function(data)
        {
            spr.remoteDraw(spr, data);
        });
        this.socket.on('draw-many', function(data)
        {
            //console.log('draw-many event seen');
            //console.log('data is '+data);
            spr.remoteDrawMany(spr, data);
        });
        this.socket.on('clear', function(data)
        {
            spr.remoteClear(spr, data);
        });
        this.socket.on('made-video', function(data)
        {
            spr.remoteMadeVideo(spr, data);
        });
        this.socket.on('saved-canvas', function(data)
        {
            spr.remoteSavedCanvas(spr, data);
        });

        this.messageEvent = Ext.create('Whiteboard.MessageEvent', {
            listeners : {
                showMessage : function(message)
                {

                    var msgOverlay = Ext.create('Ext.Panel', {
                        //floating        : true,
                        hidden : true,
                        height : 30,
                        width : '20%',
                        scrollable : false,
                        //hideOnMaskTap: true,
                        border : 'none',
                        margin : '0',
                        docked : 'top',
                        //top: '5px',
                        left : '40%',
                        html : '',
                    });
                    // Required for being able to show the overlay
                    Ext.Viewport.add(msgOverlay);
                    msgOverlay.setHtml("<div>" + message + "</div>");
                    msgOverlay.show();
                    setTimeout(function()
                    {
                        msgOverlay.hide()
                    }, 3000);
                }
            }
        });
    },

    sendPath : function(data)
    {
        //console.log("Sending path!");
        this.singlePath.push(data);
        this.currentPathLength++;
        if (this.currentPathLength > 2 || data.type === "touchend") {
            this.socket.emit('drawClick', {
                singlePath : this.singlePath,
            });
            this.singlePath = [];
            this.currentPathLength = 0;
        }
    },

    sendClear : function()
    {
        this.socket.emit('clear', {
            uid : this.uid,
        });
    },

    makeVideo : function()
    {
        this.socket.emit('video', {
            uid : this.uid,
        });
    },

    init : function(uid, roomName)
    {
        //console.log("Initializing...");
        this.uid = uid;
        this.roomName = roomName;

        this.socket.emit('init', {
            uid : uid,
            roomName : roomName,
        });
    },

    remoteDraw : function(self, input)
    {
        //self.whiteboard.setPen("black");
        var sPath = input.singlePath;
        var data = {};
        for (d in sPath) {
            data = sPath[d];
            if (data == null)
                continue;
            this.whiteboard.setParams(data.lineColor, data.lineWidth);
            if (data.type == 'touchstart')
                self.whiteboard.startPath(data.x, data.y);
            else if (data.type == 'touchmove')
                self.whiteboard.continuePath(data.x, data.y);
            else if (data.type == 'touchend')
                self.whiteboard.endPath(data.x, data.y);
        }
    },

    remoteDrawMany : function(self, data)
    {
        self.whiteboard.clear();
        ds = data.datas;
        for (d in ds) {
            if (ds[d] === null)
                continue;
            self.whiteboard.setParams(ds[d].lineColor, ds[d].lineWidth);
            if (ds[d].type == 'touchstart')
                self.whiteboard.startPath(ds[d].x, ds[d].y, false);
            else if (ds[d].type == 'touchmove')
                self.whiteboard.continuePath(ds[d].x, ds[d].y, false);
            else if (ds[d].type == 'touchend')
                self.whiteboard.endPath(ds[d].x, ds[d].y, false);
        }
    },

    remoteClear : function(self, data)
    {
        self.whiteboard.clear(false);
    },

    remoteMadeVideo : function(self, data)
    {
        // Show dialog box to say the video is done, and show download link for video
        this.messageEvent.fireEvent('showMessage', "Video ready");
        window.open("http://"+localUrl+"/collabdraw/test/test.mp4", "Download");
    },

    remoteSavedCanvas : function(self, data)
    {
        // show dialog box to say that the canvas has been saved
        this.messageEvent.fireEvent('showMessage', "Canvas saved");
    },

    save : function()
    {
        this.socket.emit('save-canvas', {
            uid : this.uid,
            canvasName : this.roomName,
        });
    },
});
