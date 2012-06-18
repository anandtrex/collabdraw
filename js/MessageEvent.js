Ext.define('Whiteboard.MessageEvent', {
        extend: 'Ext.util.Observable',
        constructor: function(config){
            this.addEvents({
                "showMessage" : true,
            });

            // Copy configured listeners into *this* object so 
            // that the base class's constructor will add them.
            this.listeners = config.listeners;

            // Call our superclass constructor to complete
            // construction process.
            this.callParent(arguments)
        }
});