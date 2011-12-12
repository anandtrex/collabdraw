(function()
{

    /*
     * Web sockets and associated handlers
     */
    var io = require('socket.io').listen(4001);
    var video = false;

    //var i = 0;
    var roomDatas = [];

    io.sockets.on('connection', function(socket)
    {
        var mongodb = require('mongodb');
        var server = new mongodb.Server("127.0.0.1", 27017, {});
        var db_connector = new mongodb.Db("coll_canv", server, {});

        socket.on('drawClick', function(input)
        {
            console.log("Receiving path");
            var singlePath = input.singlePath;
            var data = {};
            for (d in singlePath){
                data = singlePath[d];
                //console.log("Datas: "+JSON.stringify(datas));
                // console.log("Length of data:"+datas.length);
                roomDatas[socket.room].push(data);
            //i++;
            }
            socket.broadcast.to(socket.room).emit('draw', {
                singlePath : singlePath,
                /*
                    x : data.x,
                    y : data.y,
                    type : data.type,
                    lineColor : data.lineColor,
                    lineWidth : data.lineWidth,*/
            });
        });

        socket.on('init', function(data)
        {
            console.log("Initializing");
            //console.log("data: " + JSON.stringify(data));
            // TODO compress datas before emitting
            if(socket.room) {
                console.log("Leaving room " + socket.room);
                socket.leave(socket.room);
            }
            console.log("Joining room " + data.roomName);
            socket.join(data.roomName);
            socket.room = data.roomName;
            //roomDatas[socket.room] = [];
            if(!roomDatas[socket.room]) {
                roomDatas[socket.room] = [];
                // console.log("data: " + JSON.stringify(data));
                console.log("Getting data from db");

                // console.log("in getDataFromDb with uid " + data.uid + " and room name " +
                // data.roomName);
                db_connector.open(function(error, client)
                {
                    if(error)
                        throw error;
                    var collection = new mongodb.Collection(client, data.uid);
                    canvasName = data.roomName;
                    console.log("canvas name", data.roomName);
                    collection.find({
                        canvasName : data.roomName
                    }).toArray(function(err, results)
                    {
                        if(err)
                            throw err;
                        //console.log("These are the results: " + JSON.stringify(results));
                        //console.log("Length of results: "+results.length);
                        if(results.length == 0) {
                            //console.log("Empty init");
                            roomDatas[socket.room] = [];
                        } else {
                            roomDatas[socket.room] = results[results.length - 1].datas;
                        }
                        
                        while(roomDatas[socket.room].length > 1 && roomDatas[socket.room][0] == null) {
                            roomDatas[socket.room].shift();
                            console.log("Discarding top of roomDatas");
                        }

                        socket.emit('draw-many', {
                            datas : roomDatas[socket.room],
                        });
                    });
                    console.log("Done retrieving!");
                    //client.close();
                });
            } else {
                socket.emit('draw-many', {
                    datas : roomDatas[socket.room],
                });
            }
        });

        socket.on('clear', function(uid)
        {
            roomDatas[socket.room] = [];
            socket.broadcast.to(socket.room).emit('clear', {
                uid : uid,
            });
        });

        socket.on('video', function(uid)
        {
            if(video == true){
                socket.emit('message', {
                    message: "This is not available at this time. Please try again later."
                })
                return;
            }
            else {
                video = true;
            }
            console.log("Saving png");
            var Canvas = require('canvas'), canvas = new Canvas(920, 550);
            var fs = require('fs');
            var sys = require('sys');
            var exec = require('child_process').exec;
            function doVideo(error, stdout, stderr)
            {
                sys.puts(stdout);
                sys.puts(stderr);

                var writtenNo = -1;
                var oldWrittenNo = -1;

                var draw = function(canvas, x, y, type, lineColor, lineWidth)
                {
                    ctx = canvas.getContext('2d');
                    ctx.strokeStyle = lineColor;
                    ctx.lineWidth = lineWidth;
                    if(type === "dragstart" || type === "touchstart") {
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                    } else if(type === "drag" || type === "touchmove") {
                        ctx.lineTo(x, y);
                        ctx.stroke();
                    } else {
                        ctx.closePath();
                    }
                    return canvas;
                }
                var writePng = function(canvas2, dir, i)
                {
                    dirpath = __dirname + "/" + dir;
                    var out = fs.createWriteStream(dirpath + '/canvas' + i + '.png'), stream = canvas2.createPNGStream();
                    stream.on('data', function(chunk)
                    {
                        out.write(chunk);
                    });
                    stream.on('end', function()
                    {
                        try {
                            out.end();
                            out.destroySoon();
                        } catch (err) {
                            console.log("Error occurred: " + err);
                        }
                    });
                    writtenNo = i;
                    //console.log(i);
                }
                for(var d = 0; d < roomDatas[socket.room].length; d++) {
                    if(roomDatas[socket.room][d] == null || roomDatas[socket.room][d] == undefined || roomDatas[socket.room][d] == "undefined") {
                        console.log("null or undefined data in roomDatas[socket.room][d] for d = " + d + "!");
                        continue;
                    }
                    xyz(d);
                }
                function xyz(d)
                {
                    setTimeout(function()
                    {
                        try {
                            draw(canvas, roomDatas[socket.room][d].x, roomDatas[socket.room][d].y, roomDatas[socket.room][d].type, roomDatas[socket.room][d].lineColor, roomDatas[socket.room][d].lineWidth);
                        } catch(err) {
                            console.log("Error: " + err);
                            console.log("This is the roomDatas[socket.room][d] " + roomDatas[socket.room][d]);
                            return;
                        }

                        writePng(canvas, "test", d);
                    }, 50 * d);
                }

                var doneWriting = false;
                var t = setInterval(function()
                {
                    if(writtenNo != oldWrittenNo) {
                        oldWrittenNo = writtenNo;
                    } else {
                        console.log("Done!");
                        doneWriting = true;
                        clearInterval(t);
                        makeVideo();
                    }
                }, 100);
                function makeVideo()
                {
                    exec("./makeVideo.sh", doneMakingVideo);
                }

                function doneMakingVideo(error, stdout, stderr)
                {
                    console.log("Done making video!");
                    console.log(stdout);
                    console.log(error);
                    console.log(stderr);
                    socket.emit('made-video', {
                        uid : uid,
                    });
                }

            }
            console.log("Deleting files");
            // NOTE This is async. Beware!
            exec("./deleteFiles.sh", doVideo);
            video = false;
        });
        /**
         * Saves the canvas
         */
        socket.on('save-canvas', function(data)
        {
            console.log("Saving canvas");
            db_connector.open(function(error, client)
            {
                if(error)
                    throw error;
                var uid = data.uid;
                var collection = new mongodb.Collection(client, uid);
                canvasName = data.canvasName;
                console.log("canvas name", canvasName);
                console.log("Removing old saves");
                collection.remove({
                    canvasName : canvasName
                });
                console.log("Inserting new saves");
                collection.insert({
                    type : "canvas",
                    canvasName : canvasName,
                    datas : roomDatas[socket.room],
                    timestamp : new Date().getTime()
                });
                console.log("Done inserting!");
                socket.emit('saved-canvas', {
                    uid : uid,
                });
                //client.close();
            });
        });

        socket.on('getCanvasList', function(data)
        {
            var uid = data.uid;
            db_connector.open(function(error, client)
            {
                if(error)
                    throw error;
                var collection = new mongoDb.Collection(client, uid);
                var cursor = collection.find({}, {
                    'canvasName' : 1
                });
                var canvasList = [];
                cursor.each(function(err, doc)
                {
                    if(err)
                        console.log("Error cursor: " + err);
                    console.log("doc: " + JSON.stringify(doc));
                });
                socket.emit('canvasList', {
                    canvasList : canvasList,
                })
            });
        });
    });
}).call(this);
