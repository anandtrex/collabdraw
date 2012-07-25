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

        spr = this;

        this.socket.on('draw', function(data)
        {
            if(spr.whiteboard.currentPage == data.page)
                spr.remoteDraw(spr, data);
        });
        this.socket.on('draw-many', function(data)
        {
            if(spr.whiteboard.currentPage == data.page)
                spr.remoteDrawMany(spr, data);
        });
        this.socket.on('clear', function(data)
        {   
            if(spr.whiteboard.currentPage == data.page)
                spr.remoteClear(spr, data);
        });
        this.socket.on('made-video', function(data)
        {
            if(spr.whiteboard.currentPage == data.page)
                spr.remoteMadeVideo(spr, data);
        });
        this.socket.on('saved-canvas', function(data)
        {
            if(spr.whiteboard.currentPage == data.page)
                spr.remoteSavedCanvas(spr, data);
        });
        this.socket.on('image', function(data){
            if(spr.whiteboard.currentPage == data.page)
                spr.remoteImage(spr, data);
        });
        
        /**
         * Message event popup UI
         */
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

    /**
     * Send a single path (segment) to the server
     * @param {x, y, type, lineColor, lineWidth} a point on the path
     */
    sendPath : function(data)
    {
        this.singlePath.push(data);
        this.currentPathLength++;
        // Send path every two points or when user removes finger
        if (this.currentPathLength > 2 || data.type === "touchend") {
            this.socket.emit('drawClick', {
                singlePath : this.singlePath,
            });
            this.singlePath = [];
            this.currentPathLength = 0;
        }
    },

    /**
     * Clear all other canvases (in the same room on the same page)
     */
    sendClear : function()
    {
        this.socket.emit('clear', {
            uid : this.uid,
        });
    },

    /**
     * Make video remotely
     */
    makeVideo : function()
    {
        this.socket.emit('video', {
            uid : this.uid,
        });
    },

    /**
     * Get data from server to initialize this whiteboard
     * @param {Object} uid
     * @param {Object} roomName
     * @param {Object} page
     */
    init : function(uid, roomName, page)
    {
        this.whiteboard.clear();
        this.uid = uid;
        this.roomName = roomName;
        
        this.getImage(page);

        this.socket.emit('init', {
            uid : uid,
            roomName : roomName,
            page: page,
        });
    },

    /**
     * Draw from realtime data incoming from server
     * Called when server sends @event 'draw'
     * @param {Object} self
     * @param {singlePath: [points...]} input
     */
    remoteDraw : function(self, input)
    {
        var sPath = input.singlePath;
        var data = {}; // point on path
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

    /**
     * Draw from stored data incoming from server
     * Called when server sends @event 'draw-many'
     * @param {Object} self
     * @param {datas:[points...]} data
     */
    remoteDrawMany : function(self, data)
    {
        //self.whiteboard.clear(); 
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

    /**
     * Clear from server
     * Called when server sends @event 'clear'
     * @param {Object} self
     * @param {Object} data
     */
    remoteClear : function(self, data)
    {
        self.whiteboard.clear(false);
    },

    /**
     * Notification from server that video is ready
     * Called when server sends @event 'made-video'
     * @param {Object} self
     * @param {Object} data
     */
    remoteMadeVideo : function(self, data)
    {
        // Show dialog box to say the video is done, and show download link for video
        this.messageEvent.fireEvent('showMessage', "Video ready");
        window.open("http://"+localUrl+"/collabdraw/test/test.mp4", "Download");
    },

    /**
     * Notification from server that canvas has been saved
     * Called when server sends @event 'saved-canvas'
     * @param {Object} self
     * @param {Object} data
     */
    remoteSavedCanvas : function(self, data)
    {
        // show dialog box to say that the canvas has been saved
        this.messageEvent.fireEvent('showMessage', "Canvas saved");
    },
    
    remoteImage: function(self, data)
    {
        console.log("Got image");
        var img = document.createElement('img');
        img.src=data.url;
        console.log(data.url);
        console.log(img.width+" "+img.height);
        self.whiteboard.loadImage(data.url, img.width, img.height);
    },

    /**
     * Asks server to save canvas in database
     */
    save : function()
    {
        this.socket.emit('save-canvas', {
            uid : this.uid,
            canvasName : this.roomName,
        });
    },
    
    getImage: function(page)
    {
        console.log("Getting image for page "+page);
        this.socket.emit('get-image', {
            uid: this.uid,
            page: page,   
        }); 
    }
});
