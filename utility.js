function switch_mode(mode) {
    // remove the old svg
    var fig = document.getElementById("fig");
    while (fig.hasChildNodes()) {
        fig.removeChild(fig.lastChild);
    }

    // reset the panel
    root = new pv.Panel()
        .width(conf.width + conf.margin)
        .height(conf.width + conf.margin)
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
function hide_sub(e) {
    //magic, only do it when we came from li
    e = e.parentNode;
    var ul = e.getElementsByTagName("ul");
    hide(ul[0]);
}

function hide(e) {
    if(!e.style.visibility) e.style.visibility = "hidden";

    if(e.style.visibility != "hidden") {
        e.style.visibility = "hidden";
        e.style.display = "none"; 
    } else {
        e.style.visibility = "visible";
        e.style.display = "inline"; 
    }
}