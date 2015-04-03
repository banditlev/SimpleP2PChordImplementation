var main = function() {
	var util = require('util');
	var chordServer = require('./chordServer');
	var ChordNodeClass = require('./chordNode');
	
	//assign random port if none is selected
	var localPort = process.argv[2] || Math.floor((Math.random() * 1100) + 1000);
	
	var chordNode = new ChordNodeClass(localPort, '127.0.0.1');	
	var localHost = '127.0.0.1';
	
	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	process.stdin.on('data', function(data) {
		data = data.replace('\n', '').replace('\r', '');
		if (data.indexOf('join') == 0) {
			var parts = data.split(' ');
			if (parts.length >= 3 && parts[1] && parts[2]) {
				process.stdout.write(util.format('Joining to %s:%d\r\n', parts[1], parts[2]));  
				chordServer.join(chordNode, new ChordNodeClass(parts[2], parts[1]));
			} 
		} else if (data == 'leave') {
			process.stdout.write('Leaving the network\r\n');
			if (chordNode) {
				chordServer.leave(chordNode);
			}
		} else if (data == 'exit') {
			process.exit();
		} else if(data == 'init') {
			process.stdout.write('initialising new network\r\n');
			chordServer.start(chordNode);
			chordServer.serverInit(chordNode);
		} else if(data == 'stats') {
			process.stdout.write(getStats(chordNode));
		} else if(data.indexOf('jp') == 0) {
			var parts = data.split(' ');
			process.stdout.write(util.format('Joining to localhost:%d\r\n', parts[1]));
			chordServer.join(chordNode, new ChordNodeClass(parts[1], localHost));
		}
		 else {
			process.stdout.write(' join <ipaddress> <port> : Join the network with known node\r\n join : Create new network\r\n leave: Leave the network\r\n init : initialize new network\r\n stats : get status\r\n exit : Exit the application\r\n');
		}
	});
	process.stdout.write('current port: ' + localPort);
}

//Retrieves info of current node
var getStats = function(node){
	if(node.port != null) {var port = node.port;}
	if(node.predecessor != null) {var pPort = node.predecessor.port;}
	if(node.getSuccessor() != null) {var sPort = node.getSuccessor().port;}
	var statString = 'self: '+port+' pred: '+pPort+' succ: '+sPort+'\r\n';
	return statString;
}
main();