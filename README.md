# ⚡ PLC-Connect Hub (v4.0)

**Industrial Edge PWA & Protocol Bridge for SCADA Integration**

[Explore Web App](https://githubbest729.github.io/PLC-Connect-Hub/) • [Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [Supported Hardware](#-supported-hardware--drivers) • [Troubleshooting](#-troubleshooting--faq)

## 📋 Executive Overview

**PLC-Connect Hub** resolves the persistent challenges faced by Instrumentation, Controls, and SCADA Engineers on the factory floor:

1. **Disconnected Tooling:** Eliminates fragile Excel macros and manual address translation tables across divergent industrial protocols.
2. **Network Protocol Sandboxing:** Bridges the gap between web browsers (which cannot directly open TCP/UDP sockets) and plant floor networks via a lightweight, read-only Node.js companion bridge.
3. **True Offline Resilience:** Functions as a 100% air-gapped Progressive Web App (PWA) with client-side IndexedDB persistence for field commissioning without WAN or cloud access.

## 🏗️ System Architecture

The project employs an asynchronous decoupled client-server model designed for safety and speed:

```mermaid
flowchart TB
    subgraph OT_Field_Network ["OT Plant Network - Air-Gapped"]
        PLC1["Siemens S7-300 / 1200 / 1500<br/>Port 102 - ISO-on-TCP"]
        PLC2["Allen-Bradley ControlLogix<br/>Port 44818 - EtherNet/IP CIP"]
        PLC3["Modbus TCP Gateways<br/>Port 502"]
        PLC4["Omron CS / CJ / NJ - FINS<br/>Port 9600 UDP/TCP"]
        PLC5["Mitsubishi Q / L / iQ-R - MELSEC<br/>Port 5007 3E Frame"]
    end

    subgraph Edge_Bridge ["Local Engineering Station - Node.js Bridge"]
        DRV["Protocol Engine - plc-drivers.js<br/>Read-only Polling Loop"]
        SRV["Edge Server - server.js<br/>Express + Socket.io Gateway :3000"]
        MOCK["Mock Simulation Engine<br/>--mock mode"]
        
        PLC1 -.->|TCP Reads| DRV
        PLC2 -.->|CIP Reads| DRV
        PLC3 -.->|FC01-04 Reads| DRV
        PLC4 -.->|FINS Reads| DRV
        PLC5 -.->|MC Reads| DRV
        MOCK -->|Synthetic Packets| SRV
        DRV -->|Normalized JSON| SRV
    end

    subgraph PWA_Frontend ["Engineering Workstation / Tablet - PWA"]
        UI["PLC-Connect UI - index.html / app.js"]
        
        subgraph Core_Modules ["Core Subsystems"]
            MAP["Tag Mapper Engine<br/>Wonderware / iFIX / OPC"]
            REG["Protocol Tools<br/>Modbus Register Calc & URIs"]
            SNIP["Snippet Vault<br/>QuickScript & SQL Library"]
            PROJ["Site Projects & BOM<br/>Kanban & AED + 5% VAT"]
            LIVE["Live Watchlist<br/>20-Tag Polling Grid"]
        end
        
        CACHE["Service Worker Cache<br/>Offline Static Shell"]
        IDB[("IndexedDB Storage<br/>plch_db")]
        
        SRV -->|Socket.io WebSockets| LIVE
        UI --> Core_Modules
        SNIP <--> IDB
        PROJ <--> IDB
        UI -.-> CACHE
    end
```

## ⚡ Core Features

### 1. Multi-Brand Cross-Syntax Tag Mapper

* **Siemens S7 (TIA Portal / Step 7):** Converts Data Block items (`DB1.DBD4`, `DB10.DBX0.0`) and Memory items (`MW100`, `M0.5`) to Wonderware `DASSIDirect` addressing syntax.
* **Rockwell / Allen-Bradley:** Maps legacy data files (`N7:0`, `B3:0/1`, `F8:0`) and ControlLogix/CompactLogix native symbolic tags (`Motor1.Speed`).
* **Omron (FINS):** Translates DM memory allocations (`D100`, `CIO0.01`, `W0.00`).
* **Mitsubishi Electric (MELSEC):** Maps Data Registers (`D1000`), Internal Relays (`M100`), and Links (`W10`).
* **GE Fanuc (SRTP / iFIX):** Handles `%R` Holding Registers, `%M` Bit Markers, and native iFIX database tags.
* **Bulk Processing:** Batch CSV import, validation, and instantaneous export of Wonderware/AVEVA DB load files.

### 2. SCADA Scaling & Formula Engine

* Computes zero-and-span analog transformations:

$$
\text{Engineering Value} = \left(\frac{\text{Raw} - \text{RawMin}}{\text{RawMax} - \text{RawMin}}\right) \times (\text{EngMax} - \text{EngMin}) + \text{EngMin}
$$

* Automatically generates ready-to-paste Wonderware **QuickScript** routines and standard **Structured Text** code blocks.

### 3. Industrial Protocol Utilities

* **Modbus Register Math:** Resolves 0-based vs 1-based indexing confusions across Holding Registers (4xxxx / FC03), Input Registers (3xxxx / FC04), and Coils (0xxxx / FC01).
* **Hex / Word Decomposition:** Calculates PDU offsets and handles 32-bit big-endian / little-endian word swaps.
* **Quick-Copy URIs:** One-click generation of OPC UA endpoint URIs, Modbus TCP connection strings, and socket ports.

### 4. Field Engineering Suite

* **Snippet Vault:** Local IndexedDB repository for complex SQL queries (Historian/Runtime aggregations) and reusable QuickScripts.
* **Kanban & Estimator:** Offline board for site acceptance testing (SAT) tracking and automated Bill of Materials (BOM) cost roll-ups in **AED with 5% VAT**.

### 5. Multi-Tag Live Watchlist

* Real-time monitoring grid supporting up to 20 concurrent tags with connection heartbeat, millisecond timestamps, and error flags.
* Integrated **"Send to Live Data"** dispatch directly from Tag Mapper results.

## 🔌 Supported Hardware & Drivers

| Brand | Protocol / Driver | Supported Address Range | Default Port | Companion Driver Status |
| :--- | :--- | :--- | :--- | :--- |
| **Siemens** | S7 Communication (ISO-on-TCP) | `DB`, `M`, `E` (Inputs), `A` (Outputs) | `102` | `node-snap7` (Optional native addon) |
| **Rockwell** | EtherNet/IP (CIP Core) | `N`, `B`, `F`, Symbolic Tags | `44818` | `ethernet-ip` (Pure JS) |
| **Modbus TCP** | Modbus Application Protocol | Coils `0xxxx`, Registers `4xxxx` | `502` | `modbus-serial` (Fully integrated) |
| **Omron** | FINS (Factory Interface Network) | `D` (DM), `CIO`, `W` (Work), `H` (Hold) | `9600` | Native Binary Driver |
| **Mitsubishi** | MELSEC MC Protocol (Q/L Series) | `D` (Data), `M` (Relay), `W` (Link) | `5007` | Native 3E Frame Driver |
| **GE Fanuc** | SRTP / GE iFIX Driver | `%R` (Register), `%M` (Bit) | `18245` | Mock Driver (Physical via OPC UA) |

> 🔒 **Safety Notice:** The backend driver layer is strictly **READ-ONLY**. It does not construct or emit PLC write commands under any circumstance.

## 🚀 Getting Started

### Option A: Cloud Web App (Static / Tag Mapping Mode)

Open [**PLC-Connect Hub on GitHub Pages**](https://githubbest729.github.io/PLC-Connect-Hub/) directly on your desktop, laptop, or mobile tablet.

* Works completely offline once loaded.
* Click the browser address bar icon to install as a standalone Desktop/Mobile PWA.

### Option B: Local Live Polling Node (Full Hardware Integration)

#### Prerequisites

* [Node.js](https://nodejs.org/) v18.0.0 or higher.
* Git installed on your system.

#### Quick Launcher Scripts

**On Windows:**

```cmd
:: 1. Clone the repository
git clone https://github.com/githubbest729/PLC-Connect-Hub.git
cd PLC-Connect-Hub

:: 2. Launch with live PLC network connectivity
start.bat

:: OR Launch in Mock Simulation Mode (no physical PLCs required)
start.bat --mock
```

**On Linux / macOS:**

```bash
# 1. Clone the repository
git clone https://github.com/githubbest729/PLC-Connect-Hub.git
cd PLC-Connect-Hub

# 2. Grant execution permissions
chmod +x start.sh

# 3. Launch live or simulated
./start.sh          # Live Mode
./start.sh --mock   # Simulation Mode
```

The launcher will verify dependencies, install missing Node packages, bind port `3000`, and launch your default browser to `http://localhost:3000`.

## 🛠️ Manual Installation & Testing

```bash
# Enter backend directory
cd backend

# Install dependencies
npm install

# Run automated smoke test suite
npm test

# Run in production mode
npm start

# Run with simulated telemetry
npm run mock
```

## 📁 Repository Directory Structure

```text
PLC-Connect-Hub/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages CI/CD workflow (targets ./frontend)
├── backend/
│   ├── plc-drivers.js          # S7, EtherNet/IP, Modbus, FINS, & MELSEC drivers
│   ├── server.js               # Express HTTP & Socket.io WebSocket server
│   ├── test-mock.js            # Automated backend smoke testing suite
│   ├── package.json            # Node.js backend configuration & dependencies
│   └── README.md               # Backend-specific architecture guide
├── frontend/
│   ├── icons/                  # PWA SVGs & Maskable application icons
│   ├── js/
│   │   ├── db.js               # IndexedDB wrapper for snippets and Kanban
│   │   ├── editor.js           # Query formatting & syntax beautifier
│   │   ├── live-client.js      # Socket.io live watchlist client controller
│   │   ├── tag-converter.js    # Multi-brand address conversion logic
│   │   ├── templates.js        # Default QuickScripts and SQL snippets
│   │   ├── tour.js             # 8-step guided interactive product tour
│   │   └── validator.js        # Form and address syntactic validator
│   ├── app.js                  # Master frontend state coordinator
│   ├── index.html              # Single-page interface & dialogs
│   ├── manifest.webmanifest    # PWA install specification
│   ├── service-worker.js       # Offline cache lifecycle & network fallback
│   ├── style.css               # Industrial dark-theme design tokens
│   └── docs/
│       └── ARCHITECTURE.md     # In-depth system specifications
├── start.bat                   # Windows one-click automated bootstrapper
├── start.sh                    # Unix one-click automated bootstrapper
├── LICENSE                     # MIT License
└── README.md                   # Master project documentation
```

## ❓ Troubleshooting & FAQ

### 1. I still see only 2 brands in the Tag Mapper dropdown.

* **Root Cause:** The browser Service Worker has aggressively cached an older version of `index.html`.
* **Fix:** Open Developer Tools (`F12`), navigate to **Application > Storage**, click **Clear Site Data**, and reload with `Ctrl + F5` (`Cmd + Shift + R`).

### 2. GitHub Pages displays a 404 error.

* **Root Cause:** GitHub Pages is trying to serve files from the root repository rather than the `frontend/` folder.
* **Fix:** In your repository, go to **Settings > Pages > Source** and select **GitHub Actions**. Ensure `.github/workflows/deploy.yml` specifies `path: './frontend'`.

### 3. Node.js backend fails building `node-snap7`.

* **Root Cause:** Siemens S7 native driver compilation requires Python and a C++ toolchain (Visual Studio Build Tools or `build-essential`).
* **Fix:** `node-snap7` is completely optional. If compilation fails, the server automatically starts and runs all other drivers (Modbus, Rockwell CIP, Omron, Mitsubishi) normally.

## 📜 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for detailed terms.
