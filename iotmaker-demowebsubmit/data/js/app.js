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
var nhietdo =document.getElementById("temp");
var doam = document.getElementById("humid");
var volt, current, power, factor;
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
            nhietdo.value = data.nhietdo;
            doam.value = data.doam;
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
    if (document.getElementById('volt-chart') == null)
        return;
    volt = new Chart('volt-chart', 500, 0, 220);
    current = new Chart('current-chart', 500, 0, 17);
    power = new Chart('power-chart', 500, 0, 2000);
    factor = new Chart('factor-chart', 500, 0, 100);
    // WS.open('ws://' + location.host + '/ws');

    setInterval(function() {
        volt.addTest();
        current.addTest();
        power.addTest();
        factor.addTest();
    }, 500);

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

function scan(el) {
    el.innerHTML = "Scanning...";
    el.disabled = true;
    el.className = '';
    WS.request('wifi', 'get', [], el, document.getElementById('scan-table'));
}

function set_ssid(value) {
    console.log(value);
    document.getElementById('ssid').value = value;
}
