//check if nodes is value between to selected id's
var isBetween = function(searchKey, backKey, forwardKey) {
	var searchKeyDec = parseInt(searchKey, 16);
	var backKeyDec = parseInt(backKey, 16);
	var forwardKeyDec = parseInt(forwardKey, 16);
	
	if(forwardKeyDec > backKeyDec){
		console.log('forward larger than back ' + backKeyDec + ' --> ' + forwardKeyDec)
		if(searchKeyDec > backKeyDec && searchKeyDec <= forwardKeyDec){	
			console.log('returning true from high isBetween --> '+backKeyDec+' < '+searchKeyDec+' < '+forwardKeyDec);
			return true;
		} else if(searchKeyDec > backKeyDec || searchKeyDec <= forwardKeyDec){
			console.log('returning false from low isBetween --> '+backKeyDec+' --> '+searchKeyDec+' --> '+forwardKeyDec);
			return false;
		}
		else return false;
	} else if(forwardKeyDec > searchKeyDec ) {
		return true;
	}
	
}

//parses and compares values
var firstSmallerThanSecond = function(first, second){
	var firstDec = parseInt(first, 16);
	var secondDec = parseInt(second, 16);
	if(firstDec < secondDec){
		return true;
	}else {
		return false;
	}
	
}