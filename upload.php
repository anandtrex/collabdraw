<!DOCTYPE html>
<html>
<head>
    <title>Upload Files</title>
    <link rel="stylesheet" href="css/upload.css" type="text/css">
    <script type="text/javascript" src="js/upload.js"></script>
    <script type="text/javascript" src="js/delivery.js"></script>
    <!-- Replace localUrl with the nodejs server address -->
    <script>
    var localUrl = "192.168.1.5";
    </script>
    
    <!-- Replace this with the address of the node.js server -->
    <script src="http://128.83.74.33:4001/socket.io/socket.io.js"></script>
</head>
<body>
<form id="form1" enctype="multipart/form-data" method="post" action="upload_file.php">
  <div class="row">
    <label for="roomName">Type in room name to upload to</label><br />
    <input type="text" name="roomName" id="roomName"/>  
  </div>
  <div class="row">
    <label for="fileToUpload">Select a File to Upload</label><br />
    <input type="file" name="fileToUpload" id="fileToUpload" onchange="fileSelected();"/>  
  </div>
  <div class="row">
  <input type="button" onclick="uploadFile()" value="Upload" />
  </div>
  <div id="fileInfo">
    <div id="fileName"></div>
    <div id="fileSize"></div>
    <div id="fileType"></div>
  </div>
  <div class="row"></div>
  <div id="progressIndicator">
    <div id="uploadResponse"></div>
  </div>  
</form>
<div><a href="index.php">Back to canvas</a></div>
</body>
</html>
