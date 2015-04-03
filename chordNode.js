var util = require("util");
var cryptoJS = require('crypto-js');

var ChordNode = function(port, ip) {
	var id;
	this.ip = ip;
	this.port = port;
	
	this.predecessor = null;
	this.successor = null;
	
	this.setPredecessor = function(pred) {
		this.predecessor = pred;
	}
	
	this.setDisconnected = function() {
		this.isConnected = false;
	}
	
	this.getSuccessor = function() {
		return this.successor;
	}
	
	this.setSuccessor = function(succ) {
		this.successor = succ;
	}
	
	this.getId = function() {
		if (!id) {
			id = this.getHash([this.ip, this.port]);
		}
		return id;
	},
	
	this.equals = function(node) {
		return node.ip == this.ip && node.port == this.port;
	}
	
	this.getHash = function(parts) {
		var hashString = parts[0] + parts[1];
		var shasum = cryptoJS.SHA1(hashString.toString());
		return shasum.toString(cryptoJS.enc.Hex);
	}
};
module.exports = ChordNode;