enyo.kind({
    name: "Register",
    kind: "FittableRows",
    fit: true,

    published: {
        uid: 'test',
        room: 'one',
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
                    content: "Please Register"
                }, {
                    kind: "onyx.InputDecorator",
                    style: "text-align: left",
                    components: [{
                        content: "Login ID ",
                        style: "margin-right: 15px",
                    }, {
                        kind: "onyx.Input",
                        name: "loginId",
                        style: "float: right",
                    }, ],
                }, {
                    kind: "onyx.InputDecorator",
                    style: "text-align: left",
                    components: [{
                        content: "Password ",
                        style: "margin-right: 15px",
                    }, {
                        kind: "onyx.Input",
                        name: "loginPassword",
                        type: "password",
                        style: "float: right",
                    }],
                }, {
                    kind: "onyx.InputDecorator",
                    style: "text-align: left",
                    components: [{
                        content: "Re-enter Password ",
                        style: "margin-right: 15px",
                    }, {
                        kind: "onyx.Input",
                        name: "loginPasswordRepeat",
                        type: "password",
                        style: "float: right",
                    }],
                }, {
                    kind: "FittableColumns",
                    classes: "enyo-center",
                    style: "padding: 15px",
                    components: [{
                        kind: "onyx.Button",
                        style: "margin: 5px 5px 5px auto",
                        content: "Register",
                        ontap: "register",
                        name: "registerButton",
                    }, {
                        kind: "onyx.Button",
                        style: "margin: 5px auto 5px 5px",
                        content: "Back",
                        ontap: "goToApp"
                    }, ],
                }, {
                    kind: "FittableRows",
                    showing: false,
                    name: "registerResult",
                    style: "padding: 10px",
                    components: [{
                        name: "registerStatus",
                        allowHtml: true,
                        content: "",
                    }, ],
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

    register: function() {
        var loginid = this.$.loginId.getValue();
        var password = this.$.loginPassword.getValue();
        var repeatPassword = this.$.loginPasswordRepeat.getValue();
        if (password != repeatPassword) {
            this.$.registerStatus.setContent("<span style='color:red'>Passwords don't match</span>");
            this.$.registerResult.show();
            return;
        }
        var ajax = new enyo.Ajax({
            method: "POST",
            postBody: {
                url: "./register.html",
            },
            contentType: "application/json",
        });
        ajax.go({
            loginId: loginid,
            loginPassword: password,
        });
        ajax.response(this, "handleLoginResponse");
        console.log("User id and password are: " + loginid + ", " + password);
    },

    handleLoginResponse: function(inSender, inResponse) {
        console.log(JSON.stringify(inResponse));
        if (inResponse.result == "success") {
            window.location = "./index.html";
        } else if (inResponse.result == "conflict") {
            this.$.registerStatus.setContent("<span style='color:red'>Login ID already exists</span>");
        } else {
            this.$.registerStatus.setContent("<span style='color:red'>Error occurred. Try again.</span>");
        }
        this.$.registerResult.show();
    },
});
