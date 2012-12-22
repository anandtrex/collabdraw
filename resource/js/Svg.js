Ext.require('Whiteboard.MessageEvent');

var nodejsAddress = 'ws://192.168.1.134:8888/realtime/';

/**
 * This contains all the local functions to interact with the whiteboard. It also contains
 * interfaces to the Connection class.
 */
Ext.define('Whiteboard.Svg', {
    cvs : 'undefined',
    lw : 'undefined',
    lc : 'undefined',
    color : 'black',
    oldx : -1,
    oldy : -1,
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
        //this.setParams("black", "3px");

        this.connection = Ext.create('Whiteboard.Connection', nodejsAddress, this, room);
        this.uid = uid;
        this.room = room;
        this.connection.init(this.uid, this.room, 1);
    },

    init: function()
    {
    },

    /**
     * Set line width and color
     * @param {Object} lineColor
     * @param {Object} lineWidth
     */
    //setParams : function(lineColor, lineWidth)
    //{
        //this.lw = lineWidth;
        //this.lc = lineColor;
    //},

    /**
     * Join specified room
     * @param {Object} room
     */
    joinRoom : function(room)
    {
        this.connection.init(this.connection.uid, room);
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
     * @param {Object} x
     * @param {Object} y
     * @param {Object} send
     */
    continuePath : function(oldx, oldy, x, y, lc, lw, send)
    {
        path = "M " + oldx + " " + oldy + " L " + x + " " + y + " Z";
        //console.log("Drawing path " + path);
        var p = this.cvs.path(path);
        p.attr("stroke", lc);
        p.attr("stroke-width", lw)
        if (send) {
            this.connection.sendPath({
                oldx: oldx,
                oldy: oldy,
                x : x,
                y : y,
                type : 'touchmove',
                lineColor : lc,
                lineWidth : lw,
            });
        }
    },

    /**
     * Called when user lifts finger
     * @param {Object} x
     * @param {Object} y
     * @param {Object} send
     */
    endPath : function(oldx, oldy, x, y, lc, lw, send)
    {
        path = "M " + oldx + " " + oldy + " L " + x + " " + y + " Z";
        //console.log("Drawing path " + path);
        var p = this.cvs.path(path);
        p.attr("stroke", lc);
        p.attr("stroke-width", lw)
        if (send) {
            this.connection.sendPath({
                oldx: oldx,
                oldy: oldy,
                x : x,
                y : y,
                type : 'touchend',
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
        //this.getImage();
    },

    /**
     * Enable eraser
     */
    //setEraser : function()
    //{
        //this.setParams("#ffffff", "10px");
    //},

    /**
     * Set color of pen
     * @param {Object} colour
     */
    //setPen : function(color)
    //{
        //this.setParams(color, "3px");
        //this.color = color;
    //},

    /**
     * Ask server to save canvas
     */
    save : function()
    {
        this.connection.save();
    },

    /**
     * Load an image onto the canvas
     * @param {Object} url
     */
    loadImage : function(url, width, height)
    {
        console.log("Loading");
        this.cvs.image(url, 0, 0, width, height);
    },

    getImage : function()
    {
        images = document.getElementsByTagName("image");
        if (images.length == 0)
            this.connection.getImage(this.currentPage);
        else
            console.log("One image already loaded");
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
