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
},{"./GooglePath":3,"./GooglePin":4}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
exports.GoogleMap = require("./GoogleMap");
exports.GooglePin = require("./GooglePin");
exports.GooglePath = require("./GooglePath");
},{"./GoogleMap":2,"./GooglePath":3,"./GooglePin":4}],6:[function(require,module,exports){
var EventAggregator = require("droopy-events");
var GoogleMap = require("droopy-gmaps").GoogleMap;

var RunWatcher = function() {
	var events = new EventAggregator();
	var socket = io.connect('http://localhost:5000/realtime');
	// var socket = io.connect('http://runwatcher.azurewebsites.net/realtime');
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
			map.center(pos);
			//map.addPath("runner", [pos]);
		} else {
			map.movePin("runner", pos);
			map.center(pos);
			//map.appendPath("runner", pos);
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

module.exports = RunWatcher;
},{"droopy-events":1,"droopy-gmaps":5}],7:[function(require,module,exports){
var RunWatcher = require("./viewmodels/RunWatcher");
var vm = RunWatcher();
vm.init();
},{"./viewmodels/RunWatcher":6}]},{},[7])
