/*
* @Author: TuanPM
* @Date:   2017-03-05 13:36:54
* @Last Modified by:   TuanPM
* @Last Modified time: 2017-03-05 14:20:30
*/

#include "gpio.h"

String AppGPIO::get(JsonArray& gpioArr)
{
	String resp = "[";
	for (JsonArray::iterator item = gpioArr.begin(); item != gpioArr.end(); ++item) {
		if(resp != "[")
			resp += ",";

		String io = (*item)["io"].asString();
		String val = String(digitalRead(io.toInt()));
		
		resp += "{\"io\":" + io + ",\"val\":" + val + "}"; 
		
	}
	resp += "]";
	return resp;
}

String AppGPIO::set(JsonArray& gpioArr)
{
	String resp = "[";
	for (JsonArray::iterator item = gpioArr.begin(); item != gpioArr.end(); ++item) {
		if(resp != "[")
			resp += ",";

		String io = (*item)["io"].asString();
		String val = (*item)["val"].asString();
		if(io != "" && val != "") {
			digitalWrite(io.toInt(), val.toInt());
		}
		
		resp += "{\"io\":" + io + ",\"val\":" + val + "}"; 
		
	}
	resp += "]";
	return resp;
}