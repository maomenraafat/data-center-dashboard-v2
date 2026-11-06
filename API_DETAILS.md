# ESP32 REST API Reference for Web Developers

This document serves as the complete technical integration guide for front-end developers building web dashboards, diagnostic HMIs, or simulation interfaces for the **ESP32 13-Channel WS2812 Controller**.

---

## 1. Quick Connection & Architecture Overview

* **Base URL**: `http://<ESP32_IP>`
  * **Station / Node IP**: `http://192.168.4.50` *(configured static IP on local LAN)*
  * **SoftAP Mode (Fallback Direct Wi-Fi)**: `http://192.168.4.50` *(SSID: `ESP32-LED-AP`, Pass: `12345678`)*
* **Port**: `80` (HTTP)
* **Format**: All requests and responses use **JSON** (`Content-Type: application/json`).
* **CORS Support**: The firmware natively returns `Access-Control-Allow-Origin: *` and handles all browser `OPTIONS` preflight checks. You can send requests directly from any browser origin (`localhost:3000`, `file://`, or a deployed domain).

---

## 2. API Quick Reference Cheat Sheet

| Endpoint | Method | Primary Purpose | Key Parameters |
|---|---|---|---|
| [`/api/status`](#1-system-status--strip-topology-get-apistatus) | `GET` | Fetch board telemetry & list all configured strip channels | None |
| [`/api/packet`](#2-packet-sweep-animation-post-apipacket) | `POST` | Sweep a single glowing packet along a link/strip | `code` or `strip`, `reverse`, `color`, `speed` |
| [`/api/leds`](#3-bulk-led--effect-control-post-apileds) | `POST` | Set strip/global animations, effects, or fault colors | `target`, `stripIndex`, `mode`, `color`, `intensity` |
| [`/api/led/pixel`](#4-single-pixel-direct-control-post-apiledpixel) | `POST` | Light a single specific LED on a specific strip | `strip`, `pixel`, `color`, `intensity` |
| [`/api/config/strips`](#5-hardware-strip-configuration-post-apiconfigstrips) | `POST` | Persist strip pins, lengths, codes & reverse flags to Flash | `strips: [...]` |
| [`/api/config/network`](#6-network-configuration-post-apiconfignetwork) | `POST` | Update Wi-Fi credentials and static IP settings | `boardName`, `staticIP`, `apSSID`, `staSSID` |
| [`/api/test`](#7-hardware-commissioning-tests-post-apitest) | `POST` | Run diagnostic test routines on the physical hardware | `scenario`, `durationMs` |
| [`/api/peers`](#8-multi-board-discovery-get-apipeers) | `GET` | List active peer ESP32 boards on the network | None |
| [`/api/proxy`](#9-multi-board-relay-proxy-getpost-apiproxy) | `GET`/`POST` | Relay commands to peer ESP32 boards | Query params: `target`, `path` |

---

## 3. Detailed Endpoint Specifications

### 1. System Status & Strip Topology: `GET /api/status`

Use this on page load and poll every 3–5 seconds to get current controller health, network config, and the list of active strips.

#### Request Example (JavaScript Fetch)
```javascript
const res = await fetch("http://192.168.4.50/api/status", { cache: "no-store" });
const data = await res.json();
```

#### Response Example (`200 OK`)
```json
{
  "board": {
    "id": "ESP32-SiteA-Controller",
    "name": "ESP32 Node 2 (Site A)",
    "ip": "192.168.4.50",
    "uptime": 1420,
    "freeHeap": 218400,
    "isHost": false
  },
  "network": {
    "apSSID": "ESP32-LED-AP",
    "apPass": "12345678",
    "staSSID": "Bloom_Core_WiFi",
    "staticIP": "192.168.4.50",
    "gateway": "192.168.4.50",
    "subnet": "255.255.255.0"
  },
  "masterPower": true,
  "masterBrightness": 255,
  "activeTest": "none",
  "strips": [
    {
      "index": 0,
      "enabled": true,
      "pin": 4,
      "length": 30,
      "name": "R5-SA",
      "mode": "solid",
      "color": "#000000",
      "intensity": 255,
      "speed": 50,
      "reversed": false
    },
    {
      "index": 1,
      "enabled": true,
      "pin": 13,
      "length": 30,
      "name": "SA-S15",
      "mode": "solid",
      "color": "#000000",
      "intensity": 255,
      "speed": 50,
      "reversed": true
    }
  ]
}
```

---

### 2. Packet Sweep Animation: `POST /api/packet`

**Primary API for Network Traffic Simulators.** Sweeps a single illuminated packet along a physical strip without blocking the ESP32. When the packet reaches the end of the strip, the strip automatically turns off.

#### Request Body Schema
```json
{
  "code": "R5-SA",          // Target by Connection Code (e.g. "R5-SA") OR use "strip": 0
  "reverse": false,         // Logical Direction: false = Node A -> Node B; true = Node B -> Node A
  "color": "#00E5FF",       // Packet color: Hex string ("#RRGGBB") or 0x00RRGGBB integer
  "intensity": 255,         // Brightness: 0 - 255 (default: 255)
  "speed": 20               // Milliseconds per LED hop (lower = faster, default: 25)
}
```

> **Hardware Direction Note**: If a strip is physically wired in reverse, the firmware's `reversed` flag automatically compensates. Front-end code only needs to set logical `reverse: false` for normal traffic (A to B) and `true` for return traffic (B to A).

#### Response Example (`200 OK`)
```json
{
  "status": "success",
  "strip": 0,
  "code": "R5-SA",
  "length": 30,
  "reverse": false,
  "mountedReversed": false,
  "speed": 20
}
```

---

### 3. Bulk LED & Effect Control: `POST /api/leds`

Used for steady state lighting, fault indicators (e.g. coloring a broken link red), turning strips off, or ambient animation effects.

> Alias: `POST /api/led` is also accepted.

#### Request Body Schema
```json
{
  "target": "strip",            // "all" | "strip" | "pixel"
  "stripIndex": 0,              // 0 to 12 (required if target is "strip" or "pixel")
  "pixelIndex": 5,              // Required only if target is "pixel"
  "mode": "solid",              // "solid" | "breathe" | "strobe" | "chase" | "rainbow" | "fire" | "wipe" | "twinkle" | "off"
  "color": "#EF4444",           // Hex string ("#RRGGBB") or 0x00RRGGBB integer
  "secondaryColor": "#000000",  // Optional secondary color for 2-color effects
  "intensity": 255,             // Brightness: 0 - 255 (default: 255)
  "speed": 60,                  // Animation speed: 1 - 100 (default: 50)
  "masterPower": true,          // Optional: global power toggle
  "masterBrightness": 255       // Optional: global brightness scalar
}
```

#### Common Use Cases:

1. **Light a failed cable solid red:**
   ```json
   { "target": "strip", "stripIndex": 2, "mode": "solid", "color": "#EF4444", "intensity": 220 }
   ```

2. **Turn off a specific strip:**
   ```json
   { "target": "strip", "stripIndex": 2, "mode": "off" }
   ```

3. **Global emergency strobe across all strips:**
   ```json
   { "target": "all", "mode": "strobe", "color": "#EF4444", "speed": 85 }
   ```

---

### 4. Single-Pixel Direct Control: `POST /api/led/pixel`

Fastest method to set a single specific LED on a specific strip. Ideal for dead-pixel diagnostics or step-by-step boundary verification.

#### Request Body Schema
```json
{
  "strip": 0,                   // Strip channel index (0 to 12)
  "pixel": 14,                  // Pixel index (0-based)
  "color": "#00FF00",           // Hex color string or uint32
  "intensity": 255              // Brightness: 0 - 255
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success",
  "strip": 0,
  "pixel": 14
}
```

---

### 5. Hardware Strip Configuration: `POST /api/config/strips`

Persists GPIO pin assignments, lengths, connection labels, and reverse direction flags directly to **ESP32 NVS Flash memory**. The firmware reinitializes LED driver channels immediately without requiring a reboot.

#### Request Body Schema
```json
{
  "strips": [
    {
      "index": 0,               // Channel index (0 to 12)
      "enabled": true,          // true to power channel, false to keep GPIO strictly 0V
      "pin": 4,                 // Safe GPIO: 4, 13, 14, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33
      "length": 30,             // Number of WS2812 LEDs (1 to 2000)
      "name": "R5-SA",          // Connection Code / Label
      "reversed": false         // Set true if strip is physically mounted in reverse
    }
  ]
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success",
  "message": "Strip configuration saved to flash & reloaded"
}
```

---

### 6. Network Configuration: `POST /api/config/network`

Saves Wi-Fi credentials, host mode, and static IP configuration to NVS flash, then triggers an automatic network interface restart.

#### Request Body Schema
```json
{
  "boardName": "ESP32-SiteA",
  "isHost": false,              // true = Host SoftAP; false = Node Station
  "apSSID": "ESP32-LED-AP",
  "apPass": "12345678",
  "staSSID": "Bloom_Core_WiFi",
  "staPass": "NetworkPassword",
  "staticIP": "192.168.4.50",
  "gateway": "192.168.4.50",
  "subnet": "255.255.255.0"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success",
  "message": "Network settings saved. Restarting network interface."
}
```

---

### 7. Hardware Commissioning Tests: `POST /api/test`

Runs built-in automated hardware diagnostic routines across all enabled channels.

#### Request Body Schema
```json
{
  "scenario": "all_white",      // "all_white" | "rgb_cycle" | "strip_chaser" | "boundary_walk" | "blackout"
  "durationMs": 0               // Test duration in ms (0 = run indefinitely until stopped)
}
```

* **`all_white`**: Lights all enabled strips at 50% white to check 5V power supply capacity and voltage drop.
* **`rgb_cycle`**: Cycles all channels through Red, Green, and Blue to verify color channel order (GRB vs RGB).
* **`strip_chaser`**: Lights strips sequentially (Strip 0, Strip 1, ...) to verify physical wiring numbering.
* **`boundary_walk`**: Lights the first and last LED of every strip to verify configured strip lengths.
* **`blackout`**: Turns off all channels and cancels active tests.

---

### 8. Multi-Board Discovery: `GET /api/peers`

Returns a list of all active ESP32 boards on the local subnet discovered via UDP background heartbeats.

#### Response Example (`200 OK`)
```json
[
  {
    "id": "ESP32-SiteA",
    "name": "Site A Controller",
    "ip": "192.168.4.50",
    "strips": 13,
    "power": true
  },
  {
    "id": "ESP32-SiteB",
    "name": "Site B Controller",
    "ip": "192.168.4.51",
    "strips": 8,
    "power": true
  }
]
```

---

### 9. Multi-Board Relay Proxy: `GET` / `POST /api/proxy`

Enables the browser to communicate with other ESP32 nodes through a single gateway ESP32, bypassing client-side network or routing constraints.

* **Query Parameters**:
  * `target`: IP address of target ESP32 (e.g. `192.168.4.51`)
  * `path`: Relative API endpoint (e.g. `/api/packet`)

#### Example:
```javascript
// Relays a packet command to another board via the primary ESP32
fetch("http://192.168.4.50/api/proxy?target=192.168.4.51&path=/api/packet", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ code: "WAN-R5", speed: 20 })
});
```

---

## 4. Standard Site A Connection Codes

When targeting links via `/api/packet` with the `code` parameter, use these standardized connection names:

| Code | Link Origin / Destination | Type |
|---|---|---|
| `WAN-R5` | WAN Gateway ➔ Router 5 | Primary Inbound Link |
| `WAN-R4` | WAN Gateway ➔ Router 4 | Backup Inbound Link |
| `R5-SA` | Router 5 ➔ Switch for AI | Primary High-Speed Uplink |
| `R5-R4` | Router 5 ➔ Router 4 | Inter-Router Serial Link |
| `R4-SA` | Router 4 ➔ Switch for AI | Redundant Uplink |
| `R4-S1` | Router 4 ➔ Access Switch 1 | Distribution Link 1 |
| `R4-S2` | Router 4 ➔ Access Switch 2 | Distribution Link 2 |
| `S1-S2` | Access Switch 1 ➔ Access Switch 2 | Switch Interconnect |
| `SA-S15` | Switch for AI ➔ Server 15 | Dedicated GPU Cluster Link |
| `S1-S13` | Access Switch 1 ➔ Server 13 | CPU Compute Node |
| `S1-S14` | Access Switch 1 ➔ Server 14 | CPU Compute Node |
| `S2-S11` | Access Switch 2 ➔ Server 11 | CPU Compute Node |
| `S2-S12` | Access Switch 2 ➔ Server 12 | CPU Compute Node |

---

## 5. Front-End Integration Template

Here is a lightweight JavaScript client class to drop into any front-end project:

```javascript
class EspController {
  constructor(ip = "192.168.4.50") {
    this.baseUrl = `http://${ip.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  }

  // 1. Get status and topology
  async getStatus() {
    const res = await fetch(`${this.baseUrl}/api/status`, {
      signal: AbortSignal.timeout(3000),
      cache: "no-store"
    });
    if (!res.ok) throw new Error(`Status error: ${res.status}`);
    return await res.json();
  }

  // 2. Trigger packet sweep
  async sendPacket(targetCodeOrIndex, reverse = false, color = "#00E5FF", speed = 20) {
    const payload = {
      reverse: Boolean(reverse),
      color: color,
      speed: Number(speed)
    };
    if (typeof targetCodeOrIndex === "number") {
      payload.strip = targetCodeOrIndex;
    } else {
      payload.code = targetCodeOrIndex;
    }

    const res = await fetch(`${this.baseUrl}/api/packet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  // 3. Set strip mode or color
  async setStripMode(stripIndex, mode = "solid", color = "#00FF00", intensity = 255) {
    const res = await fetch(`${this.baseUrl}/api/leds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: "strip",
        stripIndex: stripIndex,
        mode: mode,
        color: color,
        intensity: intensity
      })
    });
    return await res.json();
  }
}

// Example Usage:
// const esp = new EspController("192.168.4.50");
// esp.sendPacket("R5-SA", false, "#00E5FF", 20);
```
