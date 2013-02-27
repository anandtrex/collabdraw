enyo.kind({
    name: "Login",
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
                    content: "Please Login"
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
                    kind: "FittableColumns",
                    classes: "enyo-center",
                    style: "padding: 15px",
                    components: [{
                        kind: "onyx.Button",
                        style: "margin: 5px 5px 5px auto",
                        content: "Login",
                        ontap: "login",
                        name: "loginButton",
                    }, {
                        kind: "onyx.Button",
                        style: "margin: 5px auto 5px 5px",
                        content: "Back",
                        ontap: "goToApp"
                    }, {
                        kind: "onyx.Button",
                        style: "margin: 5px auto 5px 5px",
                        content: "Register",
                        ontap: "goToRegister"
                    }, ],
                }, {
                    kind: "FittableRows",
                    showing: false,
                    name: "loginResult",
                    style: "padding: 10px",
                    components: [{
                        name: "loginStatus",
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

    goToRegister: function() {
        window.location = "./register.html";
    },

    login: function() {
        var loginid = this.$.loginId.getValue();
        var password = this.$.loginPassword.getValue();
        console.log("User id and password are: " + loginid + ", " + password);
        var ajax = new enyo.Ajax({
            method: "POST",
            postBody: {
                url: "./login.html",
            },
            contentType: "application/json",
        });
        ajax.go({
            loginId: loginid,
            loginPassword: password,
        });
        ajax.response(this, "handleLoginResponse");
    },

    handleLoginResponse: function(inSender, inResponse) {
        console.log("Response");
        console.log(JSON.stringify(inResponse));
        if (inResponse.result == "success") {
            window.location = "./index.html";
        } else if (inResponse.result == "failure") {
            this.$.loginStatus.setContent("<span style='color:red'>Wrong username/password</span>");
        } else {
            this.$.loginStatus.setContent("<span style='color:red'>Error occurred. Try again.</span>");
        }
        this.$.loginResult.show();
    },
});
