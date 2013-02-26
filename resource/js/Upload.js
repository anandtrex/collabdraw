enyo.kind({
    name: "Upload",
    kind: "FittableRows",
    fit: true,

    published: {
        whiteboard: '',
        curves: {
            color: 'black',
            width: '3px',
        },
        uid: 'test',
        room: 'one',
        canvasWidth: 1000,
        canvasHeight: 550,
        appIpAddress: "",
        appPort: "",
    },

    components: [{
        kind: "FittableRows",
        fit: true,
        components: [{
            kind: "FittableColumns",
            style: "padding: 20px; z-index: 0; margin-top: 50px;",
            classes: "enyo-center",
            width: '500px',
            height: '500px',
            fit: false,
            components: [{
                kind: "onyx.Groupbox",
                components: [{
                    kind: "onyx.GroupboxHeader",
                    content: "Select a pdf file to upload"
                }, {
                    kind: "onyx.InputDecorator",
                    components: [{
                        kind: "enyo.Input",
                        type: "file",
                        name: "fileInput",
                        onchange: "fileSelected",
                    }],
                }, {
                    kind: "FittableColumns",
                    classes: "enyo-center",
                    style: "padding: 15px",
                    components: [{
                        kind: "onyx.Button",
                        style: "margin: 5px 5px 5px auto",
                        content: "Upload",
                        ontap: "uploadFile",
                        name: "uploadButton",
                    }, {
                        kind: "onyx.Button",
                        style: "margin: 5px auto 5px 5px",
                        content: "Back",
                        ontap: "goToApp"
                    }, ],
                }, {
                    kind: "onyx.ProgressBar",
                    progress: 0,
                    name: "fileUploadProgress",
                    showing: false,
                }, {
                    kind: "FittableRows",
                    showing: false,
                    name: "fileInfo",
                    style: "padding: 10px",
                    components: [{
                        name: "fileName",
                        style: "color:#808080",
                    }, {
                        name: "fileSize",
                        style: "color:#808080",
                    }, {
                        name: "fileType",
                        style: "color:#808080",
                    }, {
                        name: "uploadStatus",
                        allowHtml: true,
                        content: "Press the upload button to upload",
                    },],
                }, ],

            }, ],
        }, ],
    }, {
        kind: "onyx.Toolbar",
        components: [{
            kind: "onyx.Button",
            content: "Back",
            ontap: "goToApp"
        }, ],
    }],

    goToApp: function() {
        window.location = "./index.html";
    },

    uploadFile: function(inSender, inEvent) {

        var progressBar = this.$.fileUploadProgress;
        var uploadStatus = this.$.uploadStatus;

        uploadStatus.setContent("Uploading file");
        progressBar.show()

        var xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', function(ev) {
            console.log((ev.loaded * 100 / ev.total) + '%');
            progressBar.setProgress((ev.loaded * 100 / ev.total));
        }, false);

        xhr.onreadystatechange = function(ev) {
            if (this.readyState == this.DONE) {
                console.log("Done");
                uploadStatus.setContent("File uploaded. <br/> Press back to go back to main page");
            }
        };
        xhr.open('POST', "./upload", true);
        var file = this.$.fileInput.node.files[0];
        var data = new FormData();
        data.append('file', file);
        xhr.send(data);
    },

    fileSelected: function(inSender, inEvent) {
        this.$.uploadButton.setDisabled(false);
        this.$.uploadStatus.setContent("Press the upload button to upload");
        var file = this.$.fileInput.node.files[0];

        var fileSize = 0;
        if (file.size > 1024 * 1024) fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
        else fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';

        console.log("File name is: " + file.name);
        this.$.fileName.setContent('Name: ' + file.name);
        this.$.fileSize.setContent('Size: ' + fileSize);
        this.$.fileType.setContent('Type: ' + file.type);

        if(file.type != "application/pdf"){
            this.$.uploadStatus.setContent("<span style='color:red'>Only pdf files allowed <br/> Please select a pdf file</span>");
            this.$.uploadButton.setDisabled(true);
        }

        this.$.fileInfo.show();
    },
});
