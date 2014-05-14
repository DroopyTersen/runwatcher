module.exports = {
	index: function (req, res) {
		res.send({ test: "Test" });
	},
	broadcast: function(req, res) {
		res.send({ broadcast: "true"});
	}
};