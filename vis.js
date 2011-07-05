// defaults and globals
var r = 300,
barsize = 30,
width = r*2,
lines = 2,
margin = 20,
shift_in = 15,
max, data = mt2, smalls,
ws, bar_scales;

// setup panels and sizes
// root, "fullscreen"
var vis = new pv.Panel()
    .width(1440)
    .height(990);

var p1 = vis.add(pv.Panel)
    .width(width + margin)
    .height(width + margin);

var p2 = vis.add(pv.Panel)
    .width(width + margin)
//2 bars per line - shift and as much margin as we have lines
    .height((2*lines*barsize)-shift_in + margin*lines)
    .top(r*2 + margin);

var wedge = p1.add(pv.Wedge);
var bar = p2.add(pv.Bar);


// annotate the data with the line they belong to
function data_line(data, max_size) {
    var line = 0;
    for(var j in data) {
        if(data[j].end > max_size) {
            ++line;
            data[j].line = line;
            max_size += max_size;
        } else {
            data[j].line = line;
        }
    }
}

function reload() {
    //globals
    width = r*2;
    max = pv.max(data, function(d) { return d.end; } );

    var smalls = new Array();
    //strip down trn sequence names and mark the small
    for(var i in data) {
        if(data[i].name.indexOf("trn") == 0) {
	    smalls.push(data[i]);
	    data[i].name = data[i].name.substr(3, data[i].name.substr.length);
            data[i].isSmall = true;
        }
    }
    //all data points that require ticks
    var ticks = new Array();
    for(var i = 0; i < data.length; ++i) { ticks.push(data[i].start, data[i].end); }
    ticks = ticks.unique();

    // scales
    ws = pv.Scale.linear(0, max).range(0, 2 * Math.PI);
    
    // array of scales from minimal start to maximal end in each line scale from
    data_line(data, max/lines);
    var bottom = 0;
    var line_val1 = 0;
    var line_val2 = max/lines;
    bar_scales = new Array();
    for(var i = 0; i < lines; ++i) {
        bar_scales.push(pv.Scale.linear(line_val1, line_val2).range(0, width));
        line_val1 += line_val2;
        line_val2 += line_val2;             
    }

    wedge
        .data(data)
        .top(r)
        .left(r)
        .strokeStyle("white")
        .lineWidth(1)
        .outerRadius(function(d) {
    	    if(d.strand == "-") { return (r - barsize + shift_in); }
    	    else { return r; }
        })
        .innerRadius(function(d) {
	    if(d.strand == "-") { return (r - barsize*2 + shift_in); }
    	    else { return r - barsize; }
        })
        .startAngle(function(d) { return ws(d.start); })
        .angle(function(d) { return ws(d.end - d.start); })
        .anchor("center").add(pv.Label)
        .text(function(d) { if(!d.isSmall) return d.name; else return ""; })
        .textAngle(function(d) { return Math.PI/2 + ws(d.start + Math.abs((d.start - d.end) / 2)); } );

    // bars //
    bar
        .data(data)
        .left(function(d) { return bar_scales[d.line](d.start); })
        .width(function(d) { return  bar_scales[d.line](d.end - d.start); })
        .bottom(function(d) { return (barsize+margin) * d.line; })
    // if(d.strand == "-") return bottom;
    //                   else return bottom + (barsize - shift_in); })
        .height(30)
        .lineWidth(1)
    // .fillStyle(function(d) { if(d.strand == "-") return "blue";
    // 	                     else return "red"; })
        .strokeStyle("white")
        .anchor("center").add(pv.Label)
        .text(function(d) { if(!d.isSmall) return d.name; else return ""; });
}

