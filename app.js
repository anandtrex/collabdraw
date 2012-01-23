Ext.Loader.setConfig({enabled:true});
Ext.Loader.setPath('Whiteboard','./js');
Ext.require('Whiteboard.Canvas');
Ext.require('Whiteboard.Connection');

Ext.application({
    name : 'canvas',

    launch : function()
    {           
        var whiteboard = Ext.create('Whiteboard.Canvas', 1000, 550);
        var thisCanvas = whiteboard.getCanvas();
        //whiteboard.drawCircle();        
                
        
           
        
        Ext.Viewport.on({
            delegate: 'button',
            tap: function(button) {
                //overlay.setMessage("This is a message");
                //overlay.show();
            }
        });
        
        Ext.create('Ext.Panel', {
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
                    html: thisCanvas,
                    initialize: function(){
                        //console.log(this.xtype);
                        this.element.on({
                            touchstart: function(event){
                                //console.log(this.getX());
                                whiteboard.startPath(event.pageX - this.getX(), event.pageY - this.getY(), true);
                            },
                            touchmove: function(event){
                                whiteboard.continuePath(event.pageX - this.getX(), event.pageY - this.getY(), true);
                            },
                            touchend: function(event){
                                whiteboard.endPath(event.pageX - this.getX(), event.pageY - this.getY(), true);
                            }
                        })
                    }
                }],
            },
            {
                xtype : 'panel',
                layout: 'hbox',
                style: 'background-color: #5E99CC; padding: 4px',
                //html : 'This is docked to the bottom',
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
                    text: 'More',
                    ui: 'action',
                    cls: 'action-button',
                    width: '20%',
                    listeners:{
                        tap: function(){
                            
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
