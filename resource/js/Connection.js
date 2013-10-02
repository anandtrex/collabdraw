enyo.kind({
    name: 'Connection',
    kind: null,

    socket: 'undefined',
    whiteboard: 'undefined',
    singlePath: [],
    currentPathLength: 0,
    uid: 'uid',
    room: 'undefined',
    page: 1,

    constructor: function(address, whiteboard, room) {
        this.whiteboard = whiteboard;
        //console.log("Connecting to address " + address);
        this.socket = new WebSocket(address);
        this.room = room;
        this.page = 1;
        //console.log("Room is " + room);

        _this = this;
        this.socket.onmessage = function(evt) {
            message = JXG.decompress(evt.data);
            message = JSON.parse(message);
            evnt = message['event'];
            data = message['data'];
            switch (evnt) {
            case 'ready':
                _this.init(_this.uid, _this.room, _this.page);
                break;
            case 'draw':
                _this.remoteDraw(_this, data);
                break;
            case 'draw-many':
                _this.remoteDrawMany(_this, data);
                break;
            case 'clear':
                _this.remoteClear(_this, data);
                break;
            case 'image':
                _this.remoteImage(_this, data);
                break;
            }
        }
    },

    sendMessage: function(evt, data) {
        message = JSON.stringify({
            "event": evt,
            "data": data
        });
        this.socket.send(message);
    },

    init: function(uid, room, currentPage) {
        console.log("Sending init for room " + room + " and page " + currentPage);
        this.whiteboard.clear(false, false);
        this.sendMessage("init", {
            "room": room,
            "page": currentPage
        });
    },

    /**
     * Get data from server to initialize this whiteboard
     * @param {Object} uid
     * @param {Object} room
     * @param {Object} page
     */
    joinRoom: function(room, page) {
        this.room = room;
        this.singlePath = [];
        this.currentPathLength = 0;
        this.whiteboard.clear(false, false);
        //console.log("Sending init for room " + room);
        this.sendMessage("init", {
            "room": this.room
        });
    },

    /**
     * Send a single path (segment) to the server
     * @param {x, y, type, lineColor, lineWidth} a point on the path
     */
    sendPath: function(data) {
        this.singlePath.push(data);
        this.currentPathLength++;

        // Send path every two points or when user removes finger
        if (this.currentPathLength > 2 || data.type === "touchend") {
            this.sendMessage("draw-click", {
                "singlePath": this.singlePath
            });
            this.singlePath = [];
            this.currentPathLength = 0;
        }
    },

    /**
     * Clear all other canvases (in the same room on the same page)
     */
    sendClear: function() {
        this.singlePath = [];
        this.currentPathLength = 0;
        this.sendMessage("clear", {});
    },

    getImage: function() {
        //console.log("Getting image for page " + this.page);
        this.sendMessage("get-image", {
            "room": this.room,
            "page": this.page
        });
    },

    /**
     * Make video remotely
     */
    makeVideo: function() {
        this.sendMessage("video", {});
    },

    /*
     * Create a new page
     */
    newPage: function() {
        this.whiteboard.clear(false, false);
        this.sendMessage("new-page", {});
    },

    /***
     * All remote functions below
     */

    /**
     * Draw from realtime data incoming from server
     * Called when server sends @event 'draw'
     * @param {Object} self
     * @param {singlePath: [points...]} input
     */
    remoteDraw: function(self, input) {
        var sPath = input.singlePath;
        var data = {};
        // point on path
        for (d in sPath) {
            data = sPath[d];
            if (data == null) continue;
            if (data.type == 'touchstart') self.whiteboard.startPath(data.oldx, data.oldy, data.lineColor, data.lineWidth, false);
            else if (data.type == 'touchmove') self.whiteboard.continuePath(data.oldx, data.oldy, data.x, data.y, data.lineColor, data.lineWidth, false);
            else if (data.type == 'touchend') self.whiteboard.endPath(data.oldx, data.oldy, data.x, data.y, data.lineColor, data.lineWidth, false);
        }
    },

    /**
     * Draw from stored data incoming from server
     * Called when server sends @event 'draw-many'
     * @param {Object} self
     * @param {datas:[points...]} data
     */
    remoteDrawMany: function(self, data) {
        ds = data.datas;
        for (d in ds) {
            if (ds[d] === null) continue;
            if (ds[d].type == 'touchstart') self.whiteboard.startPath(ds[d].oldx, ds[d].oldy, ds[d].lineColor, ds[d].lineWidth, false);
            else if (ds[d].type == 'touchmove') self.whiteboard.continuePath(ds[d].oldx, ds[d].oldy, ds[d].x, ds[d].y, ds[d].lineColor, ds[d].lineWidth, false);
            else if (ds[d].type == 'touchend') self.whiteboard.endPath(ds[d].oldx, ds[d].oldy, ds[d].x, ds[d].y, ds[d].lineColor, ds[d].lineWidth, false);
        }
        //console.log("Total pages is " + data.npages);
        self.whiteboard.setTotalPages(data.npages);
    },

    /**
     * Clear from server
     * Called when server sends @event 'clear'
     * @param {Object} self
     * @param {Object} data
     */
    remoteClear: function(self, data) {
        self.whiteboard.clear(false);
    },

    remoteImage: function(self, data) {
        if (data.url != "") {
            var img = document.createElement('img');
            img.src = data.url;
            //console.log("Image url is " + data.url);
            self.whiteboard.loadImage(data.url, data.width, data.height);
        }
    },

});
