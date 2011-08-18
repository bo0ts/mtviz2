var data = mt2, annotations = null, vis = null;
var root = new pv.Panel()
    .canvas('fig');

var conf = {
    width: 600,
    barsize: 30,
    shift: 0,
    lines: 1,
    font_family: "\"Verdana\"",
    font_size: "10px"
};

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
        vis = new WedgeVis(root);
        vis.data = data;
        vis.compute(conf);
        root.render();
    }
    
    if(mode == "line") {
        vis = new LineVis(root);
        vis.data = data;
        vis.compute(conf);
        root.render();
    }
}

function update(name, value) {
    conf[name] = value;
    if(vis) {
        vis.compute(conf);
    }
    root.render();
}

function WedgeVis(panel) {
    this.wedge = panel.add(pv.Wedge);
    this.circle = panel.add(pv.Wedge);
    this.ticks = panel.add(pv.Wedge);
    this.anno = panel.add(pv.Wedge);
    this.enableCircle(true);
    this.ticksOn = true;
}

WedgeVis.prototype.enableCircle = function(sw) {
    if(sw)
        this.circle.data([0]);
    else
        this.circle.data([]);
};

WedgeVis.prototype.compute = function(conf) {
    var max = pv.max(this.data, function(d) { return d.end; } );
    var wedge_scale = pv.Scale.linear(0, max).range(0, 2 * Math.PI);

    // closure tricks
    var me = this;
    var radius = conf.width / 2;

    var smalls = new Array();
    //strip down trn sequence names and mark the small
    for(var i in this.data) {
        if(this.data[i].name.indexOf("trn") == 0) {
	    smalls.push(this.data[i]);
	    this.data[i].name = this.data[i].name.substr(3, this.data[i].name.substr.length);
            this.data[i].isSmall = true;
        }
    }

    var ticks_d = null;
    if(this.ticksOn) {
        ticks_d = new Array();
        for(var i = 0; i < this.data.length; ++i) { 
            ticks_d.push({ pos: this.data[i].start, strand: this.data[i].strand });
            ticks_d.push({ pos: this.data[i].end, strand: this.data[i].strand }); 
        }
    }
    
    // full circle
    this.circle
        .data([0])
        .top(radius).left(radius).strokeStyle("black").lineWidth(1)
        .outerRadius(radius - conf.barsize/2 - conf.shift/2)
        .innerRadius(radius - conf.barsize/2 - conf.shift/2)
        .startAngle(0).angle(Math.PI * 2);

    this.wedge
        .data(this.data)
        .top(radius)
        .left(radius)
        .strokeStyle("white")
        .lineWidth(0)
        .outerRadius(function(d) {
    	    if(d.strand == "-") { return (radius - conf.shift); }
    	    else { return (radius); }
        })
        .innerRadius(function(d) {
            if(d.strand == "-") { return (radius - conf.barsize - conf.shift); }
    	    else { return (radius - conf.barsize); }
        })
        .startAngle(function(d) { return wedge_scale(d.start); })
        .angle(function(d) { return wedge_scale(d.end) - wedge_scale(d.start); })
        .anchor("center").add(pv.Label)
        .font(conf.font_size + conf.font_family)
        .text(function(d) { if(!d.isSmall) return d.name; else return ""; })
        .textAngle(function(d) { return Math.PI/2 + wedge_scale(d.start + Math.abs((d.start - d.end) / 2)); } );

    if(ticks_d) {
        this.ticks
            .data(ticks_d)
            .top(radius)
            .left(radius)
            .strokeStyle("black")
            .lineWidth(1)
            .outerRadius(function(d)  {
    	        if(d.strand == "-") { return (radius - conf.barsize/2 - 10  - conf.shift/2); }
    	        else { return (radius - conf.barsize/2 + 10 - conf.shift/2); }
            })
            .innerRadius(function(d) {
                if(d.strand == "-") { return (radius - conf.barsize/2 - conf.shift/2); }
    	        else { return (radius - conf.barsize/2 - conf.shift/2); }
            })
            .startAngle(function(d) { return wedge_scale(d.pos); })
            .angle(0);
    }

    // // if annotations are available, render them as a heat scale
    if(this.annotations) {
        var a_min = pv.min(this.annotations), 
        a_median = pv.median(this.annotations), 
        a_max = pv.max(this.annotations);
        console.log(a_min + " " + a_median + " " + a_max);
        var heat_scale = pv.Scale.linear(pv.min(this.annotations), pv.median(this.annotations), 
                                         pv.max(this.annotations))
            .range('red', 'yellow', 'green');
        
        anno
            .data(this.annotations)
            .top(this.radius)
            .left(this.radius)
            .lineWidth(0)
            .outerRadius(function(d) { return this.radius - this.shift - this.barsize; })
            .innerRadius(function(d) { return this.radius - shift - this.barsize - 10; })
            .startAngle(function(d) { return wedge_scale(this.index); })
            .angle(function(d) { return ws(1); })
            .fillStyle(heat_scale);
    }
};

//     bar_scale = pv.Scale.linear(0, max).range(0, width*lines)
//     // bars //
//     bar
//         .data(data)
//         .left(function(d) { return bar_scale(d.start) - bar_scale(d.break_point); })
//         .width(function(d) { return bar_scale(d.end) - bar_scale(d.start); })
//         .bottom(function(d) { return (barsize+margin) * (lines - d.line - 1); })
//         .height(30)
//         .lineWidth(1)
//         .strokeStyle("white")
//         .anchor("center").add(pv.Label)
//         .text(function(d) { if(!d.isSmall) return d.name; else return ""; });
// }

