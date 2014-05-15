var Coord = google.maps.LatLng;

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

var GooglePath = function(map, points, options) {
	this._map = map;
	var pathOptions = options || {
		geodesic: true,
		strokeColor: '#16e',
		strokeOpacity: .8,
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