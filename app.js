var express = require('express');
var favicon = require('serve-favicon');
var http = require('http');
var socketIo = require('socket.io');
var app = express();

app.use(favicon("web/images/favicon.ico"));
app.use(express.static(__dirname + "\\web"));
require("./router").configureRoutes(app);
app.use(express.static("web"));

var port = process.env.PORT || 5000;
var server = http.createServer(app);
var io = socketIo.listen(server);


io.of("/realtime").on('connection', function (socket) {
  socket.on('runner:broadcast', function (data) {
    socket.broadcast.emit("runner:locationPush", data);
  });
});
server.listen(port);
console.log("RunWatcher started on port " + port);
