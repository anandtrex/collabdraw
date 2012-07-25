<!DOCTYPE html>
<?php 
require_once('config.php');
?>
<html>
<head>
    <title>Upload Files</title>
    <link rel="stylesheet" href="css/upload.css" type="text/css">
    <script type="text/javascript" src="js/upload.js"></script>
    <script type="text/javascript" src="js/delivery.js"></script>
    <script>
    var localUrl = "<?php echo $local_ip ?>";
    var nodejsPort = <?php echo $nodejs_port ?>;
    </script>
    
    <script src="http://<?php echo $local_ip.":".$nodejs_port ?>/socket.io/socket.io.js"></script>
</head>
<body>
<form id="form1" enctype="multipart/form-data" method="post" action="upload_file.php">
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
  <div><a href="index.php">Back to canvas</a></div>  
</form>
<div>
    Works only in Chrome
    <br />
    Does NOT work on Safari on Mac OS X
</div>
</body>
</html>
