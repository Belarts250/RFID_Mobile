# MQTT Topics

This project uses the following MQTT topics for communication between the ESP8266 and the Node.js server.

| Topic | Direction | Description |
|---|---|---|
| `rfid/{team_id}/card/status` | ESP8266 -> Server | Published when a card is scanned. Contains UID and balance. |
| `rfid/{team_id}/card/balance` | ESP8266 -> Server | Published when balance is updated on ESP8266. |
| `rfid/{team_id}/card/topup` | Server -> ESP8266 | Published when a top-up is processed. ESP8266 should update local balance. |
| `rfid/{team_id}/card/pay` | Server -> ESP8266 | Published when a payment is processed. ESP8266 should update local balance. |

**Base Path:** `rfid/5ynth4x 3rr0r/`
