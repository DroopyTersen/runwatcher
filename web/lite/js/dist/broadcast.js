(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var EventAggregator = function() {
	this.eventKeys = {};
	this.lastSubscriptionId = -1;
};

EventAggregator.prototype.on = function(key, callback) {
	if (typeof callback === "function") {
		if (!this.eventKeys[key]) {
			this.eventKeys[key] = {
				subscriptions: {}
			};
		}
		var token = (++this.lastSubscriptionId).toString();
		this.eventKeys[key].subscriptions[token] = callback;
		return token;
	} else {
		return false;
	}
};

EventAggregator.prototype.off = function(key, tokenOrCallback) {
	if (typeof tokenOrCallback === 'function') {
		//Callback reference was passed in so find the subscription with the matching function
		if (this.eventKeys[key]) {
			var eventSubscriptions = this.eventKeys[key].subscriptions;
			var matchingId = null;
			//foreach subscription see if the functions match and save the key if yes
			for (var subscriptionId in eventSubscriptions) {
				if (eventSubscriptions.hasOwnProperty(subscriptionId)) {
					if (eventSubscriptions[subscriptionId] === tokenOrCallback) {
						matchingId = subscriptionId;
					}
				}
			}
			if (matchingId !== null) {
				delete eventSubscriptions[matchingId];
			}
		}
	} else {
		//Token was passed in
		if (this.eventKeys[key] && this.eventKeys[key].subscriptions[tokenOrCallback]) {
			delete this.eventKeys[key].subscriptions[tokenOrCallback];
		}
	}
};

EventAggregator.prototype.trigger = function(key) {
	var self = this;
	if (self.eventKeys[key]) {
		var values = Array.prototype.slice.call(arguments, 1);
		//If passing less than values pass them individually
		var a1 = values[0],
			a2 = values[1],
			a3 = values[2];
		//Else if passing more than 3 values group as an args array
		if (values.length > 3) {
			a1 = values;
		}

		var subscriptions = self.eventKeys[key].subscriptions;
		setTimeout(function() {
			for (var token in subscriptions) {
				if (subscriptions.hasOwnProperty(token)) {
					subscriptions[token](a1, a2, a3);
				}
			}
		}, 0);
	}
};

module.exports = EventAggregator;
},{}],2:[function(require,module,exports){
var EventAggregator = require("droopy-events");

var FakeLocationPublisher = function(opts) {
	var options = opts || {};
	this.timer = null;
	EventAggregator.call(this);
	this.pos = { lat: 43, long: -88, accuracy: 10 };
	this.interval = options.throttle || 200;
	this.eventAggregator = options.events || null;
	if (options.start !== false) {
		this.turnOn();
	}
};

FakeLocationPublisher.prototype = new EventAggregator();

FakeLocationPublisher.prototype.locationFound = function() {
	var eventName = "locationFound";
	this.pos.lat = this.pos.lat + 0.00005;
	this.pos.long = this.pos.long - 0.00004;
	this.pos.timestamp = (new Date()).toJSON();
	
	this.trigger(eventName, this.pos);
	//if an external event aggregator was passed in, trigger that too.
	if (this.eventAggregator) {
		this.eventAggregator.trigger(eventName, this.pos);
	}
};

FakeLocationPublisher.prototype.turnOn = function() {
	this.timer = setInterval(this.locationFound.bind(this), this.interval);
};

FakeLocationPublisher.prototype.turnOff = function() {
	if (this.timer) {
		clearTimeout(this.timer);
	}
};

module.exports = FakeLocationPublisher;
},{"droopy-events":1}],3:[function(require,module,exports){
var EventAggregator = require("droopy-events");

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

module.exports = LocationPublisher;
},{"droopy-events":1}],4:[function(require,module,exports){
exports.LocationPublisher = require('./LocationPublisher');
exports.FakeLocationPublisher = require('./FakeLocationPublisher');
},{"./FakeLocationPublisher":2,"./LocationPublisher":3}],5:[function(require,module,exports){
if (!google || !google.maps) {
	throw "Error: Google Maps scripts haven't been loaded yet.";
}
var Coord = google.maps.LatLng;

var GooglePin = require("./GooglePin");
var GooglePath = require("./GooglePath");

//Assumes all the google javascript has already been pulled down
var GoogleMap = function(element, pos, zoom, options) {
	var mapOptions = options || {};
	mapOptions.center = new Coord(pos.lat, pos.long);
	mapOptions.zoom = zoom || 12;
	this._map = new google.maps.Map(element, mapOptions);
	this._pins = {};
	this._paths = {};
};

// == PINS ==
GoogleMap.prototype.addPin = function(key, pos, options) {
	this._pins[key] = new GooglePin(this._map, pos, options);
	return this._pins[key];
};

GoogleMap.prototype.movePin = function(key, pos) {
	this._pins[key].move(pos.lat, pos.long);
};

GoogleMap.prototype.getPin = function(key) {
	return this._pins[key];
};
GoogleMap.prototype.removePin = function(key) {
	var pin = this._pins[key];
	if (pin) {
		pin._pin.setMap(null);
		delete this._pins[key];
	}
};
GoogleMap.prototype.center = function(pos) {
	this._map.setCenter(new Coord(pos.lat, pos.long));
};
// == PATHS ==
GoogleMap.prototype.addPath = function(key, points, options) {
	this._paths[key] = new GooglePath(this._map, points, options);
};
GoogleMap.prototype.getPath = function(key) {
	return this._paths[key];
};
GoogleMap.prototype.appendPath = function(key, pos) {
	this._paths[key].addPoint(pos);
};
GoogleMap.prototype.removePath = function(key) {
	var path = this._paths[key];
	if (path) {
		path._path.setMap(null);
		delete this._paths[key];
	}
};

module.exports = GoogleMap;
},{"./GooglePath":6,"./GooglePin":7}],6:[function(require,module,exports){
if (!google || !google.maps) {
  throw "Error: Google Maps scripts haven't been loaded yet.";
}
var Coord = google.maps.LatLng;
var GooglePath = function(map, points, options) {
  this._map = map;
  var pathOptions = options || {
    geodesic: true,
    strokeColor: '#16e',
    strokeOpacity: 0.8,
    strokeWeight: 2.5
  };
  pathOptions.map = this._map;
  pathOptions.path = points.map(function(pos) {
    return new Coord(pos.lat, pos.long);
  });
  this._path = new google.maps.Polyline(pathOptions);
};

GooglePath.prototype.addPoint = function(pos) {
  var points = this._path.getPath();
  points.push(new Coord(pos.lat, pos.long));
  this._path.setPath(points);
};

module.exports = GooglePath;
},{}],7:[function(require,module,exports){
if (!google || !google.maps) {
  throw "Error: Google Maps scripts haven't been loaded yet.";
}
var Coord = google.maps.LatLng;
var GooglePin = function(map, pos, options) {
  this._map = map;
  this.pos = pos;
  var pinOptions = options || {
    draggable: false
  };
  pinOptions.map = map;
  pinOptions.position = new Coord(pos.lat, pos.long);
  this._pin = new google.maps.Marker(pinOptions);
};

GooglePin.prototype.move = function(lat, long) {
  this._pin.setPosition(new Coord(lat, long));
};

GooglePin.prototype.animate = function(onOrOff) {
  var animation = onOrOff === false ? null : google.maps.Animation.BOUNCE;
  this._pin.setAnimation(animation);
};

module.exports = GooglePin;
},{}],8:[function(require,module,exports){
exports.GoogleMap = require("./GoogleMap");
exports.GooglePin = require("./GooglePin");
exports.GooglePath = require("./GooglePath");
},{"./GoogleMap":5,"./GooglePath":6,"./GooglePin":7}],9:[function(require,module,exports){
var RunBroadcaster = require("./viewmodels/RunBroadcaster");
  var vm = RunBroadcaster();
  vm.init();
},{"./viewmodels/RunBroadcaster":10}],10:[function(require,module,exports){
var EventAggregator = require("droopy-events");
var droopyGps = require("droopy-geolocation");
var GoogleMap = require("droopy-gmaps").GoogleMap;

var RunBroadcaster = function() {
	var events = new EventAggregator();
	var socket = io.connect('http://localhost:5000/realtime');
	// var socket = io.connect('http://runwatcher.azurewebsites.net/realtime');
	var locationPublisher = new droopyGps.FakeLocationPublisher({
		events: events
	});
	var map = null;
	var running = true;
	var lastPosition = null;

	var eventHandlers = {
		startRun: function() {
			running = true;
			map.addPin("runner", lastPosition).animate();
			map.addPath("runner", [lastPosition]);
		},
		updateLocation: function(pos) {
			lastPosition = pos;
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
		locationPublisher.on("locationFound", eventHandlers.updateLocation);
		events.on("startRun", eventHandlers.startRun);
	};

	var createMap = function(startingPosition) {
		map = new GoogleMap(document.getElementById("map-canvas"), startingPosition, 15);
		//ap.addPin("warmup", startingPosition);
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

module.exports = RunBroadcaster;

},{"droopy-events":1,"droopy-geolocation":4,"droopy-gmaps":8}]},{},[9])
