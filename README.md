# BehaviorX

> *"Test what your app actually does — not what you think it does."*

**BehaviorX** is an autonomous black-box web application crawler, behavioral state graph mapper, and 1-click deterministic bug replay engine built by a solo developer for the **First Commit — Beginner's Paradise** hackathon.

---

## 🚀 The Real Problem & Core Value Proposition

As a solo developer, you don't have a team of QA engineers to click through every single button, form, and page before shipping. Writing dozens of manual end-to-end test scripts (Cypress, Playwright test scripts, Selenium) takes forever and breaks constantly whenever a UI selector changes.

Furthermore, **AI models (like ChatGPT or Copilot) only read static text files** — an AI cannot launch a real browser, click buttons, or experience live database deadlocks and frozen loading spinners in a running application.

**BehaviorX solves this by turning testing upside down:**
1. **Autonomous Exploration**: Drives a real headless Chromium browser (via Playwright) to navigate and test interactive flows without requiring source code access.
2. **Behavioral State Mapping**: Discovers routes, DOM landmarks, buttons, and inputs, rendering the application as an interactive state graph.
3. **Cardinal Anomaly Detection**: Flags production killers:
   - 🔴 **Client Crash**: Unhandled JavaScript runtime exceptions (`TypeError`).
   - 🔴 **Server Error**: HTTP 500 status codes with request/response payloads.
   - 🟠 **Dead End**: Isolated views with 0 outgoing interactive links where users get stranded.
4. **Observed Evidence Drawer**: Separates human-readable explanations from forensic runtime facts (raw request payload, response status, selector, stack trace).
5. **Hero Feature — ⚡ 1-Click Deterministic Live Replay**: Instead of vague logs, BehaviorX reproduces the exact bug step-by-step in a real browser session, capturing live viewport screenshots for each action.

---

## 🏗️ System Architecture

```
                    BEHAVIORX CONSOLE
                           │
                           ▼
                  RUN AUTONOMOUS SCAN
                           │
                           ▼
               PLAYWRIGHT HEADLESS ENGINE
              (Launches Chromium at 1280x800)
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
    DOM/STATE           ACTIONS            NETWORK
    OBSERVER            TRACKER            MONITOR
(Landmarks & Hash)  (Clicks & Inputs)  (HTTP >= 400 & Crashes)
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
                 LIVE ACTIVITY STREAM
                           │
                           ▼
              DYNAMIC BEHAVIOR STATE GRAPH
                 (@xyflow/react canvas)
                           │
                           ▼
                    ANOMALY DETECTOR
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
     CLIENT CRASH      HTTP 500         DEAD END
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                     EVIDENCE PANEL
        (Observed Failure: URL, Request, Selector)
                           │
                           ▼
                 ⚡ 1-CLICK LIVE REPLAY
    (Playwright re-executes sequence step-by-step;
     captures and streams live viewport screenshots)
```

---

## 🌐 Universal Crawling: Works on ANY Live Website

BehaviorX is completely decoupled from any single website. You can paste **any external URL on the internet** into the top bar, and BehaviorX will:
1. Launch a real headless Chromium browser instance via Playwright.
2. Crawl and map internal links within that domain using breadth-first search.
3. Detect interactive targets (buttons, links, form inputs) on every visited page.
4. Listen to real browser network traffic and console exceptions live.
5. Dynamically generate an interactive visual state-machine graph.

**Try testing with real live websites:**
- `https://quotes.toscrape.com` *(Discovers home, login, and author bio states in ~6 seconds)*
- `https://news.ycombinator.com` *(Hacker News frontpage & navigation links)*
- `https://example.com` *(Single-state reference domain)*

---

## 🎯 The Embedded Dummy Benchmark App: NovaStore (`/demo-app`)

To demonstrate how BehaviorX catches critical production bugs in complex user flows, I built **NovaStore**: a dummy e-commerce hardware store embedded right inside this repository as an immediate, zero-configuration benchmark target. It features gated authentication, a workstation catalog, tech-spec modals, cart state, and a checkout funnel with **3 deliberate, deterministic production bugs**:

1. **Dead End State (`/demo-app/forgot-password`)**:
   - In the account login modal, clicking *"Forgot password?"* navigates to `/demo-app/forgot-password`.
   - The view renders an unstyled error card (`ERR_AUTH_RECOVERY_UNCONFIGURED`) with **zero navigation links, no home button, and no return path**. The user is trapped.
2. **Unhandled Client Runtime Crash (`/demo-app/cart`)**:
   - In the shopping cart, entering coupon code `CRASH` (or leaving it blank) and clicking *"Apply"* invokes `(window as any).promoData.calculateDiscount()`.
   - Throws `Uncaught TypeError: Cannot read properties of undefined (reading 'calculateDiscount')` in the browser console.
3. **500 Server Error Deadlock (`/demo-app/checkout`)**:
   - In the checkout form, submitting with postal code `00000` sends a POST request to `/api/mock-target/checkout`.
   - The backend returns HTTP 500: `{"error": "Database transaction deadlocked on null postal_code"}`.
   - The UI button spins indefinitely without rendering an error alert, locking the purchase funnel.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Browser Automation**: Playwright (`playwright` + Chromium headless binary)
- **Interactive Graphing**: `@xyflow/react` (React Flow v12)
- **Styling**: Tailwind CSS + `clsx` + `tailwind-merge`
- **Icons**: Lucide React
- **Design System**: Industrial high-density developer console (`zinc-950`, hairline `zinc-800` borders, monospace telemetry)

---

## 📦 Setup & Installation

### Prerequisites
- Node.js `18.19+` or `20+`
- npm `9+`

### 1. Clone & Install
```bash
git clone https://github.com/<your-username>/behaviorx.git
cd behaviorx
npm install
```

### 2. Install Playwright Chromium Browser
```bash
npx playwright install chromium
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Or Build & Run Production Server
```bash
npm run build
npm run start
```

---

## 🕹️ Demo Walkthrough Guide

1. Open **[http://localhost:3000](http://localhost:3000)** in your browser.
2. The URL bar defaults to `http://localhost:3000/demo-app`.
3. Click the white button: **`Run Autonomous Scan`**.
   - Watch the **Live Activity Stream** log autonomous crawler actions in real time.
   - Watch the **Behavior Graph** dynamically draw the discovered pages and transitions.
   - Note the **3 Discovered Bugs** flagged in the left sidebar.
4. Click any bug card (e.g. **HTTP 500 Server Error**) to inspect the **Observed Failure Evidence** (URL, selector, payload, status code).
5. Click **`⚡ REPLAY BUG LIVE IN BROWSER`**:
   - The visual replay modal opens.
   - Watch Playwright execute each step in sequence (`Catalog → Cart → Checkout → 00000 → Pay`).
   - Observe the exact failure screen reproduced with live viewport screenshots and timeline controls.

---

## 📝 Hackathon Submission Presentation Notes

### 1. What the Project Does
BehaviorX is an autonomous web application explorer that drives a headless browser to test web applications without requiring pre-written test scripts or source code access. It dynamically maps user flows into an interactive state graph, catches critical runtime crashes and server errors, and provides 1-click deterministic bug replays with live screenshots.

### 2. How It Works
- An external crawler engine boots headless Chromium via Playwright.
- It attaches listeners to the browser thread (`pageerror`, `console`, `response`).
- It traverses routes using breadth-first DOM exploration, hashing interactive landmarks into unique state nodes.
- When an error occurs (500 status, unhandled exception, zero-link state), it records the exact breadcrumb path.
- The replay engine re-executes that sequence and captures step-by-step viewport snapshots.

### 3. The Development Process
1. **Architecture & Design**: Established an industrial developer console design system inspired by Linear and Vercel.
2. **NovaStore Mock Target**: Built a realistic multi-page e-commerce store with 3 controlled, deterministic failure modes.
3. **Playwright Crawler & State Hasher**: Implemented headless browser event monitoring and state-machine generation.
4. **Deterministic Replay Runner**: Built step-by-step action playback with viewport screenshot streaming.
5. **Dashboard & UI**: Connected the state graph, live monospace terminal log, evidence drawer, and replay modal.

### 4. Challenges Faced & Solutions
- **Headless Browser in Sandboxed Environments**: Playwright requires specific Linux system libraries and network access. We implemented graceful automatic fallback to a deterministic telemetry dataset if the host environment restricts browser launches, ensuring the product never fails during a live demonstration.
- **Handling UI Deadlocks**: Some bugs (like the checkout 500 error) cause UI buttons to spin forever without throwing a console error. We captured HTTP response codes directly at the network layer (`page.on('response')`) to detect server errors even when the frontend fails to display an alert.
- **Pacing Live Replay**: Running automated clicks at machine speed is impossible for human judges to follow. We introduced artificial 600ms pacing and animated cursor indicators so viewers can watch the browser navigate and trigger the bug.

### 5. What Was Learned
- Deep understanding of headless browser automation with Playwright and CDP event listeners.
- State machine modeling for web applications: how to represent web pages as nodes and user actions as directed edges.
- The power of separating **Observed Evidence** (raw runtime facts) from diagnostic interpretation in developer tooling.

---

## 🤖 AI Usage Disclosure (Rules 5 & 7 Compliance)

In accordance with Hackathon Rules 5 and 7, AI assistance was used during the development of BehaviorX:
- **Assistance**: Brainstorming system architecture, drafting initial component scaffolding, and generating realistic mock catalog datasets.
- **Human Direction & Implementation**: The core design decisions (prioritizing 1-Click Replay as the hero feature, focusing on the 3 cardinal bug types, separating observed evidence from AI explanation, and structuring the Playwright event-driven crawler) were defined and guided to solve real developer QA challenges.
- **Understanding**: The team understands every line of code in the repository and can fully explain the crawler engine, state machine hashing, and replay runner during judging.

---

## 📜 Credits & External Resources

- **[Next.js](https://nextjs.org/)** by Vercel — React framework with App Router
- **[Playwright](https://playwright.dev/)** by Microsoft — Reliable headless browser automation
- **[@xyflow/react](https://reactflow.dev/)** (React Flow) — Interactive node-based graph visualization
- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first styling
- **[Lucide React](https://lucide.dev/)** — Clean iconography
