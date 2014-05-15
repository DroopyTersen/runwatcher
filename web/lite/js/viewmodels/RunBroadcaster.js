var RunBroadcaster = function() {
	var events = new EventAggregator();
	var socket = io.connect('http://localhost:5000/realtime');
	var locationPublisher = new LocationPublisher({
		events: events
	});
	var map = null;
	var running = false;
	var lastPosition = null;

	var eventHandlers = {
		startRun: function() {
			running = true;
			map.removePin("warmup");
			map.addPin("runner", lastPosition).animate();
			map.addPath("runner", [lastPosition]);
		},
		updateLocation: function(pos) {
			lastPosition = pos;
			console.log(pos);
			if (running) {
				socket.emit("runner:broadcast", pos);
			}
			if (!map) {
				createMap(pos);
				eventHandlers.startRun();

			} else {
				updateMap(pos);
			}
		}
	};

	var bindEvents = function() {
		events.on("locationFound", eventHandlers.updateLocation);
		events.on("startRun", eventHandlers.startRun);
	};

	var createMap = function(startingPosition) {
		map = new GoogleMap(document.getElementById("map-canvas"), startingPosition, 15);
		map.addPin("warmup", startingPosition);
	};

	var updateMap = function(pos) {
		if (running) {
			map.movePin("runner", pos);
			map.appendPath("runner", pos);
		} else {
			map.movePin("warmup", pos);
		}
	};


	var init = function() {
		bindEvents();
		locationPublisher.turnOn();
	};

	return {
		init: init,
		events: events
	};
};