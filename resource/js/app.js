Ext.Loader.setConfig({enabled:true});
Ext.Loader.setPath('Whiteboard','resource/js');
Ext.require('Whiteboard.Svg');
Ext.require('Whiteboard.Connection');

var uid = "test";
var room = "one";

Ext.application({
    name : 'collabdraw',

    launch : function()
    {           
        var whiteboard;
        var curves = {};
        curves.color = 'black';
        curves.width = '3px';
                
        Ext.Viewport.add({
            xtype: 'panel',
            fullscreen : true,
            layout : 'vbox',
            items : [
            {
                xtype : 'panel',
                cls: 'canvas-container',
                flex: 3,
                items: [{
                    xtype: 'panel',
                    centered: 'true',
                    style: 'background-color: #ffffff;',
                    html: "<div id='whiteboard-container-0' class='whiteboard-container'></div>",
                    listeners: {
                        initialize: function(){
                            this.element.on({
                                touchstart: function(event){
                                    curves.oldx = event.pageX - this.getX()
                                    curves.oldy = event.pageY - this.getY()
                                    whiteboard.startPath(curves.oldx, curves.oldy, curves.color, curves.width, true);
                                },
                                touchmove: function(event){
                                  if(curves.oldx != -1 && curves.oldy != -1){
                                    x = event.pageX - this.getX()
                                    y = event.pageY - this.getY()
                                    whiteboard.continuePath(curves.oldx, curves.oldy,  x, y, curves.color, curves.width, true);
                                    curves.oldx = x;
                                    curves.oldy = y;
                                  }
                                },
                                touchend: function(event){
                                  if(curves.oldx != -1 && curves.oldy != -1){
                                    x = event.pageX - this.getX()
                                    y = event.pageY - this.getY()
                                    whiteboard.endPath(curves.oldx, curves.oldy, x, y, curves.color, curves.width, true);
                                    curves.oldx = -1;
                                    curves.oldy = -1;
                                  }
                                },
                            })
                        },
                        painted: function(){
                            keyValPairStr = document.URL.substring(document.URL.indexOf('#')+1).split(';');
                            keyValPairs = {};
                            for(var i = 0; i < keyValPairStr.length; i++){
                              pair = keyValPairStr[i].split('=');
                              keyValPairs[pair[0]] = pair[1];
                            }
                            
                            if (typeof keyValPairs['room'] != 'undefined'){
                              room = keyValPairs['room'];
                            }
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
                    text: 'Eraser',
                    ui: 'action',
                    cls: 'action-button',
                    listeners: {
                        tap: function(){
                            curves.color = '#ffffff';
                            curves.width = '10px';
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
                            curves.color = '#000000';
                            curves.width = '3px';
                        }
                    }
                },
                {
                    xtype: 'button',
                    //text: 'Pen',
                    ui: 'round',
                    style: 'background:black',
                    cls: 'action-button',
                    id: 'color-selector',
                    listeners:{
                        tap: function(){
                            var moreOptionsOverlay = Ext.create('Ext.Container', {
                                floating        : true,
                                modal           : true,
                                hidden          : true,
                                hideOnMaskTap: true,
                                border: 0,
                                control: {
                                   'button': {
                                       tap: function()
                                       {
                                           this.hide();
                                       }
                                   }
                                },
                                items: [
                                    {
                                      xtype: 'button',
                                      ui: 'round',
                                      style: 'background:blue',
                                      cls: 'action-button',
                                      listeners: {
                                          tap: function() {
                                              curves.color = '#0000FF';
                                              curves.width = '3px';
                                              Ext.getCmp('color-selector').setStyle('background:blue');
                                          }
                                      }
                                    },
                                    {
                                      xtype: 'button',
                                      ui: 'round',
                                      style: 'background:black',
                                      cls: 'action-button',
                                      listeners: {
                                          tap: function() {
                                              curves.color = '#000000';
                                              curves.width = '3px';
                                              Ext.getCmp('color-selector').setStyle('background:black');
                                          }
                                      }
                                    },
                                    {
                                      xtype: 'button',
                                      ui: 'round',
                                      style: 'background:red',
                                      cls: 'action-button',
                                      listeners: {
                                          tap: function() {
                                              curves.color = '#FF0000';
                                              curves.width = '3px';
                                              Ext.getCmp('color-selector').setStyle('background:red');
                                              
                                          }
                                      }
                                    },
                                    {
                                      xtype: 'button',
                                      ui: 'round',
                                      style: 'background:green',
                                      cls: 'action-button',
                                      listeners: {
                                          tap: function() {
                                              curves.color = '#FF0000';
                                              curves.width = '3px';
                                              Ext.getCmp('color-selector').setStyle('background:green');
                                          }
                                      }
                                    },
                                ]
                            });
                            moreOptionsOverlay.showBy(this);
                        }
                    }
                },
                {
                    xtype: 'button',
                    text: 'More Options...',
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
                                        text: 'Clear',
                                        cls: 'action-button',
                                        listeners: {
                                            tap: function(){
                                                whiteboard.clear(true);
                                            }
                                        }
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
                                                       whiteboard.joinRoom(value);
                                                   }
                                               }
                                            });
                                          }
                                      }
                                    },
                                    {
                                        xtype: 'button',
                                        text: 'Get Video...',
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
                                        text: 'Export to svg',
                                        cls: 'action-button',
                                        height: 30,
                                        listeners: {
                                            tap: function() {
                                                var svg = document.getElementsByTagName('svg')[0];
                                                var svg_xml = (new XMLSerializer).serializeToString(svg);
                                                window.open("data:image/svg+xml;base64,"+btoa(svg_xml), "Export");
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
                                                window.open('http://192.168.1.134:8888/upload.html#room='+room, "Upload");
                                            }
                                        }
                                    },
                                ]
                            });
                            moreOptionsOverlay.showBy(this);
                        }
                    }
                },
                /*
                {
                    xtype: 'button',
                    text: 'Chat',
                    ui: 'normal',
                    cls: 'action-button',
                    width: '30%',
                    listeners:{
                        tap: function(){
                            
                        }
                    }
                },*/
               {
                    xtype: 'button',
                    text: 'Blank',
                    ui: 'normal',
                    cls: 'action-button',
                    listeners:{
                        tap: function(){
                            //whiteboard.prevPage();
                        }
                    }
                },
                {
                    xtype: 'button',
                    text: 'Previous',
                    ui: 'action',
                    cls: 'action-button',
                    listeners:{
                        tap: function(){
                            whiteboard.prevPage();
                        }
                    }
                },
                {
                    xtype: 'button',
                    text: 'Next',
                    ui: 'action',
                    cls: 'action-button',
                    listeners:{
                        tap: function(){
                            whiteboard.nextPage();
                        }
                    }
                },
                {
                    xtype: 'button',
                    text: 'Goto...',
                    ui: 'normal',
                    cls: 'action-button',
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
