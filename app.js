var express = require('express');
var favicon = require('serve-favicon');
var app = express();

app.use(favicon("web/images/favicon.ico"));
app.use(express.static(__dirname + "\\web"));
require("./router").configureRoutes(app);
app.use(express.static("web"));

var port = process.env.PORT || 5000;
app.listen(port);

console.log("RunWatcher started on port " + port);
