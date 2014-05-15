var FakeLocationPublisher = function(opts) {
	var options = opts || {};
	this.timer = null;
	EventAggregator.call(this);
	this.pos = { lat: 43, long: -88, accuracy: 10 }
	this.interval = options.throttle || 200;
	this.eventAggregator = options.events || null;
	if (options.start !== false) {
		this.turnOn();
	}
};

FakeLocationPublisher.prototype = new EventAggregator();

FakeLocationPublisher.prototype.locationFound = function() {
	var eventName = "locationFound";
	this.pos.lat = this.pos.lat + .00005;
	this.pos.long = this.pos.long - .00004;
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
}
