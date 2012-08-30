(function()
{

    /*
     * Web sockets and associated handlers
     */
    var io = require('socket.io').listen(4001);
    var db = 'undefined';

    io.sockets.on('connection', function(socket)
    {
        socket.room = "one";
        var video = false;
        var exec = require('child_process').exec;
        var mongodb = require('mongodb');
        var server = new mongodb.Server("127.0.0.1", 27017, {});
        var db_connector = new mongodb.Db("coll_canv", server, {});

        var dl = require('delivery');
        var fs = require('fs');
        var delivery = dl.listen(socket);

        var allPaths = {};

        db_connector.open(function(error, client)
        {
            if (error)
                throw error;
            db = client;
        });

        socket.on('init', function(data)
        {
            console.log("PATHS IS " + JSON.stringify(allPaths));
            console.log("Initializing");

            // TODO compress datas before emitting
            if (socket.room && socket.room != data.room) {
                console.log("Leaving room " + socket.room);
                socket.leave(socket.room);

                console.log("Joining room " + data.room);
                socket.join(data.room);
                socket.room = data.room;
            }

            var pageNo = parseInt(data.page);
            var canvasName = data.room;
            console.log("canvas name", data.room);
            console.log("page", data.page);

            if (!allPaths[canvasName] || !allPaths[canvasName][pageNo]) {
                if (!allPaths[canvasName]) {
                    console.log("INITIALIZING allPaths[" + canvasName + "] to []");
                    allPaths[canvasName] = [];
                }

                //console.log("INITIALIZING allPaths[" + canvasName + "][" + pageNo + "] to []");
                //allPaths[canvasName][pageNo] = [];

                var collection = new mongodb.Collection(db, socket.room);
                var nPages = 0;
                var nPagesGot = false;

                if (!allPaths[canvasName]["nPages"]) {
                    console.log("GETTING number of pages");

                    collection.find({
                        type : "files_info",
                        canvas_name : canvasName,
                    }).toArray(function(err, results)
                    {
                        if (err)
                            throw err;

                        if (results.length == 0) {
                            nPages = 1;
                            console.log("NOTE: Canvas files information not found! This is probably because this canvas doesn't have any files associated with it")
                        } else {
                            nPages = results[results.length - 1].npages;
                            console.log("num pages was " + nPages);
                        }

                        allPaths[canvasName]["nPages"] = nPages;

                        console.log("Outside Paths is " + JSON.stringify(allPaths));
                        nPagesGot = true;
                    });
                } else {
                    nPagesGot = true;
                }

                console.log("GETTING data from db");

                collection.find({
                    type : "canvas",
                    canvas_name : canvasName,
                    page : pageNo,
                }).toArray(function(err, results)
                {
                    if (err)
                        throw err;
                    if (results.length == 0) {
                        console.log("EMPTY RESULTS");
                        allPaths[canvasName][pageNo] = [];
                        // Redundant, but here to make things clearer
                    } else {
                        // Only use the last result
                        //console.log("Got results " + JSON.stringify(results[results.length -
                        // 1].paths));
                        console.log("pageNo is " + pageNo);
                        console.log("Setting allPaths[" + canvasName + "][" + pageNo + "]");
                        allPaths[canvasName][pageNo] = results[results.length - 1].paths;
                        //setAllPaths(results[results.length - 1].paths, canvasName, pageNo);
                        console.log("allPaths is now " + JSON.stringify(allPaths));
                        while (allPaths[canvasName][pageNo].length > 1 && allPaths[canvasName][pageNo][0] == null) {
                            allPaths[canvasName][pageNo].shift();
                            console.log("Discarding top of allPaths");
                        }
                    }

                    console.log("Done retrieving!");
                    while (!nPagesGot);

                    socket.emit('draw-many', {
                        datas : allPaths[canvasName][pageNo],
                        page : pageNo,
                        npages : nPages,
                    });
                });

            } else {
                console.log("Already exists. Sending");
                console.log("Getting allPaths[" + canvasName + "][" + pageNo + "]");
                socket.emit('draw-many', {
                    datas : allPaths[canvasName][pageNo],
                    page : pageNo,
                    npages : allPaths[canvasName]["nPages"],
                });
                console.log("Paths is " + JSON.stringify(allPaths));
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
                    exec("python pdf2png.py " + "files/" + socket.room + "/" + file.name, function(error, stdout, stderr)
                    {
                        if (error)
                            throw error;
                        console.log("Done conversion!");
                        //console.log("stdout " + stdout);
                        //console.log("stderr " + stderr);
                        var lines = stdout.match(/^.*([\n\r]+|$)/gm);
                        //console.log("pages " + lines[lines.length - 2]);
                        var pages = parseInt(lines[lines.length - 2].replace(/(\r\n|\n|\r)/gm, ""));
                        var collection = new mongodb.Collection(db, socket.room);
                        collection.remove({
                            type : "files_info",
                            canvas_name : socket.room,
                        });
                        console.log("Inserting new saves");
                        collection.insert({
                            type : "files_info",
                            canvas_name : socket.room,
                            npages : pages,
                            timestamp : new Date().getTime()
                        });
                        socket.emit('pdf-conversion-done', {
                        });
                    });
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
                            url : "http://128.83.74.33:8888/collabdraw/" + url + "?" + Math.random() * 100,
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
            if (!allPaths[socket.room] || !allPaths[socket.room][page]) {
                if (!allPaths[socket.room]) {
                    allPaths[socket.room] = [];
                }
                allPaths[socket.room][page] = [];
            }
            for (d in singlePath) {
                data = singlePath[d];
                allPaths[socket.room][page].push(data);
            }
            socket.broadcast.to(socket.room).emit('draw', {
                singlePath : singlePath,
                page : input.page,
            });
        });

        socket.on('clear', function(data)
        {
            if (allPaths[socket.room])
                allPaths[socket.room][data.page] = [];
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
            var page = parseInt(data.page);
            canvasName = data.canvasName;

            var collection = new mongodb.Collection(db, socket.room);

            console.log("canvas name", canvasName);
            console.log("Removing old saves");
            collection.remove({
                type : "canvas",
                canvas_name : canvasName,
                page : page,
            });
            console.log("Inserting new saves");
            collection.insert({
                type : "canvas",
                canvas_name : canvasName,
                page : page,
                paths : allPaths[socket.room][page],
                timestamp : new Date().getTime()
            });
            console.log("Done inserting!");
            socket.emit('saved-canvas', {
                uid : uid,
                page : parseInt(page),
            });
        });

        socket.on('getCanvasList', function(data)
        {
            var uid = data.uid;
            db_connector.open(function(error, client)
            {
                if (error)
                    throw error;
                var collection = new mongoDb.Collection(client, socket.room);
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
                for (var d = 0; d < allPaths[socket.room][data.page].length; d++) {
                    if (allPaths[socket.room][data.page][d] == null || allPaths[socket.room][data.page][d] == undefined || allPaths[socket.room][data.page][d] == "undefined") {
                        console.log("null or undefined data in allPaths[socket.room][data.page][d] for d = " + d + "!");
                        continue;
                    }
                    xyz(d);
                }
                function xyz(d)
                {
                    setTimeout(function()
                    {
                        try {
                            draw(canvas, allPaths[socket.room][data.page][d].x, allPaths[socket.room][data.page][d].y, allPaths[socket.room][data.page][d].type, allPaths[socket.room][data.page][d].lineColor, allPaths[socket.room][data.page][d].lineWidth);
                        } catch(err) {
                            console.log("Error: " + err);
                            console.log("This is the allPaths[socket.room][data.page][d] " + allPaths[socket.room][data.page][d]);
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
