var LocationPublisher = function(opts) {
	var options = opts || {};
	this.watchId = null;
	this.eventAggregator = options.events || null;
	this.throttle = options.throttle || 0;
	//base constructor
	EventAggregator.call(this);
	if (options.start !== false) {
		this.turnOn();
	}
};
//Inherit EventAggregator methods
LocationPublisher.prototype = new EventAggregator();

LocationPublisher.prototype.locationFound = function(pos) {
	var eventName = "locationFound";
	var position = {
		lat: pos.coords.latitude,
		long: pos.coords.longitude,
		accuracy: pos.coords.accuracy
	};
	this.trigger(eventName, position);
	//if an external event aggregator was passed in, trigger that too.
	if (this.eventAggregator) {
		this.eventAggregator.trigger(eventName, position);
	}
};

LocationPublisher.prototype.error = function(errorMessage) {
	throw new Error ("Error in LocationPublisher: " + errorMessage);
};

LocationPublisher.prototype.turnOn = function() {
	if (!navigator.geolocation) {
		this.error("Geolocation not supported");
	} else {
		this.watchId = navigator.geolocation.watchPosition(this.locationFound.bind(this), this.error.bind(this), { enableHighAccuracy: true });
	}
};

LocationPublisher.prototype.turnOff = function() {
	if (this.watchId && navigator.geolocation) {
		navigator.geolocation.clearWatch(this.watchId);
	}
	this.watchId = null;
};

LocationPublisher.prototype.getLocation = function(opts) {
	if (!navigator.geolocation) {
		this.error("Geolocation not supported");
	} else {
		var options = opts || {
			timeout: 10000,
			enableHighAccuracy: true
		};
		navigator.geolocation.getCurrentPosition(this.locationFound.bind(this), this.error.bind(this), options);
	}
};