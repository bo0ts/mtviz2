Object.prototype.clone = function() {
  var newObj = (this instanceof Array) ? [] : {};
  for (i in this) {
    if (i == 'clone') continue;
    if (this[i] && typeof this[i] == "object") {
      newObj[i] = this[i].clone();
    } else newObj[i] = this[i]
  } return newObj;
};

var modes = {
    NONE: 0,
    RING: 1,
    BAR: 2
}, current_mode = modes[modes.NONE];

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

    if(mode === modes.RING) {
        vis = new WedgeVis(root, data);
    }

    if(mode === modes.BAR) {
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
    // swap the arrow div
    var div = e.getElementsByTagName("div");

    if(div.length > 0) {
        var attr = div[0].getAttribute('class');
        if(attr === 'arrow-right')
            div[0].setAttribute('class', 'arrow-down');
        else
            div[0].setAttribute('class', 'arrow-right');
    }

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

function get_text_width(text, fstyle) {
    var e = document.createElement("div");
    e.style.position = "absolute";
    e.style.visibility = "hidden";
    e.style.width = "auto";
    e.style.font = fstyle;
    e.innerHTML = text;
    document.body.appendChild(e);
    var size = e.clientWidth;
    document.body.removeChild(e);
    return size;
}

function get_smalls(data, conf, real_size) {
    var smalls = [];

    for(var i = 0; i < data.length; ++i) {
        var width = get_text_width(data[i].name, conf.font_size);
        var available = real_size(data[i].end - data[i].start);
        if(available < width) {
            data[i].isSmall = true;
            // copy the object
            smalls.push(data[i].clone());
            // blow up
            // var by = Math.ceil((width - available) / 2);
            var by = 5;

            while(available < width) {
                smalls[smalls.length - 1].start -= by;
                smalls[smalls.length - 1].end += by;
                available = real_size(smalls[smalls.length - 1].end - 
                                      smalls[smalls.length - 1].start);
            }
        } else {
            data[i].isSmall = false;
        }
    }

    var clusters = get_clusters(smalls);

    while(clusters.length != 0) {
        for(var i = 0; i < clusters.length; ++i) {
            adjust_cluster(clusters[i])
        }
        clusters = get_clusters(smalls);
    }
    return smalls;
}

function get_clusters(data) {
    var clusters = [[]];
    // readjust the position
    if(data.length > 0) {
        clusters[0].push(data[0]);
    }

    for(var i = 1; i < data.length; ++i) {
        var last_cluster = clusters[clusters.length - 1];

        if(data[i].start < last_cluster[last_cluster.length - 1].end) {
            // overlap
            last_cluster.push(data[i]);
        } else {
            // new cluster
            clusters.push([])
            last_cluster = clusters[clusters.length - 1];
            last_cluster.push(data[i]);
        }
    }

    return clusters.filter(function(a) { return a.length != 1; });
}

function shift_left(c, init) {
    for(var i = c.length - 1; i <= 0; ++i) {
        c[i].start -= init;
        c[i].end -= init;

        // if there is an element left, adjust the shift
        if(i != 0) {
            init = c[i - 1].end - c[i].start;
        }
    }
}

function shift_right(c, init) {
    for(var i = 0; i < c.length - 1; ++i) {
        c[i].start += init;
        c[i].end += init;

        if(i < (c.length - 2)) {
            init = c[i].end - c[i + 1].start;
        }
    }
}

function adjust_cluster(cluster) {  
    if(cluster.length % 2 == 0) {
        // even case
        var split = cluster.length / 2;
        var init = Math.ceil((cluster[split - 1].end - cluster[split].start) / 2);
        shift_left(cluster.slice(0, split), init);
        shift_right(cluster.slice(split), init);
    } else {
        // uneven case
        var split = Math.floor(cluster.length / 2);
        var init = Math.ceil(cluster[split - 1].end - cluster[split].start);
        var init2 = Math.ceil(cluster[split].end - cluster[split + 1].start);

        shift_left(cluster.slice(0, split), init);
        shift_right(cluster.slice(split + 1), init2);
    }
}


// examples

function pantheraRing() {
    data = mt2;
    conf.caption_heading = 'Panthera Tigris';
    conf.caption_add = 'A tiger!'
    conf.caption_pic = 'http://upload.wikimedia.org/wikipedia/commons/a/a4/Tiger_in_the_water.jpg'
    conf.caption_pic_width = 166;
    conf.caption_pic_height = 133;

    conf.width = 400;
    conf.barsize = 20;
    conf.shift = 10;

    conf.border_colour = 'black';

    switch_mode(modes.RING);
}

function astroBar() {
    data = mt1;
    conf.caption_heading = 'Astropecten polyacanthus';
    conf.caption_add = ''
    conf.caption_pic = 'http://www.scuba-equipment-usa.com/marine/MAY04/images/Astropecten_polyacanthus.jpg'
    conf.caption_pic_width = 640 / 3;
    conf.caption_pic_height = 492 / 3;

    conf.border_colour = 'black';
    conf.set_color('none');

    switch_mode(modes.BAR);
}
