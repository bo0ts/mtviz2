
///hide the inner ul
function hide(e) {
    //magic, only do it when we came from li
    e = e.parentNode;
    var ul = e.getElementsByTagName("ul");
    if(!ul[0].style.visibility) ul[0].style.visibility = "hidden";
    
    if(ul[0].style.visibility != "hidden") {
        ul[0].style.visibility = "hidden";
        ul[0].style.display = "none"; 
    } else {
        ul[0].style.visibility = "visible";
        ul[0].style.display = "inline"; 
    }
}

// Array.prototype.unique = function() {
//     var a = [];
//     var l = this.length;
//     for(var i=0; i<l; i++) {
// 	for(var j=i+1; j<l; j++) {
//             // If this[i] is found later in the array
//             if (this[i] === this[j])
// 		j = ++i;
// 	}
// 	a.push(this[i]);
//     }
//     return a;
// };

function set_g_name(name,e) {
    window[name] = e;
    reload();
    vis.render();
}