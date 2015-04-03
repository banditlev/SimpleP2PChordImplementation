var restify = require('restify');
var dgram = require('dgram');
var ChordNodeClass = require('./chordNode');
var chordUtil = require('./chordUtil');

var server = restify.createServer();
server.use(restify.bodyParser());
server.use(restify.queryParser());

//Initiates node join by calling findsuccessor on known node followed by notification of found predecessor and successor
exports.join = function(localNode, bootNode) {

	if(bootNode){
		var client = restify.createJsonClient({
			url: 'http://'+ bootNode.ip +':' + bootNode.port,
			version: '*'
		});
		//Do findsuccessor call on known node		
		client.post('/findsuccessor', { searchKey:localNode.getId() }, function(err, req, res, obj) {
			console.log('%j', obj);
			localNode.setSuccessor(createNode(obj.port, obj.ip));
			console.log('obj values --> '+ obj.port + ' '+ obj.ip);
			
			var client = restify.createJsonClient({
				url: 'http://'+ localNode.getSuccessor().ip +':' + localNode.getSuccessor().port,
				version: '*'
			});
			//retrieve predecessor of found successor
			client.get('/getpredecessor', function(err, req, res, obj) {
				localNode.setPredecessor(createNode(obj.port, obj.ip));
				console.log('predecessor retrieved ' + localNode.predecessor.ip + ':'+localNode.predecessor.port);
				notifySurroundingsJoin(localNode);
			});
		});	
	}
	this.serverInit(localNode);
};

//leave ring, by telling predecessor and successor
exports.leave = function(node) {
	//updates sucessor with predecessor
	if(node.getSuccessor != null){
		var clientSucc = restify.createJsonClient({
			url: 'http://'+ node.getSuccessor().ip +':' + node.getSuccessor().port,
			version: '*'
		});
		
		clientSucc.post('/newpredecessor', { ip:node.predecessor.ip, port:node.predecessor.port, key:node.predecessor.getId() }, function(err, req, res, obj) {
			console.log('notifying successor leaving');
		});
	}
	//update predecessor with successor
	if(node.predecessor != null) {
		var clientPre = restify.createJsonClient({
			url: 'http://'+ node.predecessor.ip +':' + node.predecessor.port,
			version: '*'
		});
		
		clientPre.post('/newsuccessor', { ip:node.successor.ip, port:node.successor.port }, function(err, req, res, obj) {
			console.log('notifying predecessor leaving--> ip:'+node.predecessor.ip+':'+node.predecessor.port);
		});
	}
	node.predecessor = null;
	node.successor = null;
};

//creates new node with ip and port
var createNode = function(port, ip) {
	var newNode =  new ChordNodeClass(port, ip);
	return newNode;	
}



//notify surroundings of new join
var notifySurroundingsJoin = function(node) {
	//update sucessor node with self
	if(node.getSuccessor != null){
		var clientSucc = restify.createJsonClient({
			url: 'http://'+ node.getSuccessor().ip +':' + node.getSuccessor().port,
			version: '*'
		});
		
		clientSucc.post('/newpredecessor', { ip:node.ip, port:node.port, key:node.getId() }, function(err, req, res, obj) {
			console.log('notifying successor');
		});
	}
	//update predecessor node with self
	if(node.predecessor != null) {
		var clientPre = restify.createJsonClient({
			url: 'http://'+ node.predecessor.ip +':' + node.predecessor.port,
			version: '*'
		});
		
		clientPre.post('/newsuccessor', { ip:node.ip, port:node.port }, function(err, req, res, obj) {
			console.log('notifying predecessor --> ip:'+node.predecessor.ip+':'+node.predecessor.port);
		});
	} 
}

//Checks if searchKey is successor or predecessor to self, calls sucessor if false
var findSuccessor = function(searchKey, localNode, callback){

		if(localNode.getSuccessor() == null || localNode.getSuccessor().getId() == localNode.getId()){
			callback(localNode);
		} else if(chordUtil.isBetween(searchKey, localNode.getId(), localNode.getSuccessor().getId())) {
			callback(localNode.getSuccessor());
		} else if(localNode.predecessor && chordUtil.isBetween(searchKey, localNode.predecessor.getId(), localNode.getId())) {
			callback(localNode);
		} else if (chordUtil.firstSmallerThanSecond(localNode.getSuccessor().getId(), localNode.getId()) && chordUtil.firstSmallerThanSecond(localNode.getId(), searchKey)){
			callback(localNode.getSuccessor());
		}else {
			//Searchkey not predecessor or successor calling findsuccessor on successor
			var successor = createNode( localNode.getSuccessor().port, localNode.getSuccessor().ip);
			
			console.log('posting at: ' + successor.port);
	
			var callback;
			var clientRec = restify.createJsonClient({
				url: 'http://'+ successor.ip +':' + successor.port,
				version: '*',
			});
				
			clientRec.post('/findsuccessor', { searchKey:searchKey }, function(err, req, res, obj) {
				console.log('called successor --> retrieved: '+obj.ip+':'+obj.port);
				callback(createNode(obj.port, obj.ip));
			});
		}
}



//search for given key
var searchKeyForPage = function(key, localNode, callback){
		console.log('Searching for keyholder: '+key+' localhost is : '+localNode.getId());
		if(key){
			//check if key is successor else call searchkey on successor 
			if(key == localNode.successor.getId()){
				console.log('returning successor');
				callback(localNode.successor);
			} else {
				var clientRec = restify.createJsonClient({
					url: 'http://'+ localNode.successor.ip +':' + localNode.successor.port,
					version: '*',
					requestTimeout: '10000'
				});

				clientRec.post('/searchkeypage', { id:key }, function(err, req, res, obj) {
					console.log('should be object --> '+obj);
					console.log('%d -> %j', res.statusCode, res.headers);
					var result = createNode(obj.port, obj.ip);
					console.log('called successor --> retrieved: '+obj.ip+':'+obj.port);
					callback(result);
				});
			}
		}	
}

//initialize single node for startup
exports.start = function(localNode) {
	localNode.predecessor = createNode(localNode.port, localNode.ip);
	localNode.setSuccessor(createNode(localNode.port, localNode.ip));
}

//initalize server and start listening
exports.serverInit = function(_localNode) {
	var localNode = _localNode
	
	//Retrieves node info and returns html page
	server.get('/info', function (req, res, next) {
		console.log('returnung info-page --> '+localNode.predecessor.ip+':'+localNode.predecessor.port);
		var body = createInfoPage(localNode);
		res.writeHead(200, {'Content-Length': Buffer.byteLength(body),'Content-Type': 'text/html'});
		res.write(body);
		res.end();
		return next();
	});
	
	//sets given node to new predecessor
	server.post('/newpredecessor', function rm(req, res, next) {
		console.log('New predecessor --> ip: '+req.body.ip+' port: '+req.body.port+' key: '+req.body.key);
		localNode.predecessor = createNode(req.body.port, req.body.ip);
		if(!localNode.getSuccessor()){
			localNode.setSuccessor(createNode(req.body.port, req.body.ip));
		}
		res.send({ip:localNode.predecessor.ip, port:localNode.predecessor.port, key:localNode.predecessor.getId()});
		return next();
	});	
	
	//sets given node to new successor
	server.post('/newsuccessor', function rm(req, res, next) {
		console.log('New successor --> ip: '+req.body.ip+' port: '+req.body.port+' key: '+req.body.key);
		localNode.setSuccessor(createNode(req.body.port, req.body.ip));
		console.log('logged as :'+localNode.getSuccessor());
		return next();
	});
	
	//Calls findsuccesor with given key
	server.post('/findsuccessor', function rm(req, res, next){
		var searchKey = req.body.searchKey;
		console.log('received findsecesssor call from '+ req.body.port +' --> searchKey: ' + searchKey);
		findSuccessor(searchKey, localNode, function(callback){
			//console.log('sending back result --> ' + result.port);
			res.send({ip:callback.ip, port:callback.port});
		});
		return next();
	});
	
	//searches for given key returns key
	server.post('/searchkeypage', function rm(req, res, next){
		console.log('In searchKeyPage -->');
		key = req.body.id;
		searchKeyForPage(key, localNode, function(callback){
			res.send({ip:callback.ip, port:callback.port});
		});
	});
	
	//returns node predecessor
	server.get('/getpredecessor', function (req, res, next) {
		console.log('returnung predecessor --> '+localNode.predecessor.ip+':'+localNode.predecessor.port);
		res.send({ip:localNode.predecessor.ip, port:localNode.predecessor.port});
		return next();
	});
	
	//searches for key returns html page
	server.get('/searchkey', function (req, resGet, next) {
		var key = req.params.id;

		console.log('retrieved searchKey request --> key: '+ key);
		searchKeyForPage(key, localNode, function(callback){
			var keyHolder = 'http://'+callback.ip+':'+callback.port+'/info';
			var body = createInfoPage(localNode, keyHolder);
			resGet.writeHead(200, {'Content-Length': Buffer.byteLength(body),'Content-Type': 'text/html'});
			resGet.write(body);
			resGet.end();
		});
		return next();
	});
	
	//get exceptions from restify
	server.on('uncaughtException', function (req, res, route, err) {
   		console.log('uncaughtException', err.stack);
   	});
	server.listen(localNode.port, function() {
		console.log('%s listening at %s', server.name, server.url);
	});
};

//create info page with or without search info
var createInfoPage = function(localNode, keyHolder) {
	var hexValue = parseInt(localNode.getId(), 16);
	if(keyHolder){
	var body = '<html><head><title>Chord Server</title></head><body><h1 align="center">Chord Server</h1><h3 align="center">Milestone 1</h3><h2 align="center">ID: '+localNode.getId()+'</h2></br><h3 align="center">Num: '+hexValue+'</h3><form action="http://'+localNode.ip+':'+localNode.port+'/searchkey" align="center">Search for peer ID:<input type="text" name="id"><input type="submit" value="Search"><br/><br/><br/><p>Result: </p><a href="'+keyHolder+'" >'+keyHolder+'</a></form><br/><br/><br/><table align="center"><tr><td align="left"><a href="http://'+localNode.predecessor.ip+':'+localNode.predecessor.port+'/info" align="left">Predecessor</a></td><td align="right"><a href="http://'+localNode.successor.ip+':'+localNode.successor.port+'/info" align="right">Successor</a><td></tr></table></body></html>';
} else {
	var body = '<html><head><title>Chord Server</title></head><body><h1 align="center">Chord Server</h1><h3 align="center">Milestone 1</h3><h2 align="center">ID: '+localNode.getId()+'</h2></br><h3 align="center">Num: '+hexValue+'</h3><form action="http://'+localNode.ip+':'+localNode.port+'/searchkey" align="center">Search for peer ID:<input type="text" name="id"><input type="submit" value="Search"></form><br/><br/><br/><table align="center"><tr><td align="left"><a href="http://'+localNode.predecessor.ip+':'+localNode.predecessor.port+'/info" align="left">Predecessor</a></td><td align="right"><a href="http://'+localNode.successor.ip+':'+localNode.successor.port+'/info" align="right">Successor</a><td></tr></table></body></html>';
}
return body;
} 
