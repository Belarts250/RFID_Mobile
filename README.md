RFID Integrated MQTT Payment Mobile App (Term 1)

A real-time IoT payment system with a mobile dashboard, persistent RFID card balances, and live communication using MQTT, WebSockets, and a Node.js backend.
The system allows users to scan RFID cards, monitor balances, and perform top-ups directly from a mobile application.

🏗 System Architecture

The system connects RFID hardware, cloud messaging, backend services, and a mobile app.

graph TD
    subgraph "Hardware Layer (ESP8266)"
        RFID[RC522 RFID Reader] -->|UID Scan| ESP[ESP8266 NodeMCU]
        ESP -->|MQTT Publish| Broker[MQTT Broker]
    end

    subgraph "Backend Layer"
        Broker -->|MQTT Subscribe| Server[Node.js Backend]
        Server -->|WebSocket API| Mobile[Mobile App]
    end

    subgraph "User Interaction"
        AppUser[Mobile App User] -->|Top-up Request| Mobile
        Mobile -->|HTTP POST /topup| Server
        Server -->|MQTT Publish| Broker
        Broker -->|Command| ESP
        ESP -->|Updated Balance| Broker
    end

🛠 Hardware Specifications
RFID Reader Wiring (RC522 → ESP8266)
RC522 Pin	ESP8266 Pin	Description
SDA (SS)	D8	SPI Slave Select
SCK	D5	SPI Clock
MOSI	D7	SPI Master Out Slave In
MISO	D6	SPI Master In Slave Out
GND	GND	Ground
RST	D3	Reset
3.3V	3.3V	Power Supply
Firmware Logic

The firmware stores card balances using:

std::map<String, int>

This allows the system to:

• maintain independent balances for each RFID card
• manage memory efficiently
• isolate card data safely

📡 Communication Protocol (MQTT)

Team ID

1nt3rn4l_53rv3r_3rr0r

Broker Host

157.173.101.159:1883
Action	Topic	Payload	Description
Card Scan Event	rfid/1nt3rn4l_53rv3r_3rr0r/card/status	{"uid":"...","balance":0}	Sent when a card is scanned
Top-up Command	rfid/1nt3rn4l_53rv3r_3rr0r/card/topup	{"uid":"...","amount":100}	Sent from backend to hardware
Balance Update	rfid/1nt3rn4l_53rv3r_3rr0r/card/balance	{"uid":"...","new_balance":100}	Hardware publishes new balance
📱 Mobile Application

The system includes a React Native / Expo mobile app that replaces the traditional web dashboard.

Key Features

• Real-Time Card Scanning Events
The mobile app instantly displays scanned RFID cards.

• Live Balance Monitoring
Balances update automatically using WebSockets.

• Remote Top-up
Users can add credit to cards directly from the mobile app.

• Device Status Monitoring
Shows whether the RFID reader is connected.

• Activity Log Viewer
Displays a stream of all system events.

Mobile UI Overview

Example interface structure:

RFID Payment Mobile App
-----------------------------

Reader Status
🟢 Online

Last Card Scanned
UID: 1A2B3C4D

Current Balance
500 RWF

Actions
[ Top-up Card ]
[ View Logs ]
[ Registered Cards ]
💻 Backend Server

The backend is built using Node.js and Express.

Responsibilities

• Handle API requests from the mobile app
• Translate MQTT messages from hardware
• Broadcast updates using WebSockets
• Manage top-up commands

🔌 API Documentation
POST /topup

Adds money to a specific RFID card.

Request
{
  "uid": "1a2b3c4d",
  "amount": 1000
}
Validation Rules

amount must be between 1 and 1,000,000

uid must be a valid string

🚀 Running the Mobile App
1 Install Requirements

Install:

Node.js (v16+)

Arduino IDE

Expo CLI

npm install -g expo
⚙ Backend Setup

Navigate to the project folder:

npm install

Start the backend server:

node server.js

The backend will run on:

http://localhost:5000
📱 Start the Mobile App

Inside the mobile app folder run:

npx expo start

Then:

Install Expo Go on your tablet or phone

Scan the QR code

The RFID dashboard opens as a mobile application

🔧 ESP8266 Firmware Setup

Open the firmware file:

RFID_MQTT/RFID_MQTT.ino

Install required libraries:

MFRC522

PubSubClient

ArduinoJson

Update:

WIFI_SSID
WIFI_PASS
MQTT_HOST

Upload the code to the NodeMCU board.

🌐 System Workflow
RFID Card
   ↓
RC522 Reader
   ↓
ESP8266
   ↓ MQTT
MQTT Broker
   ↓
Node.js Backend
   ↓
Mobile App

The mobile app becomes the control dashboard for the entire system.

🧪 Troubleshooting
Device Not Detected

Install the CH340 driver for NodeMCU:

https://sparks.gogo.co.nz/ch340.html

MQTT Connection Failed

Check if the broker is reachable:

157.173.101.159
Mobile App Cannot Connect

Make sure:

• backend server is running
• port 5000 is not blocked
• phone and server are on the same network

RFID Not Reading

Check wiring carefully, especially:

SDA → D8
RST → D3
Balance Resets

Balances are stored in RAM using std::map.

If ESP8266 restarts:

• balances reset
• top-ups must be reissued

