var ExpressoAjax = new function() {
	
	var _id;
	
	var _debug;
	
	var _data = {};
	
	this.id = function(value) {
		if(value == undefined) return _id;
		var int = parseInt(String(value))
		_id = (isNaN(int))? 0 : int;
		_data[_id] = {};
		this.resource('').type('POST').params({}).done().always().fail(this.defaultErrorCallback);
		return this;
	};
	
	this.defaultErrorCallback = function(response) {
		if(response && response.error && response.error.message) alert(response.error.message);
	};
	
	this.debug = function(value) {
		if(value == undefined) return _debug;
		_debug = (String(value).toLowerCase() == 'true');
		return this;
	};
	
	this.resource = function(value) {
		if(value == undefined) return _data[_id].resource;
		_data[_id].resource = value;
		return this;
	};
	
	this.type = function(value) {
		if(value == undefined) return _data[_id].type;
		_data[_id].type = (value.toUpperCase() == 'GET')? 'GET' : 'POST';
		return this;
	};
	
	this.params = function(value) {
		if(value == undefined) return _data[_id].params;
		_data[_id].params = value;
		return this;
	};
	
	this.done = function(value) {
		_data[_id].done = value;
		return this;
	};
	
	this.fail = function(value) {
		_data[_id].fail = value;
		return this;
	};
	
	this.always = function(value) {
		_data[_id].always = value;
		return this;
	};
	
	this.url = function() {
		return '/index.php?menuaction=' + this.resource();
	};
	
	this.options = function(value) {
		for (var method in value)
			if(this.hasOwnProperty(method))
				this[method](value[method]);
		return this;
	};
	
	this.conf = function() {
		
		_data[_id].send = {};
		_data[_id].send.id = _id;
		_data[_id].send.params = this.params();
		
		var conf = {};
		conf.id		= _id;
		conf.type	= this.type();
		conf.url	= this.url();
		conf.data	= _data[_id].send;
		return conf;
	};
	
	this.execute = function() {
		var conf = this.conf();
		
		if (_debug) {
			console.log('ExpressoAjax - Execute:' + this.resource());
			console.log(conf);
		}
		
		jQuery.ajax(conf).done(function(response) {
			if (response && response.result) {
				if (_debug) {
					console.log('ExpressoAjax - DONE callback');
					console.log(JSON.stringify(response));
				}
				if (_data[this.id].done) _data[this.id].done(response.result,_data[this.id].send);
			} else {
				if (_debug) {
					console.log('ExpressoAjax - ERROR callback');
					console.log(JSON.stringify(response));
				}
				if (_data[this.id].fail) _data[this.id].fail(response,_data[this.id].send);
			}
		}).fail(function(response) {
			if (_debug) {
				console.log('ExpressoAjax - FAIL callback');
				console.log(JSON.stringify(response));
			}
			if (_data[this.id].fail) _data[this.id].fail(response,_data[this.id].send);
		}).always(function() {
			if (_debug) console.log('ExpressoAjax - ALWAYS callback');
			if (_data[this.id].always) _data[this.id].always(_data[this.id].send);
			delete _data[this.id];
		});
		this.id(_id+1);
		return this;
	};
}
ExpressoAjax.id(0);
