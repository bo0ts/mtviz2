function handle(file) {
    var reader = new FileReader();
    console.log("handling");
    console.log(file[0].name);
    reader.onloadstart = function() { alert("starting"); };
    reader.onload = parseBED;
    reader.readAsText(file[0]);
}

function parseBED(bed_string) {
    //windows/unix line endings
    var lines = bed_string.split(/\r\n|\r|\n/);
    var arr = new Array();
    for(var i in lines) {
        var elems = lines[i].split("\t");
        //sucks but hey
        var obj;
        obj.type = elems[0];
        // never use parse int without a base
        obj.start = parseInt(elems[1], 10);
        obj.end = parseInt(elems[2], 10);
        obj.name = elems[3];
        obj.foo = elems[4];
        obj.strand = elems[5];
    }

    data = arr;
    alert(data[0]);
    console.log(data[0]);
    wedge.data(data);
    vis.render();
}