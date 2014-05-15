var RunWatcher = function() {
	var events = new EventAggregator();
	var socket = io.connect('http://192.168.50.168:5000/realtime');
	var map = null;

	var bindEvents = function() {
		socket.on("runner:locationPush", updateMap);
	};
	var createMap = function() {
		var startingPosition = { lat: 43, long: -88, accuracy: 10 };
		map = new GoogleMap(document.getElementById("map-canvas"), startingPosition, 15);
	};

	var updateMap = function(pos) {
		if (!map.getPin("runner")) {
			map.addPin("runner", pos).animate();
			map.addPath("runner", [pos]);
		} else {
			map.movePin("runner", pos);
			map.appendPath("runner", pos);
		}
	};

	var init = function() {
		bindEvents();
		createMap();
	};

	return {
		init: init
	};
};