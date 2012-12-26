Ext.require('Whiteboard.MessageEvent');

var nodejsAddress = 'ws://192.168.1.134:8888/realtime/';

/**
 * This contains all the local functions to interact with the whiteboard. It also contains
 * interfaces to the Connection class.
 */
Ext.define('Whiteboard.Svg', {
    cvs : 'undefined',
    currentPage : 1,
    totalPages : 2,
    uid: "",
    room: "",

    /**
     * Connection to server
     */
    connection : 'undefined',

    constructor : function(width, height, uid, room, page)
    {
        this.cvs = new Raphael('whiteboard-container-0', width, height);

        this.connection = Ext.create('Whiteboard.Connection', nodejsAddress, this, room);
        this.uid = uid;
        this.room = room;
    },

    /**
     * Join specified room
     * @param {Object} room
     */
    joinRoom : function(room)
    {
        this.connection.joinRoom(room);
    },

    /**
     * Ask server to make video of current whiteboard
     */
    makeVideo : function()
    {
        this.connection.makeVideo();
    },

    /**
     * Getter for cvs
     */
    getCanvas : function()
    {
        return this.cvs;
    },

    /**
     * Called when user starts a path
     * @param {Object} x
     * @param {Object} y
     * @param {Object} send
     */
    startPath : function(x, y, lc, lw, send)
    {
        if (send) {
            this.connection.sendPath({
                oldx : x,
                oldy : y,
                type : 'touchstart',
                lineColor : lc,
                lineWidth : lw,
            });
        }
    },

    /**
     * Called when user continues path (without lifting finger)
     */
    continuePath : function(oldx, oldy, x, y, lc, lw, send)
    {
        this.drawAndSendPath('touchmove', oldx, oldy, x, y, lc, lw, send)
    },

    /**
     * Called when user lifts finger
     */
    endPath : function(oldx, oldy, x, y, lc, lw, send)
    {
        this.drawAndSendPath('touchend', oldx, oldy, x, y, lc, lw, send)
    },

    drawAndSendPath: function(type, oldx, oldy, x, y, lc, lw, send)
    {
        path = "M " + oldx + " " + oldy + " L " + x + " " + y + " Z";
        var p = this.cvs.path(path);
        p.attr("stroke", lc);
        p.attr("stroke-width", lw)
        if (send) {
            this.connection.sendPath({
                oldx: oldx,
                oldy: oldy,
                x : x,
                y : y,
                type : type,
                lineColor : lc,
                lineWidth : lw,
            });
        }
    },

    /**
     * Clear canvas
     * @param {Object} send
     */
    clear : function(send)
    {
        this.cvs.clear();
        this.connection.getImage();
        if (send)
            this.connection.sendClear();
    },

    /**
     * Load an image onto the canvas
     * @param {Object} url
     */
    loadImage : function(url, width, height)
    {
        console.log("Loading image from " + url);
        this.cvs.image(url, 5, 5, width, height);
    },

    getImage : function()
    {
        images = document.getElementsByTagName("image");
        // TODO More specific targetting of image
        if(images.length != 0){
            console.log("Images already loaded");
            for (var i = 0; i < images.length; i++){
              images[i].parentNode.removeChild(images[i]);
            }
        }
        this.connection.getImage(this.currentPage);
    },

    /**
     * Go to the next page
     */
    nextPage : function()
    {
        
        if (this.currentPage + 1 > this.totalPages) {
            // Blank canvas
            console.log("Total pages was " + this.totalPages + " and current page is " + this.currentPage);
        } else {
            this.currentPage += 1;
            //this.cvs.clear();
            this.connection.init(this.uid, this.room, this.currentPage);
        }
    },

    /**
     * Go to the previous page
     */
    prevPage : function()
    {

        if (this.currentPage - 1 <= 0) {
            // do nothing
        } else {
            this.currentPage -= 1;
            this.cvs.clear();
            this.connection.init(this.uid, this.room, this.currentPage);
        }
    },

    getColor : function()
    {
        return this.color;
    },
    
    setTotalPages: function(pages)
    {
        this.totalPages = pages;
    },
});
