<!DOCTYPE html>
<?php 
require_once('config.php');
?>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"> 
    <title>Canvas Touch</title>

    <link rel="stylesheet" href="touch/resources/css/sencha-touch.css" type="text/css">
    <link rel="stylesheet" href="app.css" type="text/css">
    
    <!-- Replace localUrl with the nodejs server address -->
    <script>
    var localUrl = "<?php echo $local_ip ?>";
    var nodejsPort = <?php echo $nodejs_port ?>;
    </script>
    
    <!-- Replace with the nodejs server address -->
    <script src="http://<?php echo $local_ip.":".$nodejs_port ?>/socket.io/socket.io.js"></script>
    <script type="text/javascript" src="js/raphael-min.js"></script>
    <script type="text/javascript" src="js/upload.js"></script>
    <script type="text/javascript" src="js/delivery.js"></script>    
    <script type="text/javascript" src="touch/sencha-touch-all-debug.js"></script>
    <script type="text/javascript" src="app.js"></script>
    

</head>
<body></body>
</html>
