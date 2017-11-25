// MIT License:
//
// Copyright (c) 2010-2013, Joe Walnes
//               2013-2014, Drew Noakes
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
;


//Applicaiton code
var index = 0;
var nhietdo_char = [];
var doam_char = [];
var nhietdo =document.getElementById("temp");
var doam = document.getElementById("humid");
function setMsg(cls, text) {
    sbox = document.getElementById('status_box');
    sbox.className = "siimple-alert  siimple-alert--" + cls;
    sbox.innerHTML = text;
    console.log(text);
}

var WS = {
    ws: undefined,
    connected: false,
    open: function(uri) {
        this.instance = null;
        this.ref = null;
        this.ws = new WebSocket(uri);
        this.ws.binaryType = 'arraybuffer';
        this.ws.onopen = function(evt) {
            setMsg("done", "WebSocket is open.");
            WS.connected = true;
        };
        this.ws.onerror = function(evt) {
            setMsg("error", "WebSocket error!");
            this.connected = false;
        };
        this.ws.onmessage = function(evt) {
            var data = JSON.parse(evt.data);
            console.log(data.nhietdo);
            nhietdo.innerHTML = data.nhietdo;
            doam.innerHTML = data.doam;
            if(nhietdo_char.length <10)
            {
                nhietdo_char.push({x: index , y: data.nhietdo});
                doam_char.push({x: index, y: data.doam});
                index++ ;
            }
            else
            {
                nhietdo_char.shift();
                doam_char.shift();
            }
        };
    },
    write: function(data) {
        if (this.connected)
            this.ws.send(data);
    },
    request: function(action, method, params, instance, ref) {
        var reqObject = {
            type: 'req',
            method: method,
            action: action,
            param: params
        }
        console.log(reqObject, this);
        this.instance = instance;
        this.ref = ref;
        this.write(JSON.stringify(reqObject));
        console.log(JSON.stringify(reqObject));
    }
}


window.onload = function() {
    WS.open('ws://192.168.4.1:81/ws');
    var url = window.location.host;
    console.log(url);
    var chart = new CanvasJS.Chart("humid-chart", {
    animationEnabled: true,
    exportEnabled: false,
    title:{
        text: "HUMID"
    },
    axisY:{ 
        title: "Độ ẩm",
        includeZero: false, 
        suffix: "%",
        valueFormatString: "#.0"
    },
    data: [{
        type: "splineArea",
        color: "rgba(54,158,173,.7)",
        markerSize: 5,
        dataPoints: doam_char
    }]
});

    var chart1 = new CanvasJS.Chart("temp-chart", {
    animationEnabled: true,
    exportEnabled: false,
    title:{
        text: "TEMPERATOR"
    },
    axisY:{ 
        title: "nhiệt độ",
        includeZero: false, 
        suffix: "oC",
        valueFormatString: "#.0"
    },
    data: [{
        type: "splineArea",
        color: "red",
        markerSize: 5,
        dataPoints: nhietdo_char
    }]
});
    chart.render();
    chart1.render();
    var updateChart = function () {
    chart.render();
    chart1.render();     
     // update chart after specified time. 
};
setInterval(function(){
    updateChart()
}, 1000);
};

function led() {
    if (document.getElementById('led-switch').checked)
        WS.request('gpio', 'post', [{
            io: 16,
            val: 0
        }]);
    else
        WS.request('gpio', 'post', [{
            io: 16,
            val: 1
        }]);
}