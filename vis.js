var data = [], annotations = null, root = new pv.Panel().canvas('fig'), 
vis = new WedgeVis(root, data);
var timer;

// this is madness
var conf = {
    observer: vis,

    width: 600,
    margin: 30,
    barsize: 30,
    shift: 0,
    lines: 1,
    circle: true,
    font_family: 'Verdana',
    font_size: '10px',
    border_size: 1,
    border_colour: 'white',
    value_ticks: true,
    line_dist: 20,
    markers: [],
    palette: pv.Colors.category20(),

    // remove unset things
    caption_heading: "",
    caption_add: "",
    caption_pic: "",
    caption_pic_width: 100,
    caption_pic_height: 100,

    set_color: function(mode) {
        // pretty, not
        if(mode === "full") {
            this.palette = pv.Colors.category20();
        } else if(mode === "bw") {
            this.palette = pv.Scale.linear(0, data.length).range('grey', 'white');
        } else if(mode === "none") {
            console.log(mode);
            this.palette = pv.Scale.linear(0, data.length).range('white', 'white');
            // this.palette = null;
        } else if(mode === "blue") {
            this.palette = function() { return "#1f77b4"; };
        }
        this.observer.notify(this);
        root.render();
    },

    add_marker: function(start, end, name) {
        this.markers.push({start: parseInt(start, 10), end: parseInt(end, 10), name: name});
        this.observer.notify(this);
        root.render();
    },

    update: function(name, value) {
        var d = new Date();
        timer = d.getTime();

        if(name === 'font_family') {
            // requote the string...
            this[name] = "\"".concat(value, "\"");
        } else if(name === "font_size") {
            this[name] = value + 'px';
            console.log(this[name]);
        } else if(name === 'width') {
            // width changes require adaption of the root panel
            this[name] = parseInt(value, 10);
            root.width(this[name] + conf.margin).height(this[name] + conf.margin);
        } else {
            this[name] = value;
        }

        this.observer.notify(this);
        root.render();
    }
};

function WedgeVis(panel) {
    // the ordering of the "adds" is important for the overdraw
    this.circle = panel.add(pv.Wedge);
    this.circle.anchor("start").add(pv.Dot).shape("triangle").fillStyle("grey");

    this.wedge = panel.add(pv.Wedge);
    this.labels1 = this.wedge.anchor("center").add(pv.Label);

    this.value_ticks = panel.add(pv.Wedge);
    this.value_labels = this.value_ticks.anchor("center").add(pv.Label);

    this.markers = panel.add(pv.Wedge);
    this.marker_labels = this.markers.anchor("center").add(pv.Label);

    this.anno = panel.add(pv.Wedge);

    this.caption_heading = panel.add(pv.Label);
    this.caption_add = panel.add(pv.Label);
    this.caption_image = panel.add(pv.Image);

    // those remains constant with the data
    this.max = pv.max(data, function(d) { return d.end; } );
    this.wedge_scale = pv.Scale.linear(0, this.max).range(0, 2 * Math.PI);

    this.small_data = [];

    //strip down trn sequence names and mark the small
    for(var i = 0; i < data.length; ++i) {
        if(data[i].name.indexOf("trn") == 0) {
	    this.small_data.push(data[i]);
	    data[i].name = data[i].name.substr(3, data[i].name.substr.length);
            data[i].isSmall = true;
        }
    }
}

WedgeVis.prototype.notify = function(conf) {
    // set the radius in the config
    conf.center = (conf.width + conf.margin) / 2;
    conf.radius = conf.width / 2;

    // closure trick
    var me = this;

    // full circle
    this.circle
        .left(conf.center)
        .top(conf.center)
        .data([0])
        .strokeStyle("black").lineWidth(1)
        .outerRadius(conf.radius - conf.barsize/2 - conf.shift/2)
        .innerRadius(conf.radius - conf.barsize/2 - conf.shift/2)
        .startAngle(0).angle(Math.PI * 2);

    this.value_ticks
        .left(conf.center)
        .top(conf.center)
        .fillStyle(null)
        .outerRadius(conf.radius + 5)
        .innerRadius(conf.radius)
        .startAngle(function(d) { return me.wedge_scale(d); })
        .strokeStyle("black")
        .lineWidth(1)
        .angle(0);

    this.caption_heading
        .top(conf.center - 50)
        .left(conf.center)
        .textAlign("center")
        .font((parseInt(conf.font_size, 10) + 4) + conf.font_family)
        .text(conf.caption_heading);

    this.caption_add
        .top(conf.center - 40)
        .left(conf.center)
        .textAlign("center")
        .text(conf.caption_add);

    this.caption_image
        .url(conf.caption_pic)
        .top(conf.center - 30)
        .left(conf.center - conf.caption_pic_width / 2)
        .width(conf.caption_pic_width)
        .height(conf.caption_pic_height);

    if(conf.value_ticks) {
        this.value_ticks
            .data(this.wedge_scale.ticks());
    } else {
        this.value_ticks
            .data([]);
    }

    this.value_labels
        .font(conf.font_size + conf.font_family)
        .textBaseline("bottom")
        .textAngle(function(d) { return Math.PI/2 + me.wedge_scale(d); } );

    this.wedge
        .left(conf.center)
        .top(conf.center)
        .data(data)
        .strokeStyle(conf.border_colour)
        .lineWidth(conf.border_size)
        .fillStyle(function(d) { return conf.palette(this.index); })
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

    this.markers
        .left(conf.center)
        .top(conf.center)
        .data(conf.markers)
        .outerRadius(conf.radius - conf.barsize - conf.shift - 5)
        .innerRadius(conf.radius - conf.barsize - conf.shift - 10)
        .fillStyle("grey")
        .startAngle(function(d) { return me.wedge_scale(d.start); })
        .angle(function(d) { return me.wedge_scale(d.end) - me.wedge_scale(d.start); })
        .anchor("start").add(pv.Dot).shape("triangle").size(10)
        .angle(function(d) { return me.wedge_scale(d.start) - Math.PI/2; });

    this.marker_labels
        .font(conf.font_size + conf.font_family)
        .text(function(d) { return d.name; })
        .textAngle(function(d) { return Math.PI/2 + me.wedge_scale(d.start + Math.abs((d.start - d.end) / 2)); } );

    this.markers.anchor("end").add(pv.Dot).shape("triangle").size(10)
        .angle(function(d) { return me.wedge_scale(d.end) - Math.PI/2; });


    this.labels1
        .font(conf.font_size + ' ' + conf.font_family)
        .text(function(d) { if(!d.isSmall) return d.name; else return ""; })
        .textAngle(function(d) { return Math.PI/2 + me.wedge_scale(d.start + Math.abs((d.start - d.end) / 2)); } );

    // if annotations are available, render them as a heat scale
    if(this.annotations) {
        var a_min = pv.min(this.annotations),
        a_median = pv.median(this.annotations),
        a_max = pv.max(this.annotations);
        var heat_scale = pv.Scale.linear(pv.min(this.annotations), pv.median(this.annotations),
                                         pv.max(this.annotations))
            .range('red', 'yellow', 'green');

        anno
            .left(conf.center)
            .top(conf.center)
            .data(this.annotations)
            .lineWidth(0)
            .outerRadius(function(d) { return this.radius - this.shift - this.barsize; })
            .innerRadius(function(d) { return this.radius - shift - this.barsize - 10; })
            .startAngle(function(d) { return me.wedge_scale(this.index); })
            .angle(function(d) { return ws(1); })
            .fillStyle(heat_scale);
    }

    console.log(timer);
    var d = new Date();
    var timing = d.getTime() - timer;
    console.log("Rendering time: " + timing);
};

function BarVis(panel, data) {
    this.max = pv.max(data, function(d) { return d.end; } );

    this.bars = panel.add(pv.Bar);
    this.label = this.bars.anchor("center").add(pv.Label);

    this.caption_heading = panel.add(pv.Label);
    this.caption_add = panel.add(pv.Label);
    this.caption_image = panel.add(pv.Image).url(conf.caption_pic)
        .width(conf.caption_pic_width).height(conf.caption_pic_height);

    this.markers = panel.add(pv.Rule);
    this.marker_labels = this.markers.anchor("top").add(pv.Label);


    this.small_data = new Array();
    //strip down trn sequence names and mark the small
    for(var i in data) {
        if(data[i].name.indexOf("trn") == 0) {
	    this.small_data.push(data[i]);
	    data[i].name = data[i].name.substr(3, data[i].name.substr.length);
            data[i].isSmall = true;
        }
    }
}

BarVis.prototype.notify = function(conf) {
    conf.center = (conf.width + conf.margin) / 2;
    var me = this,
    bar_scale = pv.Scale.linear(0, this.max).range(0, conf.width*conf.lines);

    var line_tmp = 0;
    var break_point = 0;
    for(var i = 0; i < data.length; ++i) {
        delete data[i].breakpoint;
    }

    for(var i = 0; i < data.length; ++i) {
        if(bar_scale(data[i].end) > (conf.width * (line_tmp + 1))) {
            ++line_tmp;
            break_point = data[i-1].end;
        }
        data[i].line = line_tmp;
        data[i].break_point = break_point;
    }

    this.bars
        .data(data)
        .left(function(d) { return bar_scale(d.start) - bar_scale(d.break_point); })
        .width(function(d) { return bar_scale(d.end) - bar_scale(d.start); })
        .top(function(d) { // spacing for the caption + upper rows
            // parseInt yeah
            return parseInt(conf.caption_pic_height, 10) + 50 + (conf.barsize + conf.line_dist) * d.line; })
        .height(conf.barsize)
        .lineWidth(conf.border_size)
        .fillStyle(function(d) { if(conf.palette) return conf.palette(this.index); else return null; })
        .strokeStyle(conf.border_colour);

    // XXX calculate the break points for the markers
    this.markers
        .data(conf.markers)
        .left(function(d) { return bar_scale(d.start); })
        .width(function(d) { return bar_scale(d.end) - bar_scale(d.start); })
        .strokeStyle("black")
         // spacing for the pic
        .top(conf.caption_pic_height + 45).anchor("left").add(pv.Dot).size(10);

    this.markers.anchor("right").add(pv.Dot).size(10);

    this.marker_labels
        .font(conf.font_size + conf.font_family)
        .text(function(d) { return d.name; });

    this.caption_heading
        .left(conf.center)
        .top(15)
        .textAlign("center")
        .font((parseInt(conf.font_size, 10) + 4) + conf.font_family)
        .text(conf.caption_heading);

    this.caption_add
        .left(conf.center)
        .top(25)
        .textAlign("center")
        .text(conf.caption_add);

    this.caption_image
        .url(conf.caption_pic)
        .top(30)
        .left(conf.center - conf.caption_pic_width / 2)
        .width(conf.caption_pic_width)
        .height(conf.caption_pic_height);

    this.label
        .font(conf.font_size + conf.font_family)
        .text(function(d) { if(!d.isSmall) return d.name; else return ""; });
};