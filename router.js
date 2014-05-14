//Object
module.exports = {
	configureRoutes: function(app) {
		"use strict";
		var apiControllers = require("./api/controllers");

		app.get("/", function(req, res){
			res.redirect("/index.html");
		});
		//Api Routes
		app.get("/api/:controller/:action/:id", function(req, res) {
			apiControllers[req.params.controller.toLowerCase()][req.params.action.toLowerCase()](req, res);
		});
		
		app.get("/api/:controller/:action", function(req, res) {
			apiControllers[req.params.controller.toLowerCase()][req.params.action.toLowerCase()](req, res);
		});

		app.get("/api/:controller", function(req, res) {
			apiControllers[req.params.controller.toLowerCase()].index(req, res);
		});

		//Fallback for 404's
		app.use(function(req, res) {
			res.status(404);
			res.send({
				error: "404 - Not Found"
			});
		});
	}
};