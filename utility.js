function switch_mode(mode) {
    // remove the old svg
    var fig = document.getElementById("fig");
    while (fig.hasChildNodes()) {
        fig.removeChild(fig.lastChild);
    }

    // reset the panel
    root = new pv.Panel()
        .width(conf.width)
        .height(conf.width)
        .canvas('fig');
    
    // update the reference in the config
    conf.panel = root;

    if(mode == "ring") {
        vis = new WedgeVis(root, data);
    }
    
    if(mode == "bar") {
        vis = new BarVis(root, data);
    }

    conf.observer = vis;
    vis.notify(conf);
    root.render();
}

function exportSVG() {
    var builder;
    // fragile mozilla/chrome hack
    if(window.MozBlobBuilder)
        builder = new window.MozBlobBuilder();
    else {
        builder = new window.WebKitBlobBuilder();
    }
    
    // look for the svg and bang the string repl in builder
    var fig = document.getElementById("fig");

    builder.append(fig.innerHTML);
    // from saveAs.js
    saveAs(builder.getBlob(), 'vis.svg');
}

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