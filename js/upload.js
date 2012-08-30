function fileSelected()
{
    var file = document.getElementById('fileToUpload').files[0];
    var fileSize = 0;
    if (file.size > 1024 * 1024)
        fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
    else
        fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';
    document.getElementById('fileInfo').style.display = 'block';
    document.getElementById('fileName').innerHTML = 'Name: ' + file.name;
    document.getElementById('fileSize').innerHTML = 'Size: ' + fileSize;
    document.getElementById('fileType').innerHTML = 'Type: ' + file.type;
}

function uploadFile()
{
    var socket = io.connect('http://'+localUrl+':'+nodejsPort);

    socket.on('connect', function()
    {
        var delivery = new Delivery(socket);

        delivery.on('delivery.connect', function(delivery)
        {
            delivery.send(document.getElementById('fileToUpload').files[0]);
        });

        delivery.on('send.success', function(fileUID)
        {
            console.log("file was successfully sent.");
            var uploadResponse = document.getElementById('uploadResponse');
            uploadResponse.style.display = 'block';
            uploadResponse.innerHTML = "Please wait... (this may take a few seconds to a few mintues depending on how large your file is)";
            socket.on('pdf-conversion-done', function(){
                uploadResponse.innerHTML = "File successfully sent";
            })
        });
    });
}
