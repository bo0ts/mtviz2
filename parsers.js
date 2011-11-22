function handle(evt, parser) {
    var reader = new FileReader();
    var file = evt.files[0];
    console.log("handling: " + file.name);
    reader.onloadstart = function() { console.log("starting"); }
    reader.onload = function(e) { parser(e.target.result); console.log("load end");
                                  // dirty switch_mode
                                  switch_mode("ring"); };
    reader.readAsText(file);
}

function parseBED(bed_string) {
    console.log("parsing");
    //windows/unix line endings
    var lines = bed_string.split(/\r\n|\r|\n/);
    if(lines[lines.length - 1] == "") {
        lines.pop();
    }
    console.log("parsing: " + lines.length + " lines");

    data = new Array();
    for(var i = 0; i < lines.length; ++i) {
        var elems = lines[i].split("\t");
        //sucks but hey
        var obj = new Object();
        obj.type = elems[0];
        // never use parse int without a base
        obj.start = parseInt(elems[1], 10);
        obj.end = parseInt(elems[2], 10);
        obj.name = elems[3];
        obj.foo = elems[4];
        obj.strand = elems[5];

        // strip trn
        if(obj.name.indexOf("trn") == 0) {
	    obj.name = obj.name.substr(3, obj.name.substr.length);
        }
        
        data.push(obj);
    }

    conf.notify();
}

function parseData(data) {  
    console.log("parsing");
    //windows/unix line endings
    var lines = data.split(/\r\n|\r|\n/);
    if(lines[lines.length - 1] == "") {
        lines.pop();
    }

    console.log("parsing: " + lines.length + " lines");
    annotations = { data: [] };

    lines.forEach(function(d) { annotations.data.push(parseFloat(d)); });

    annotations.min = pv.min(annotations.data);
    annotations.median = pv.median(annotations.data);
    annotations.max = pv.max(annotations.data);
    annotations.scale = pv.Scale.linear(annotations.min, annotations.median, annotations.max)
        .range('red', 'yellow', 'green');

    conf.notify();
}