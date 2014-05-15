/* 
 * Super Basic Pub/Sub Implmenation
*/
var Publisher = function() {
	this.lastSubscriberId = -1;
	this.subscriptions = {};
};

Publisher.prototype.publish = function(value) {
	var self = this;
	setTimeout(function(){
		for (var token in self.subscriptions) {
			if (self.subscriptions.hasOwnProperty(token)) {
				self.subscriptions[token](value);
			}
		}
	}, 0);
};

Publisher.prototype.subscribe = function(func) {
	if (typeof func !== "function") {
		return false;
	}
	var token = (++this.lastSubscriberId).toString();
	this.subscriptions[token] = func;
	return token;
};

Publisher.prototype.unsubscribe = function(token) {
	if (subscriptions[token]) {
		delete subscriptions[token];
		return token;
	} else {
		return false;
	}
};