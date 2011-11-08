(function() {
    var io = require('socket.io').listen(4001);
    var datas = [];
    var i = 0;
    io.sockets.on('connection', function(socket) {
        socket.on('drawClick', function(data) {
            datas[i] = data;
            i++;
            socket.broadcast.emit('draw', {
                x : data.x,
                y : data.y,
                type : data.type
            });
        });
        socket.on('init', function(uid) {
            // console.log("Init function called.");
            // console.log("Data has " + datas.length + " items!");
            // TODO compress datas before emitting
            socket.emit('draw-many', {
                datas : datas,
            });
        });
        socket.on('clear', function(uid) {
            datas = [];
        });
    });
}).call(this);
