function handle(evt, parser) {
    var reader = new FileReader();
    var file = evt.files[0];
    console.log("handling: " + file.name);
    reader.onloadstart = function() { console.log("starting"); }
    reader.onload = function(e) { parser(e.target.result); console.log("load end");
                                  reload(); vis.render(); };
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
        data.push(obj);
    }
}

function parseData(data) {  
    console.log("parsing");
    //windows/unix line endings
    var lines = data.split(/\r\n|\r|\n/);
    if(lines[lines.length - 1] == "") {
        lines.pop();
    }

    console.log("parsing: " + lines.length + " lines");

    annotations = new Array();
    lines.forEach(function(d) { annotations.push(parseFloat(d)); });
}