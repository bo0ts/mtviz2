///hide the inner ul
function hide(e) {
    var ul = e.getElementsByTagName("ul");
    for(var i in ul) {
        if(ul[i].style.visibility != "hidden") {
            ul[i].style.visibility = "hidden"; 
        } else {
            ul[i].style.visibility = "visible"; 
        }
    }
}

Array.prototype.unique = function() {
    var a = [];
    var l = this.length;
    for(var i=0; i<l; i++) {
	for(var j=i+1; j<l; j++) {
            // If this[i] is found later in the array
            if (this[i] === this[j])
		j = ++i;
	}
	a.push(this[i]);
    }
    return a;
};