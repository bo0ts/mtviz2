// defaults and globals
var r = 300,
barsize = 30,
width = r*2,
lines = 1,
margin = 5,
shift = 0,
max, data = mt2, annotations = new Array(), smalls = new Array(),
ws, bar_scale, heat_scale;

// setup panels and sizes
// root, "fullscreen"
var vis = new pv.Panel()
    .widthn(1440)
    .height(990);

var p1 = vis.add(pv.Panel)
    .width(width + margin)
    .height(width + margin);

var p2 = vis.add(pv.Panel)
    .width(width + margin)
    .height(lines * (margin + barsize))
    .top(width + margin);

var wedge = p1.add(pv.Wedge);
var anno = p1.add(pv.Wedge);
var bar = p2.add(pv.Bar);

function reload() {
    //globals

    p2
        .width(width + margin)
        .height(lines * (margin + barsize))
        .top(width + margin);

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
    bar_scale = pv.Scale.linear(0, max).range(0, width*lines)
    var line_tmp = 0;
    var break_point = 0;
    for(var i = 0; i < data.length; ++i) {
        if(bar_scale(data[i].end) > (width * (line_tmp + 1))) {
            ++line_tmp;
            break_point = data[i-1].end;
        }
        data[i].line = line_tmp;
        data[i].break_point = break_point;
    }

    console.log(pv.min(annotations) + " " + pv.median(annotations) + " " + pv.max(annotations));
    heat_scale = pv.Scale.linear(pv.min(annotations), pv.median(annotations), pv.max(annotations))
        .range('red', 'yellow', 'green');

    // wedges //
    wedge
        .data(data)
        .top(r)
        .left(r)
        .strokeStyle("white")
        .lineWidth(0)
        .outerRadius(function(d) {
    	    if(d.strand == "-") { return (r - shift); }
    	    else { return (r); }
        })
        .innerRadius(function(d) {
	    if(d.strand == "-") { return (r - barsize - shift); }
    	    else { return (r - barsize); }
        })
        .startAngle(function(d) { return ws(d.start); })
        .angle(function(d) { return ws(d.end) - ws(d.start); })
        .anchor("center").add(pv.Label)
        .text(function(d) { if(!d.isSmall) return d.name; else return ""; })
        .textAngle(function(d) { return Math.PI/2 + ws(d.start + Math.abs((d.start - d.end) / 2)); } );

    anno
        .data(annotations)
        .top(r)
        .left(r)
        .lineWidth(0)
        .outerRadius(function(d) { return r - shift - barsize; })
        .innerRadius(function(d) { return r - shift - barsize - 10; })
        .startAngle(function(d) { return ws(this.index); })
        .angle(function(d) { return ws(1); })
        .fillStyle(heat_scale);

    // bars //
    bar
        .data(data)
        .left(function(d) { return bar_scale(d.start) - bar_scale(d.break_point); })
        .width(function(d) { return bar_scale(d.end) - bar_scale(d.start); })
        .bottom(function(d) { return (barsize+margin) * (lines - d.line - 1); })
        .height(30)
        .lineWidth(1)
        .strokeStyle("white")
        .anchor("center").add(pv.Label)
        .text(function(d) { if(!d.isSmall) return d.name; else return ""; });
}

