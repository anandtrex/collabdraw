(function()
{

    /*
     * Web sockets and associated handlers
     */
    var io = require('socket.io').listen(4001);
    var exec = require('child_process').exec;
    var video = false;
    var db = 'undefined';

    var paths = [];

    io.sockets.on('connection', function(socket)
    {
        socket.room = "one";

        var mongodb = require('mongodb');
        var server = new mongodb.Server("127.0.0.1", 27017, {});
        var db_connector = new mongodb.Db("coll_canv", server, {});

        var dl = require('delivery');
        var fs = require('fs');
        var delivery = dl.listen(socket);

        db_connector.open(function(error, client)
        {
            if (error)
                throw error;
            db = client;
        });

        socket.on('init', function(data)
        {
            console.log("Initializing");
            // TODO compress datas before emitting
            if (socket.room) {
                console.log("Leaving room " + socket.room);
                socket.leave(socket.room);
            }

            console.log("Joining room " + data.roomName);
            console.log("canvas name", data.roomName);
            console.log("page", data.page);

            socket.join(data.roomName);
            socket.room = data.roomName;
            var page = data.page;

            if (!paths[socket.room] || !paths[socket.room][page]) {
                if (!paths[socket.room]) {
                    paths[socket.room] = [];
                }
                paths[socket.room][page] = [];
                console.log("Getting data from db");

                var collection = new mongodb.Collection(db, data.uid);
                canvasName = data.roomName;
                collection.find({
                    canvas_name : data.roomName,
                    page : data.page,
                }).toArray(function(err, results)
                {
                    if (err)
                        throw err;
                    if (results.length == 0) {
                        paths[socket.room][page] = [];
                    } else {
                        paths[socket.room][page] = results[results.length - 1].paths;
                    }

                    while (paths[socket.room][page].length > 1 && paths[socket.room][page][0] == null) {
                        paths[socket.room][page].shift();
                        console.log("Discarding top of paths");
                    }

                    socket.emit('draw-many', {
                        datas : paths[socket.room][page],
                        page : data.page,
                    });
                });
                console.log("Done retrieving!");
            } else {
                socket.emit('draw-many', {
                    datas : paths[socket.room][page],
                    page : data.page,
                });
            }
        });

        delivery.on('receive.success', function(file)
        {
            try {
                // Query the entry
                stats = fs.lstatSync("files/" + socket.room);

                // Is it a directory?
                if (stats.isDirectory()) {
                    // Yes it is
                    // So do nothing
                    // Throws an exception if the directory doesn't exist
                } else {
                    console.log("ERROR: File exists but not a directory!");
                }
            } catch (e) {
                // Create the directory
                fs.mkdirSync("files/" + socket.room);
            }

            fs.writeFile("files/" + socket.room + "/" + file.name, file.buffer, function(err)
            {
                if (err) {
                    console.log('File could not be saved.');
                } else {
                    console.log('File saved.');
                    exec("python pdf2png.py " + "files/" + socket.room + "/" + file.name, donePdf2pngConversion);
                    function donePdf2pngConversion()
                    {
                        console.log("Done conversion!");
                        socket.emit('pdf-conversion-done', {
                        });
                    }

                };
            });
        });

        socket.on('get-image', function(data)
        {
            var uid = data.uid;
            var page = data.page;
            var url = "files/" + socket.room + "/" + page + "_image.png";
            // http://128.83.74.33:8888/collabdraw
            console.log("hmm " + url);

            var fs = require('fs');
            try {
                // Query the entry
                stats = fs.lstatSync(url);

                // Is it a file?
                if (stats.isFile()) {
                    var gm = require('gm');

                    gm(url).size(function(err, value)
                    {
                        if (err)
                            throw err;
                        console.log("gm value " + JSON.stringify(value));
                        socket.emit('image', {
                            url : "http://128.83.74.33:8888/collabdraw/" + url + "?1",
                            page : page,
                            width : value.width,
                            height : value.height,
                        });
                    });
                }
            } catch (e) {
                socket.emit('image', {
                    url : "",
                    page : page,
                    width : 0,
                    height : 0,
                });
            }
        });

        socket.on('draw-click', function(input)
        {
            console.log("Receiving path");
            var singlePath = input.singlePath;
            var page = input.page;
            var data = {};
            if (!paths[socket.room] || !paths[socket.room][page]) {
                if(!paths[socket.room]){
                    paths[socket.room] = [];
                }
                paths[socket.room][page] = [];
            }
            for (d in singlePath) {
                data = singlePath[d];
                paths[socket.room][page].push(data);
            }
            socket.broadcast.to(socket.room).emit('draw', {
                singlePath : singlePath,
                page : input.page,
            });
        });

        socket.on('clear', function(data)
        {
            paths[socket.room][data.page] = [];
            socket.broadcast.to(socket.room).emit('clear', {
                uid : data.uid,
                page : data.page,
            });
        });

        /**
         * Saves the canvas
         */
        socket.on('save-canvas', function(data)
        {
            console.log("Saving canvas");
            var uid = data.uid;
            var page = data.page;
            canvasName = data.canvasName;

            var collection = new mongodb.Collection(db, uid);

            console.log("canvas name", canvasName);
            console.log("Removing old saves");
            collection.remove({
                canvas_name : canvasName,
                page : page
            });
            console.log("Inserting new saves");
            collection.insert({
                type : "canvas",
                canvas_name : canvasName,
                page : page,
                paths : paths[socket.room][page],
                timestamp : new Date().getTime()
            });
            console.log("Done inserting!");
            socket.emit('saved-canvas', {
                uid : uid,
                page : page,
            });
        });

        socket.on('getCanvasList', function(data)
        {
            var uid = data.uid;
            db_connector.open(function(error, client)
            {
                if (error)
                    throw error;
                var collection = new mongoDb.Collection(client, uid);
                var cursor = collection.find({}, {
                    'canvasName' : 1
                });
                var canvasList = [];
                cursor.each(function(err, doc)
                {
                    if (err)
                        console.log("Error cursor: " + err);
                    console.log("doc: " + JSON.stringify(doc));
                });
                socket.emit('canvasList', {
                    canvasList : canvasList,
                })
            });
        });

        socket.on('video', function(data)
        {
            if (video == false) {
                socket.emit('message', {
                    message : "This is not available at this time. Please try again later."
                })
                return;
            }
            console.log("Saving png");
            var Canvas = require('canvas'), canvas = new Canvas(920, 550);
            var sys = require('sys');

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
                    if (type === "dragstart" || type === "touchstart") {
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                    } else if (type === "drag" || type === "touchmove") {
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
                for (var d = 0; d < paths[socket.room][data.page].length; d++) {
                    if (paths[socket.room][data.page][d] == null || paths[socket.room][data.page][d] == undefined || paths[socket.room][data.page][d] == "undefined") {
                        console.log("null or undefined data in paths[socket.room][data.page][d] for d = " + d + "!");
                        continue;
                    }
                    xyz(d);
                }
                function xyz(d)
                {
                    setTimeout(function()
                    {
                        try {
                            draw(canvas, paths[socket.room][data.page][d].x, paths[socket.room][data.page][d].y, paths[socket.room][data.page][d].type, paths[socket.room][data.page][d].lineColor, paths[socket.room][data.page][d].lineWidth);
                        } catch(err) {
                            console.log("Error: " + err);
                            console.log("This is the paths[socket.room][data.page][d] " + paths[socket.room][data.page][d]);
                            return;
                        }

                        writePng(canvas, "test", d);
                    }, 50 * d);
                }

                var doneWriting = false;
                var t = setInterval(function()
                {
                    if (writtenNo != oldWrittenNo) {
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
            exec("./delete_files.sh", doVideo);
            video = false;
        });

    });
}).call(this);
