#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WiFiMulti.h>
#include <ESP8266mDNS.h>
#include <ESP8266WebServer.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include "gpio.h"
#include <FS.h>   // Include the SPIFFS library
#include <DHT.h>

#define DHTPIN 5
#define DHTTYPE DHT11

unsigned long previousMillis = 0;
const long interval = 1000;

DHT dht(DHTPIN, DHTTYPE);

const char *ssid = "TUNG";

//ESP8266WiFiMulti wifiMulti;     // Create an instance of the ESP8266WiFiMulti class, called 'wifiMulti'

ESP8266WebServer server(80);    // Create a webserver object that listens for HTTP request on port 80
WebSocketsServer webSocket = WebSocketsServer(81);

char* Json="";
AppGPIO gpio;
DynamicJsonBuffer jsonBuffer;
String change_data(char* json)
{
  JsonObject& object = jsonBuffer.parseObject(json);
  String method = object["method"].asString();
  Serial.print(method);
  JsonArray& allParams =  object["param"];
  gpio.set(allParams);
  return method;
}
bool load_data(float temp,float humd)
{
  String temp_char = String(temp,3);
  String humd_char = String(humd,3);
  String json1 ="";
  json1 = String("{") +"\"nhietdo\":" + temp_char+ ","+ "\"doam\":" +humd_char + "}";
  webSocket.broadcastTXT(json1);
}
String getContentType(String filename); // convert the file extension to the MIME type
bool handleFileRead(String path);       // send the right file to the client (if it exists)

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t lenght) {
  switch (type) {
    case WStype_DISCONNECTED:
      break;
    case WStype_CONNECTED: 
      break;
    case WStype_TEXT:
      Json=(char*)payload;
      Serial.println();
      Serial.println();
      Serial.println();
      //Serial.print(Json);
      change_data(Json);
      //webSocket.broadcastTXT("data");
      break;
  }

}

void setup() {
  Serial.begin(115200);        // Start the Serial communication to send messages to the computer
  WiFi.softAP(ssid);
  delay(10);
  dht.begin();
  Serial.println('\n');
  pinMode(16, OUTPUT);
  /*wifiMulti.addAP("420super", "024024024");   // add Wi-Fi networks you want to connect to
  wifiMulti.addAP("iotmaker_nho", "@iotmaker.vn");
  wifiMulti.addAP("ssid_from_AP_3", "your_password_for_AP_3");*/

  /*Serial.println("Connecting ...");
  int i = 0;
  while (wifiMulti.run() != WL_CONNECTED) { // Wait for the Wi-Fi to connect
    delay(250);
    Serial.print('.');
  }
  Serial.println('\n');
  Serial.print("Connected to ");
  Serial.println(WiFi.SSID());              // Tell us what network we're connected to
  Serial.print("IP address:\t");
  Serial.println(WiFi.localIP());          // Send the IP address of the ESP8266 to the computer

  if (MDNS.begin("http://esp8266",WiFi.localIP())) {              // Start the mDNS responder for esp8266.local
    Serial.println("mDNS responder started");
  } else {
    Serial.println("Error setting up MDNS responder!");
  }*/

  SPIFFS.begin();                           // Start the SPI Flash Files System
  
  server.onNotFound([]() {                              // If the client requests any URI
    if (!handleFileRead(server.uri()))                  // send it if it exists
      server.send(404, "text/plain", "404: Not Found"); // otherwise, respond with a 404 (Not Found) error
  });

  server.begin();                           // Actually start the server
  Serial.println("HTTP server started");
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop(void) {
  unsigned long currentMillis = millis();
  server.handleClient();
  webSocket.loop();
  float temp = dht.readTemperature();
  float humid = dht.readHumidity();
   if(currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
  load_data(temp,humid);
   }
}

String getContentType(String filename) { // convert the file extension to the MIME type
  if (filename.endsWith(".html")) return "text/html";
  else if (filename.endsWith(".css")) return "text/css";
  else if (filename.endsWith(".js")) return "application/javascript";
  else if (filename.endsWith(".ico")) return "image/x-icon";
  return "text/plain";
}

bool handleFileRead(String path) { // send the right file to the client (if it exists)
  //Serial.println("handleFileRead: " + path);
  if (path.endsWith("/")) path += "index.html";         // If a folder is requested, send the index file
  String contentType = getContentType(path);            // Get the MIME type
  if (SPIFFS.exists(path)) {                            // If the file exists
    File file = SPIFFS.open(path, "r");                 // Open it
    size_t sent = server.streamFile(file, contentType); // And send it to the client
    file.close();                                       // Then close the file again
    return true;
  }
  Serial.println("\tFile Not Found");
  return false;                                         // If the file doesn't exist, return false
}
