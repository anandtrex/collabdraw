<!DOCTYPE html>
<html lang="en">
    <?
    require_once 'standard_auth.php';
    $auth = new Standard_Auth();
    if(!$auth->isLoggedIn()){
        $auth -> login("http://community.edb.utexas.edu/vt/canvas-draw/index.php");
    }
    ?>
    <head>
        <meta charset="utf-8">
        <title>Collaborative Whiteboard</title>
        <meta name="description" content="">
        <meta name="author" content="@anand">
        <!-- Le HTML5 shim, for IE6-8 support of HTML elements -->
        <!--[if lt IE 9]>
        <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
        <![endif]-->
        <!-- Le styles -->
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="user-scalable=no, width=device-width" />
        
        <link media="only screen and (max-device-width: 480px)" href="css/ipad.css" rel="stylesheet">
        <link media="screen and (min-device-width: 481px)" href="css/bootstrap.min.css" rel="stylesheet">
        
        <link href="css/style.css" rel="stylesheet">
        <!--
        <style type="text/css">
            /* Override some defaults */
            html, body {
                background-color: #eee;
            }
            body {
                padding-top: 40px; /* 40px to make the container go all the way to the bottom of the topbar */
            }
            .container > footer p {
                text-align: center; /* center align it with the container */
            }
            .container {
                width: 820px; /* downsize our container to make the content feel a bit tighter and more cohesive. NOTE: this removes two full columns from the grid, meaning you only go to 14 columns and not 16. */
            }
            /* The white background content wrapper */
            .content {
                background-color: #fff;
                padding: 20px;
                margin: 0 -20px; /* negative indent the amount of the padding to maintain the grid system */
                -webkit-border-radius: 0 0 6px 6px;
                -moz-border-radius: 0 0 6px 6px;
                border-radius: 0 0 6px 6px;
                -webkit-box-shadow: 0 1px 2px rgba(0,0,0,.15);
                -moz-box-shadow: 0 1px 2px rgba(0,0,0,.15);
                box-shadow: 0 1px 2px rgba(0,0,0,.15);
            }
            /* Page header tweaks */
            .page-header {
                background-color: #f5f5f5;
                padding: 20px 20px 10px;
                margin: -20px -20px 20px;
            }
            /* Styles you shouldn't keep as they are for displaying this base example only */
            .content .span10, .content .span4 {
                min-height: 500px;
            }
            /* Give a quick and non-cross-browser friendly divider */
            .content .span4 {
                margin-left: 0;
                padding-left: 19px;
                border-left: 1px solid #eee;
            }
            .topbar .btn {
                border: 0;
            }

        </style>-->
        <!-- Le fav and touch icons -->
        <link rel="shortcut icon" href="images/favicon.ico">
        <link rel="apple-touch-icon" href="images/apple-touch-icon.png">
        <link rel="apple-touch-icon" sizes="72x72" href="images/apple-touch-icon-72x72.png">
        <link rel="apple-touch-icon" sizes="114x114" href="images/apple-touch-icon-114x114.png">
    </head>
    <body>
        <div class="topbar">
            <div class="fill">
                <div class="container">
                    <a class="brand" href="#">Collaborative Whiteboard</a>
                    <ul class="nav">
                        <li class="active">
                            <a href="#">Home</a>
                        </li>
                        <li>
                            <a href="#about">About</a>
                        </li>
                        <li>
                            <a href="#contact">Contact</a>
                        </li>
                    </ul>
                    <div class="pull-right">
                        Welcome <? echo $auth->getUserName() ?>
                    </div>
                    <!--
                    <form action="" class="pull-right">
                        <input class="input-small" type="text" placeholder="Username">
                        <input class="input-small" type="password" placeholder="Password">
                        <button class="btn" type="submit">
                            Sign in
                        </button>
                    </form>-->
                </div>
            </div>
        </div>
        <div class="container">
            <div class="content">
                <div class="page-header">
                    <h1>Whiteboard <small>Draw on the whiteboard!</small></h1>
                </div>
                <div class="row">
                    <div class="span16" id="canvasDiv">
                        <article>
                            <canvas id="whiteboard" height="400" width="800"></canvas>
                        </article>
                    </div>
                </div>
                <div class="row">
                    <div id="savedMessage" class="alert-message info fade in span10" style="display: none; min-height: 0">
                                Saved.
                    </div>
                    <div class="span10" style="min-height: 50px">
                        <button class='btn primary' id='clear'>
                            Clear
                        </button>
                        <button class='btn primary' id='eraser'>
                            Eraser
                        </button>
                        <button class='btn primary' id='bluepen'>
                            Blue Pen
                        </button>
                        <button class='btn primary' id='getVideo'>
                            Get Video
                        </button>
                        <button class='btn primary' id='save'>
                            Save
                        </button>
                        <button class='btn primary' data-controls-modal="joinRoomDialog" id='join'>
                            Create/Join Room...
                        </button>
                        <div id="joinRoomDialog" class="modal fade span6">
                            <div class='modal-header'>
                                <a class="close" href="#">×</a>
                                <h3>Enter Room name. </h3>
                                <p>If the room doesn't exist already in your account, it will be created.</p>
                            </div>
                            <div class='modal-body'>
                                <label for='joinRoom'>Room name:</label>
                                <div class='input'>
                                    <input type='text' name='joinRoom' id="joinRoom" />
                                </div>
                            </div>
                            <div class='modal-footer'>
                                <a href="#" class="btn primary" id="doJoin">Join</a>
                                <a href="#" class="btn secondary" id="cancelJoin">Cancel</a>
                            </div>
                        </div>
                    </div>  
                    <div class="row">
                        <div class="span16" style="min-height: 0px">
                            <div id="waitmessage" class="alert-message info fade in span10" style="display: none; min-height: 0">
                                Please be patient. This may take some time.
                            </div>
                            <div id="html5video"></div>
                            <button class='btn primary' id='saveVideo' style="display:none">
                                Save current video
                            </button>
                        </div>
                    </div>
                </div>
                <footer>
                    <p>
                        &copy; Company 2011
                    </p>
                </footer>
            </div>
            <!-- /container -->
            <!--
            <script type="text/javascript" src="https://getfirebug.com/firebug-lite-debug.js"></script>
            -->
            
            <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js"></script>
            <script type="text/javascript" src="js/json2.js"></script>
            <script type="text/javascript" src="js/jquery.event.drag.js"></script>
            <script src="http://128.83.74.33:4001/socket.io/socket.io.js"></script>
            <script type="text/javascript" src="js/bootstrap-alerts.js"></script>
            <script type="text/javascript" src="js/bootstrap-modal.js"></script>
            <script type="text/javascript" src="scripts.js"></script>
    </body>
</html>
