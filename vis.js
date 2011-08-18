var data = mt2, annotations = null, vis = null;
var root = new pv.Panel()
    .canvas('fig');

var conf = {
    width: 600,
    margin: 10,
    barsize: 30,
    shift: 0,
    lines: 1,
    circle: true,
    font_family: "\"Verdana\"",
    font_size: "10px",
    enableTicks: true,

    update: function(name, value) {
        if(name == "font_family") {
            //requote the string...
            this[name] = "\"".concat(value, "\"");
        } else if(name == "width") {
            // width changes require adaption of the root panel
            root.width(value).height(value);
            this[name] = value;
        } else {
            this[name] = value;
        }

        this.observer.notify(this);
        root.render();
    }
};

function WedgeVis(panel, data) {
    // the ordering is important for the overdraw
    this.circle = panel.add(pv.Wedge);
    this.wedge = panel.add(pv.Wedge);
    this.ticks = panel.add(pv.Wedge);
    this.anno = panel.add(pv.Wedge);
    this.data = data;
    this.labels1 = this.wedge.anchor("center").add(pv.Label);
    // those remains constant with the data
    this.max = pv.max(this.data, function(d) { return d.end; } );
    this.wedge_scale = pv.Scale.linear(0, this.max).range(0, 2 * Math.PI);
    
    this.small_data = new Array();
    //strip down trn sequence names and mark the small
    for(var i in this.data) {
        if(this.data[i].name.indexOf("trn") == 0) {
	    this.small_data.push(this.data[i]);
	    this.data[i].name = this.data[i].name.substr(3, this.data[i].name.substr.length);
            this.data[i].isSmall = true;
        }
    }

    ticks_d = new Array();
    for(var i = 0; i < this.data.length; ++i) { 
        ticks_d.push({ pos: this.data[i].start, strand: this.data[i].strand });
        ticks_d.push({ pos: this.data[i].end, strand: this.data[i].strand }); 
    }
}

WedgeVis.prototype.notify = function(conf) {
    // set the radius in the config
    conf.radius = conf.width / 2;
    console.log(conf.font_family);

    // closure trick
    var me = this;

    // full circle
    this.circle
        .data([0])
        .top(conf.radius).left(conf.radius).strokeStyle("black").lineWidth(1)
        .outerRadius(conf.radius - conf.barsize/2 - conf.shift/2)
        .innerRadius(conf.radius - conf.barsize/2 - conf.shift/2)
        .startAngle(0).angle(Math.PI * 2);

    this.wedge
        .data(this.data)
        .top(conf.radius)
        .left(conf.radius)
        .strokeStyle("white")
        .lineWidth(0)
        .outerRadius(function(d) {
    	    if(d.strand == "-") { return (conf.radius - conf.shift); }
    	    else { return (conf.radius); }
        })
        .innerRadius(function(d) {
            if(d.strand == "-") { return (conf.radius - conf.barsize - conf.shift); }
    	    else { return (conf.radius - conf.barsize); }
        })
        .startAngle(function(d) { return me.wedge_scale(d.start); })
        .angle(function(d) { return me.wedge_scale(d.end) - me.wedge_scale(d.start); });

    this.small_data

    this.labels1
        .font(conf.font_size + conf.font_family)
        .text(function(d) { if(!d.isSmall) return d.name; else return ""; })
        .textAngle(function(d) { return Math.PI/2 + me.wedge_scale(d.start + Math.abs((d.start - d.end) / 2)); } );

    this.ticks
        .top(conf.radius)
        .left(conf.radius)
        .strokeStyle("black")
        .lineWidth(1)
        .outerRadius(function(d)  {
    	    if(d.strand == "-") { return (conf.radius - conf.barsize/2 - 10  - conf.shift/2); }
    	    else { return (conf.radius - conf.barsize/2 + 10 - conf.shift/2); }
        })
        .innerRadius(function(d) {
            if(d.strand == "-") { return (conf.radius - conf.barsize/2 - conf.shift/2); }
    	    else { return (conf.radius - conf.barsize/2 - conf.shift/2); }
        })
        .startAngle(function(d) { return me.wedge_scale(d.pos); })
        .angle(0);

    if(conf.enableTicks) {
        this.ticks.data(ticks_d);
    } else {
        this.ticks.data([]);
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
            .startAngle(function(d) { return me.wedge_scale(this.index); })
            .angle(function(d) { return ws(1); })
            .fillStyle(heat_scale);
    }
};

function BarVis(panel, data) {
    this.max = pv.max(data, function(d) { return d.end; } );

    this.data = data;
    this.bars = panel.add(pv.Bar);
    this.label = this.bars.anchor("center").add(pv.Label);

    this.small_data = new Array();
    //strip down trn sequence names and mark the small
    for(var i in this.data) {
        if(this.data[i].name.indexOf("trn") == 0) {
	    this.small_data.push(this.data[i]);
	    this.data[i].name = this.data[i].name.substr(3, this.data[i].name.substr.length);
            this.data[i].isSmall = true;
        }
    }
}

BarVis.prototype.notify = function(conf) {
    var me = this,
    bar_scale = pv.Scale.linear(0, this.max).range(0, conf.width*conf.lines);

    var line_tmp = 0;
    var break_point = 0;
    for(var i = 0; i < this.data.length; ++i) {
        delete this.data[i].breakpoint;
    }

    for(var i = 0; i < this.data.length; ++i) {
        if(bar_scale(this.data[i].end) > (conf.width * (line_tmp + 1))) {
            ++line_tmp;
            break_point = this.data[i-1].end;
        }
        this.data[i].line = line_tmp;
        this.data[i].break_point = break_point;
    }

    this.bars
        .data(this.data)
        .left(function(d) { return bar_scale(d.start) - bar_scale(d.break_point); })
        .width(function(d) { return bar_scale(d.end) - bar_scale(d.start); })
        .top(function(d) { return (conf.barsize+conf.margin) * (conf.lines - d.line - 1); })
        .height(conf.barsize)
        .lineWidth(1)
        .strokeStyle("white");

    this.label
        .font(conf.font_size + conf.font_family)
        .text(function(d) { if(!d.isSmall) return d.name; else return ""; });
};