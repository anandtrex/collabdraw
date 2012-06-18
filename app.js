Ext.Loader.setConfig({enabled:true});
Ext.Loader.setPath('Whiteboard','./js');
//Ext.require('Whiteboard.Canvas');
Ext.require('Whiteboard.Svg');
Ext.require('Whiteboard.Connection');

var uid = "test";
var room = "one";

Ext.application({
    name : 'collabdraw',

    launch : function()
    {           
        //var whiteboard = Ext.create('Whiteboard.Canvas', 1000, 550, uid, room);
        //var thisCanvas = whiteboard.getCanvas();
        var whiteboard;
                
        Ext.Viewport.add({
            xtype: 'panel',
            fullscreen : true,
            layout : 'vbox',
            //centered: true,
            items : [
            {
                xtype : 'panel',
                cls: 'canvas-container',
                //html : '<p>Canvas</p><div id="whiteboard"></div>',
                flex: 3,
                items: [{
                    xtype: 'panel',
                    centered: 'true',
                    style: 'background-color: #ffffff;',
                    //id: 'whiteboard-container',
                    //html: thisCanvas,
                    html: "<div id='whiteboard-container'></div>",
                    listeners: {
                        initialize: function(){
                            console.log("panel initialized");
                            this.element.on({
                                touchstart: function(event){
                                    whiteboard.startPath(event.pageX - this.getX(), event.pageY - this.getY(), true);
                                },
                                touchmove: function(event){
                                    whiteboard.continuePath(event.pageX - this.getX(), event.pageY - this.getY(), true);
                                },
                                touchend: function(event){
                                    whiteboard.endPath(event.pageX - this.getX(), event.pageY - this.getY(), true);
                                },
                            })
                        },
                        painted: function(){
                            whiteboard = Ext.create('Whiteboard.Svg', 1000, 550, uid, room);
                        },
                    }
                }],
            },
            {
                xtype : 'panel',
                layout: 'hbox',
                style: 'background-color: #5E99CC; padding: 4px',
                flex: 0,
                items: [
                {
                    xtype: 'button',
                    text: 'Save',
                    ui: 'action',
                    cls: 'action-button',
                    listeners: {
                        tap: function(){
                            whiteboard.save();
                        }
                    }
                },
                {
                    xtype: 'button',
                    text: 'Clear',
                    ui: 'action',
                    cls: 'action-button',
                    listeners: {
                        tap: function(){
                            whiteboard.clear(true);
                        }
                    }
                },
                {
                    xtype: 'button',
                    text: 'Eraser',
                    ui: 'action',
                    cls: 'action-button',
                    listeners: {
                        tap: function(){
                            whiteboard.setEraser();
                        }
                    }
                },
                {
                    xtype: 'button',
                    text: 'Pen',
                    ui: 'action',
                    cls: 'action-button',
                    listeners:{
                        tap: function(){
                            whiteboard.setPen('#000000');
                        }
                    }
                },
                {
                    xtype: 'button',
                    text: 'More Options',
                    ui: 'action',
                    cls: 'action-button',
                    width: '20%',
                    listeners:{
                        tap: function(){
                            var moreOptionsOverlay = Ext.create('Ext.Panel', {
                                floating        : true,
                                modal           : true,
                                hidden          : true,
                                height          : 300,
                                width           : 250,
                                contentEl       : 'content',
                                styleHtmlContent: true,
                                scrollable      : true,
                                hideOnMaskTap: true,
                                items: [
                                    {
                                        docked: 'top',
                                        xtype : 'toolbar',
                                        title : 'More Options'
                                    },
                                    {
                                      xtype: 'button',
                                      text: 'Create/Join Room',
                                      cls: 'action-button',
                                      height: 30,
                                      listeners: {
                                          tap: function() {
                                              Ext.Msg.show({
                                               title: 'Enter Room name.',
                                               message: 'If the room doesn\'t exist already in your account, it will be created.',
                                               width: 300,
                                               buttons: Ext.MessageBox.OKCANCEL,
                                               multiLine: false,
                                               prompt : { maxlength : 180, autocapitalize : false },
                                               fn: function(buttonId, value) {
                                                   if(buttonId == "ok"){
                                                       //console.log("Room name was "+value);
                                                       whiteboard.joinRoom(value);
                                                   }
                                               }
                                            });
                                          }
                                      }
                                    },
                                    {
                                        xtype: 'button',
                                        text: 'Get Video',
                                        cls: 'action-button',
                                        height: 30,
                                        listeners: {
                                            tap: function() {
                                                whiteboard.makeVideo();
                                            }
                                        }
                                    },
                                    {
                                        xtype: 'button',
                                        text: 'Snapshot',
                                        cls: 'action-button',
                                        height: 30,
                                        listeners: {
                                            tap: function() {
                                                window.open(whiteboard.getPngUrl(), "Snapshot");
                                            }
                                        }
                                    }, 
                                    {
                                        xtype: 'button',
                                        text: 'Upload',
                                        cls: 'action-button',
                                        height: 30,
                                        listeners: {
                                            tap: function() {
                                                window.open('http://'+localUrl+'/collabdraw/upload.php', "Snapshot");
                                            }
                                        }
                                    }                                   
                                ]
                            });
                            moreOptionsOverlay.showBy(this);
                        }
                    }
                },
                {
                    xtype: 'button',
                    text: 'Chat',
                    ui: 'action',
                    cls: 'action-button',
                    width: '30%',
                    listeners:{
                        tap: function(){
                            
                        }
                    }
                },
                ],
            }, ]
        });
    }
});
