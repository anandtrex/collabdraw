(function() {

    /*
     * Web sockets and associated handlers
     */
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
                type : data.type,
                lineColor : data.lineColor,
                lineWidth : data.lineWidth,
            });
        });
        socket.on('init', function(uid) {
            // console.log("Init function called.");
            // console.log("Data has " + datas.length + " items!");
            // TODO compress datas before emitting
            while(datas.length > 1 && datas[0] == null) {
                datas.shift();
            }
            socket.emit('draw-many', {
                datas : datas,
            });
        });
        socket.on('clear', function(uid) {
            datas = [];
            socket.broadcast.emit('clear', {
                uid : uid,
            });
        });
        /*
         socket.on('save', function(uid) {
         var client = new Db('test', new Server("127.0.0.1", 27017, {})), test = function(err, collection) {
         collection.insert({
         a : 2
         }, function(err, docs) {
         collection.count(function(err, count) {
         test.assertEquals(1, count);
         });
         // Locate all the entries using find
         collection.find().toArray(function(err, results) {
         test.assertEquals(1, results.length);
         test.assertTrue(results.a === 2);
         // Let's close the db
         client.close();
         });
         });
         };

         client.open(function(err, p_client) {
         client.collection('test_insert', test);
         });
         });*/
        socket.on('video', function(uid) {
            console.log("Saving png");
            var Canvas = require('canvas'), canvas = new Canvas(800, 400);
            var fs = require('fs');
            var sys = require('sys');
            var exec = require('child_process').exec;
            function doVideo(error, stdout, stderr) {
                sys.puts(stdout);
                sys.puts(stderr);

                var writtenNo = -1;
                var oldWrittenNo = -1;

                var draw = function(canvas, x, y, type, lineColor, lineWidth) {
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
                var writePng = function(canvas2, dir, i) {
                    dirpath = __dirname + "/" + dir;
                    var out = fs.createWriteStream(dirpath + '/canvas' + i + '.png'), stream = canvas2.createPNGStream();
                    stream.on('data', function(chunk) {
                        out.write(chunk);
                    });
                    stream.on('end', function() {
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
                for(var d = 0; d < datas.length; d++) {
                    if(datas[d] == null || datas[d] == undefined || datas[d] == "undefined") {
                        console.log("null or undefined data in datas[d] for d = " + d + "!");
                        continue;
                    }
                    xyz(d);
                }
                function xyz(d) {
                    setTimeout(function() {
                        try {
                            draw(canvas, datas[d].x, datas[d].y, datas[d].type, datas[d].lineColor, datas[d].lineWidth);
                        } catch(err) {
                            console.log("Error: " + err);
                            console.log("This is the datas[d] " + datas[d]);
                            return;
                        }

                        writePng(canvas, "test", d);
                    }, 50 * d);
                }

                var doneWriting = false;
                var t = setInterval(function() {
                    if(writtenNo != oldWrittenNo) {
                        oldWrittenNo = writtenNo;
                    } else {
                        console.log("Done!");
                        doneWriting = true;
                        clearInterval(t);
                        makeVideo();
                    }
                }, 100);
                function makeVideo() {
                    exec("./makeVideo.sh", doneMakingVideo);
                }

                function doneMakingVideo(error, stdout, stderr) {
                    console.log("Done making video!");
                    console.log(stdout);
                    console.log(error);
                    console.log(stderr);
                    socket.emit('madeVideo', {
                        uid : uid,
                    });
                }

            }


            console.log("Deleting files");
            // NOTE This is async. Beware!
            exec("./deleteFiles.sh", doVideo);
        });
        /**
         * Saves the canvas
         */
        var mongodb = require('mongodb');
        var server = new mongodb.Server("127.0.0.1", 27017, {});
        var db_connector = new mongodb.Db("coll_canv", server, {});

        socket.on('saveCanvas', function(data) {
            console.log("uid " + data.uid);
            db_connector.open(function(error, client) {
                console.log("What?");
                if(error)
                    throw error;
                var uid = data.uid;
                console.log("uid " + uid);
                var collection = new mongodb.Collection(client, uid);
                canvasName = data.canvasName;
                console.log("canvas name", canvasName);
                collection.insert({
                    type : "canvas",
                    canvasName : canvasName,
                    datas : datas,
                    timestamp : new Date().getTime()
                });
                console.log("Done inserting!");
                socket.emit('savedCanvas', {
                    uid : uid,
                });
                //client.close();
            });
        });
        socket.on('getCanvasList', function(data) {
            var uid = data.uid;
            db_connector.open(function(error, client) {
                if(error)
                    throw error;
                var collection = new mongoDb.Collection(client, uid);
                var cursor = collection.find({}, {'canvasName':1});
                var canvasList = [];
                cursor.each(function(err, doc) {
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
