Ext.require('Whiteboard.MessageEvent');

var nodejsAddress = 'http://' + localUrl + ':' + nodejsPort;

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
    totalPages : 10,
    uid: "",
    room: "",

    /**
     * Connection to server
     */
    connection : 'undefined',

    constructor : function(width, height, uid, room, page)
    {
        this.cvs = new Raphael('whiteboard-container-0', width, height);
        this.setParams("black", "3px");

        this.connection = Ext.create('Whiteboard.Connection', nodejsAddress, this);
        this.connection.init(uid, room, 1);
        this.uid = uid;
        this.room = room;
    },

    /**
     * Set line width and color
     * @param {Object} lineColor
     * @param {Object} lineWidth
     */
    setParams : function(lineColor, lineWidth)
    {
        this.lw = lineWidth;
        this.lc = lineColor;
    },

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
    startPath : function(x, y, send)
    {
        this.oldx = x;
        this.oldy = y;
        if (send) {
            this.connection.sendPath({
                x : x,
                y : y,
                type : 'touchstart',
                lineColor : this.lc,
                lineWidth : this.lw,
            });
        }
    },

    /**
     * Called when user continues path (without lifting finger)
     * @param {Object} x
     * @param {Object} y
     * @param {Object} send
     */
    continuePath : function(x, y, send)
    {
        var p = this.cvs.path("M " + this.oldx + " " + this.oldy + " L " + x + " " + y + " Z");
        p.attr("stroke", this.lc);
        p.attr("stroke-width", this.lw)
        this.oldx = x;
        this.oldy = y;
        if (send) {
            this.connection.sendPath({
                x : x,
                y : y,
                type : 'touchmove',
                lineColor : this.lc,
                lineWidth : this.lw,
            });
        }
    },

    /**
     * Called when user lifts finger
     * @param {Object} x
     * @param {Object} y
     * @param {Object} send
     */
    endPath : function(x, y, send)
    {
        var p = this.cvs.path("M " + this.oldx + " " + this.oldy + " L " + x + " " + y + " Z");
        p.attr("stroke", this.lineColor);
        p.attr("stroke-width", this.lineWidth)
        this.oldx = -1;
        this.oldy = -1;
        if (send) {
            this.connection.sendPath({
                x : x,
                y : y,
                type : 'touchend',
                lineColor : this.lc,
                lineWidth : this.lw,
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
        if (send)
            this.connection.sendClear();
        this.getImage();
    },

    /**
     * Enable eraser
     */
    setEraser : function()
    {
        this.setParams("#ffffff", "10px");
    },

    /**
     * Set color of pen
     * @param {Object} colour
     */
    setPen : function(color)
    {
        this.setParams(color, "3px");
        this.color = color;
    },

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
        this.currentPage += 1;
        if (this.currentPage > this.totalPages) {
            // Blank canvas
        } else {
            this.cvs.clear();
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
    }
});
