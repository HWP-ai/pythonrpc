/*-*-* python rpc js client *-*-*/

const request = require('request');

function dexxquote(session, x){
	if(["number", "string", "boolean"].indexOf(typeof x) >= 0){
		return x;
	}
	if(x == null){
		return null;
	}
	if(x.hasOwnProperty('real')){
		return x; // complex number
	}
	if(x.hasOwnProperty('id')){
		return new RemoteProgressObject(session, x.id);
	};
	if(x.constructor == Array){
		for(var i=0; i<x.length; ++i){
			if(["number", "string", "boolean"].indexOf(typeof x[i])
				|| (x[i] == null)
				|| (x[i].hasOwnProperty('real'))){
				continue;
			}
			x[i] = dexxquote(session, x[i]);
		}
		return x;
	}
	if(x.constructor == Object){		
		for(var key in x){
			if(x.hasOwnProperty(key)){
				if((["number", "string", "boolean"].indexOf(typeof x[key]) >= 0)
					|| (x[key] == null)
					|| (x[key].hasOwnProperty('real'))){
					continue;
				}
				x[key] = dexxquote(session, x[key]);
			}
		}
		return x;
	}
	//console.log(x);
	throw 'dexxquote error';
}

function yyquote(x){
	if(x.constructor == RemoteProgressObject){
		return {
			id: x.id()
		}
	}
	if(["number", "string", "boolean"].indexOf(typeof x) >= 0){
		return x;
	}
	if(x == null){
		return null;
	}
	if(x.hasOwnProperty('real')){
		return x; // complex number
	}
	if(x.constructor == Array){
		for(var i=0; i<x.length; ++i){
			if((["number", "string", "boolean"].indexOf(typeof x[i]) >= 0)
				|| (x[i] == null)
				|| (x[i].hasOwnProperty('real'))){
				continue;
			}
			x[i] = yyquote(x[i]);
		}
		return x;
	}
	if(x.constructor == Object){		
		for(var key in x){
			if(x.hasOwnProperty(key)){
				if((["number", "string", "boolean"].indexOf(typeof x[key]) >= 0)
					|| (x[key] == null)
					|| (x[key].hasOwnProperty('real'))){
					continue;
				}
				x[key] = yyquote(x[key]);
			}
		}
		return x;
	}
	throw 'dexxquote error';
}

function RemoteProgressObject(session, id){
	this._session = session;
	this._id = id;
}

RemoteProgressObject.prototype.id = function(){
	return id;
}

RemoteProgressObject.prototype.attr = function(name){
	return new Promise((function(resolve, reject){
		request.post({
			url: this._session.prefix() + '/access_attr',
			json: true,
			form: {
				sessionid: this._session.sessionid(),
				internalid: this._id,
				attr: name
			}
		},
		(err, res, body) => {
			if(err){
				reject('http error');
			}
			if(body.undefined == 1){
				reject('undefined behavior');
			}
			if(!(body.success == 1)){
				reject('failed behavior');
			}
			//console.log(body);
			w = dexxquote(this._session, body.attr);
			resolve(w);
		})
	}).bind(this));
}

RemoteProgressObject.prototype.call = function(args, kwargs){
	var yyargs = yyquote(args || []);
	var yykwargs = yyquote(kwargs || {});
	return new Promise((function(resolve, reject){
		request.post({
			url: this._session.prefix() + '/apply_callable',
			json: true ,
			form: {
				sessionid: this._session.sessionid(),
				internalid: this._id,
				args: JSON.stringify(yyargs),
				kwargs: JSON.stringify(yykwargs)
			}
		},
		(err, res, body) => {
			if(err){
				reject('http error');
			}
			if(body.undefined == 1){
				reject('undefined behavior');
			}
			if(!(body.success == 1)){
				reject('failed behavior');
			}
			//console.log(body);
			var result = dexxquote(this._session, body.result);
			resolve(result);
		});
	}).bind(this));
};

RemoteProgressObject.prototype.del_ref = function(){	
	return new Promise((function(resolve, reject){
		request.post({
			url: this._session.prefix() + '/del_lit_ref',
			json: true ,
			form: {
				sessionid: this._session.sessionid(),
				internalid: this._id
			}
		},
		(err, res, body) => {
			if(err){
				reject('http error');
			}
			if(body.undefined == 1){
				reject('undefined behavior');
			}
			if(!(body.success == 1)){
				reject('failed behavior');
			}
			resolve();
		});
	}).bind(this));
}

RemoteProgressObject.prototype.del_session = function(){
	this._session.del();
}

function Session(prefix, sessionid){
	this._prefix = prefix;
	if(!sessionid){
		throw 'Sessionid error';
	} else {
		this._sessionid = sessionid;
	}
};

Session.prototype.prefix = function(){
	return this._prefix;
}

Session.prototype.sessionid = function(){
	return this._sessionid;
};

Session.prototype.require_module = function(name){
	return new Promise((function(resolve, reject){
		request.post({
			url: this._prefix + '/require_module',
			json: true,
			form: {
				sessionid: this._sessionid,
				name: name
			}
		},
		(err, res, body) => {
			if(err){
				reject('http error');
			}
			if(body.undefined == 1){
				reject('undefined behavior');
			}
			if(!(body.success == 1)){
				reject('failed behavior');
			}
			var mod = new RemoteProgressObject(
				this,
				body.internalid);
			resolve(mod);
		})
	}).bind(this));
}

Session.prototype.del = function(){
	return new Promise((function(resolve, reject){
		request.post({
			url: this._prefix + '/del_session_ref',
			json: true ,		
			form: {
				sessionid: this._sessionid
			}
		},
		(err, res, body) => {
			if(err){
				reject('http error');
			}
			if(body.undefined == 1){
				reject('undefined behavior');
			}
			if(!(body.success == 1)){
				reject('failed behavior');
			}
			resolve();
		});
	}).bind(this));
}

function open_session(prefix){
	return new Promise(function(resolve, reject){
		request.post({
			url: prefix + '/new_session',
			json: true ,
		},
		(err, res, body) => {
			if(err){
				reject('http error');
			}
			if(body.undefined == 1){
				reject('undefined behavior');
			}
			if(!(body.success == 1)){
				reject('failed behavior');
			}
			if(body.hello != 'hello, pythonrpc'){
				reject('hello error');
			}
			var session = new Session(prefix, body.sessionid);
			resolve(session);
		});
	});
};

function debuginfo(prefix){
	return new Promise(function(resolve, reject){
		request.post({
			url: prefix + '/debuginfo',
			json: true
		},
		(err, res, body) => {
			if(err){
				reject('http error');
			}
			if(body.undefined == 1){
				reject('undefined behavior');
			}
			if(!(body.success == 1)){
				reject('failed behavior');
			}
			resolve(body.debuginfo);
		});	
	});
};

module.exports = {
	open_session: open_session,
	debuginfo: debuginfo	
}
