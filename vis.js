var data = [], annotations = { data: [] }, root = new pv.Panel().canvas('fig'), 
vis = new WedgeVis(root, data);
var timer;

// this is madness
var conf = {
    observer: vis,

    width: 600,
    margin: 50,
    barsize: 30,
    filter_smalls: false,
    shift: 0,
    lines: 1,
    circle: true,
    font_family: 'Verdana',
    font_size: '10px',
    border_size: 1,
    border_colour: 'white',
    value_ticks: true,
    line_dist: 20,
    fat_strands: false,

    markers: [],
    palette: pv.Colors.category20(),

    // remove unset things
    caption_heading: "",
    caption_add: "",
    caption_pic: "",
    caption_pic_width: 100,
    caption_pic_height: 100,

    // annotation settings
    anno_enable: true,
    anno_size: 10,
    anno_offset: 10,

    set_color: function(mode) {
        // pretty, not
        if(mode === "full") {
            this.palette = pv.Colors.category20();
        } else if(mode === "bw") {
            this.palette = pv.Scale.linear(0, data.length).range('grey', 'white');
        } else if(mode === "none") {
            this.palette = pv.Scale.linear(0, data.length).range('white', 'white');
        } else if(mode === 'gene') {
            // this is one hell of hack
            this.palette = function(d) { 
                if(data[d].name.length === 1) 
                    return '#87ACDD'; else return '#DEB887'; 
            }
        } else if(mode === "blue") {
            this.palette = function() { return "#1f77b4"; };
        }

        this.notify();
    },

    add_marker: function(start, end, name) {
        this.markers.push({start: parseInt(start, 10), end: parseInt(end, 10), name: name});
        this.notify();
    },

    update: function(name, value) {
        var d = new Date();
        timer = d.getTime();

        if(name === 'font_family') {
            // requote the string...
            this[name] = "\"".concat(value, "\"");
        } else if(name === "font_size") {
            this[name] = value + 'px';
        } else if(name === 'width') {
            // width changes require adaption of the root panel
            this[name] = parseInt(value, 10);
            root.width(this[name] + conf.margin).height(this[name] + conf.margin);
        } else if(name === 'filter_smalls') {
            // utterly painful
            this[name] = value;
            this.update('width', this.width + 1);
        } else {
            this[name] = value;
        }

        this.notify();
    },

    notify: function() {
        this.observer.notify(this);
        root.render();
    }
};

function WedgeVis(panel) {
    // the ordering of the "adds" is important for the overdraw

    // dummy to collect common properties for wedges
    this.dummy = new pv.Wedge();

    this.circle = panel.add(pv.Wedge).extend(this.dummy);
    this.circle.anchor("start").add(pv.Dot).shape("triangle").fillStyle("grey");

    this.wedge = panel.add(pv.Wedge).extend(this.dummy);
    this.labels1 = this.wedge.anchor("center").add(pv.Label);

    this.smalls = panel.add(pv.Wedge).extend(this.dummy);
    this.labels2 = this.smalls.anchor("center").add(pv.Label);

    this.fat_borders = panel.add(pv.Wedge).extend(this.wedge);

    this.value_ticks = panel.add(pv.Wedge).extend(this.dummy);
    this.value_labels = this.value_ticks.anchor("center").add(pv.Label);

    this.markers = panel.add(pv.Wedge).extend(this.wedge);
    this.marker_labels = this.markers.anchor("center").add(pv.Label);

    this.anno = panel.add(pv.Wedge);

    this.caption_heading = panel.add(pv.Label);
    this.caption_add = panel.add(pv.Label);
    this.caption_image = panel.add(pv.Image);

    this.buffer_width = 0;
}

WedgeVis.prototype.notify = function(conf) {
    // set the radius in the config
    conf.center = (conf.width + conf.margin) / 2;
    conf.radius = conf.width / 2;

    // closure trick
    var me = this;

    // those remains constant with the data
    var max = pv.max(data, function(d) { return d.end; } );
    var wedge_scale = pv.Scale.linear(0, max).range(0, 2 * Math.PI);

    // filter out smalls and shift them
    if(this.buffer_width != conf.width && conf.filter_smalls) {
        this.small_data = get_smalls(data, conf, function(size) { 
            // arc length
            var degrees = wedge_scale(size) * (180 / Math.PI);
            return (degrees * Math.PI * conf.radius) / 180;
        });
    }

    if(!conf.filter_smalls) {
        this.small_data = [];
    }

    this.buffer_width = conf.width;
    
    this.dummy
        .left(conf.center)
        .top(conf.center)
        .strokeStyle("black").lineWidth(1)
        .fillStyle(null);

    // full circle
    this.circle
        .data([0])
        .outerRadius(conf.radius - conf.barsize/2 - conf.shift/2)
        .innerRadius(conf.radius - conf.barsize/2 - conf.shift/2)
        .startAngle(0).angle(Math.PI * 2);

    this.value_ticks
        .outerRadius(conf.radius + 5)
        .innerRadius(conf.radius)
        .startAngle(function(d) { return wedge_scale(d); })
        .angle(0);

    if(conf.value_ticks) {
        this.value_ticks
            .data(wedge_scale.ticks());
    } else {
        this.value_ticks
            .data([]);
    }

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

    this.value_labels
        .font(conf.font_size + conf.font_family)
        .textBaseline("bottom")
        .textAngle(function(d) { return Math.PI/2 + wedge_scale(d); } );

    this.smalls
        .data(this.small_data)
        .strokeStyle(null)
        .lineWidth(0)
        .fillStyle("rgba(255, 255, 255, 0)")
        .outerRadius(function(d) {
    	    if(d.strand == "-") { return (conf.radius - conf.barsize - conf.shift); }
    	    else { return (conf.radius + 20); }
        })
        .innerRadius(function(d) {
            if(d.strand == "-") { return (conf.radius - conf.barsize - conf.shift - 20); }
    	    else { return (conf.radius + 20); }
        })
        .startAngle(function(d) { return wedge_scale(d.start); })
        .angle(function(d) { return wedge_scale(d.end) - wedge_scale(d.start); });

    this.wedge
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
        .startAngle(function(d) { return wedge_scale(d.start); })
        .angle(function(d) { return wedge_scale(d.end) - wedge_scale(d.start); });

    this.markers
        .data(conf.markers)
        .outerRadius(conf.radius - conf.barsize - conf.shift - 5)
        .innerRadius(conf.radius - conf.barsize - conf.shift - 10)
        .fillStyle("grey")
        .anchor("start").add(pv.Dot).shape("triangle").size(10)
        .angle(function(d) { return wedge_scale(d.start) - Math.PI/2; });

    this.marker_labels
        .font(conf.font_size + conf.font_family)
        .text(function(d) { return d.name; })
        .textAngle(function(d) { return Math.PI/2 + wedge_scale(d.start + Math.abs((d.start - d.end) / 2)); } );

    this.markers.anchor("end").add(pv.Dot).shape("triangle").size(10)
        .angle(function(d) { return wedge_scale(d.end) - Math.PI/2; });

    this.labels1
        .font(conf.font_size + ' ' + conf.font_family)
        .text(function(d) { if(!d.isSmall) return d.name; else return ""; })
        .textAngle(function(d) { return Math.PI/2 + wedge_scale(d.start + Math.abs((d.start - d.end) / 2)); } );

    this.labels2
        .font(conf.font_size + ' ' + conf.font_family)
        .text(function(d) { return d.name; })
        .textAngle(function(d) { return Math.PI/2 + wedge_scale(d.start + Math.abs((d.start - d.end) / 2)); } );


    this.fat_borders
        .data(function() { if(conf.fat_strands) return data; else return []; })
        .lineWidth(3)
        .fillStyle(null)
        .outerRadius(function(d) {
    	    if(d.strand == "-") { return (conf.radius - conf.shift - conf.barsize); }
    	    else { return (conf.radius); }
        })
        .innerRadius(function(d) {
    	    if(d.strand == "-") { return (conf.radius - conf.shift - conf.barsize); }
    	    else { return (conf.radius); }
        });

    // if annotations are available, render them as a heat scale
    this.anno
        .data([])
        .left(conf.center)
        .top(conf.center)
        .lineWidth(0)
        .outerRadius(conf.radius - conf.shift - conf.barsize)
        .innerRadius(conf.radius - conf.shift - conf.barsize - 10)
        .angle(function(d) { return wedge_scale(1); });

    if(conf.anno_enable && annotations.data.length > 0) {
        this.anno
            .data(annotations.data)
            .startAngle(function(d) { return wedge_scale(this.index); })
            .fillStyle(annotations.scale);
    } else {
        this.anno.data([]);
    }

    var d = new Date();
    var timing = d.getTime() - timer;
};

function BarVis(panel) {
    this.bars = panel.add(pv.Bar);
    // this.smalls = panel.add(pv.Bar);

    this.label = this.bars.anchor("center").add(pv.Label);
    // this.label2 = this.smalls.anchor("center").add(pv.Label);

    this.caption_heading = panel.add(pv.Label);
    this.caption_add = panel.add(pv.Label);
    this.caption_image = panel.add(pv.Image).url(conf.caption_pic)
        .width(conf.caption_pic_width).height(conf.caption_pic_height);

    this.markers = panel.add(pv.Rule);
    this.marker_labels = this.markers.anchor("top").add(pv.Label);

    this.buffer_width = 0;
}

BarVis.prototype.notify = function(conf) {
    var max = pv.max(data, function(d) { return d.end; } );
    conf.center = (conf.width + conf.margin) / 2;

    var me = this,
    bar_scale = pv.Scale.linear(0, max).range(0, conf.width*conf.lines);

    // filter out smalls and shift them
    if(this.buffer_width != conf.width && conf.filter_smalls) {
        this.small_data = get_smalls(data, conf, function(size) { 
            // arc length
            var degrees = wedge_scale(size) * (180 / Math.PI);
            return (degrees * Math.PI * conf.radius) / 180;
        });
    }

    if(!conf.filter_smalls) {
        this.small_data = [];
    }

    var line_tmp = 0;

    for(var i = 0; i < data.length; ++i) {
        if(bar_scale(data[i].end) > (conf.width * (line_tmp + 1))) {
            ++line_tmp;
        }
        data[i].line = line_tmp;
    }

    var foo;

    this.bars
        .data(data)
        .left(function(d) { return conf.margin + bar_scale(d.start) - d.line*conf.width; })
        .width(function(d) { return bar_scale(d.end) - bar_scale(d.start); })
        .top(function(d) { // spacing for the caption + upper rows
            // parseInt yeah
            return parseInt(conf.caption_pic_height, 10) + 55 + (conf.barsize) * d.line; })
        .height(conf.barsize)
        .lineWidth(conf.border_size)
        .fillStyle(function(d) { if(conf.palette) return conf.palette(this.index); else return null; })
        .strokeStyle(conf.border_colour);

    // this.smalls
    //     .data(small_data)

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