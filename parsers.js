function handle(file) {
    var reader = new FileReader();
    console.log("handling");
    console.log(file[0].name);
    reader.onload = function() { parseBED(this.result); console.log("load end"); };
    reader.readAsText(file[0]);
}

function parseBED(bed_string) {
    //windows/unix line endings
    var lines = bed_string.split(/\r\n|\r|\n/);
    if(lines[lines.length - 1] == "") {
        lines.pop();
    }
    console.log("parsing: " + lines.length + " lines");
    var arr = new Array();
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
        arr.push(obj);
    }

    data = arr;
    console.log("parsed genes: " + arr.length);
    console.log(data[0]);
    reload();
    vis.render();
}