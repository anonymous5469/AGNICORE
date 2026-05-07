# AGNICORE: Zero-Trust Access Orchestration

AGNICORE is a high-fidelity Zero-Trust security platform designed to evaluate, orchestrate, and monitor access requests in real-time. It moves beyond static permissions by implementing a continuous, risk-aware evaluation engine that considers identity, context, and behavior.

---

## 🎯 Main Goals

1. **Zero-Trust Enforcement**: Assume no request is safe by default. Every access attempt must be verified, authenticated, and risk-assessed.
2. **Contextual Awareness**: Go beyond usernames and passwords. AGNICORE analyzes *where* the request comes from, *what* is being accessed, and *when* it is happening.
3. **Explainable Security**: Provide analysts with clear, human-readable reasons behind every "ALLOW", "VERIFY", or "DENY" decision.
4. **Modern Analyst Experience**: A high-end "Neon-Glass" interface designed to reduce cognitive load and highlight critical threats immediately.

---

## 🏗️ System Architecture

AGNICORE is built with a decoupled, high-performance stack:

- **Backend (Core Engine)**: Built with **Rust** and the **Axum** web framework for safety and speed.
- **Persistence**: **SQLite** via **SQLx** for lightweight, reliable structured logging.
- **Frontend (Command Center)**: **React** with **Vite**, styled using **Tailwind CSS** for a premium glassmorphic UI.
- **Security**: **JWT (JSON Web Tokens)** for stateless, secure session management.

---

## 🚀 Core Features & How They Work

### 1. Identity Gateway (Authentication)
The entry point to the command center.
- **How it works**: Uses a dev-enabled Token Issuer. When an operator signs in, the backend verifies the `admin_secret` and issues a signed HS256 JWT containing the user's UUID and roles. This token is required for all subsequent API interactions.

### 2. Trust Evaluation Engine (Risk Scoring)
The heart of AGNICORE. It calculates a dynamic **Risk Score (0-100)** for every request.
- **Heuristic Logic**:
    - **Resource Sensitivity**: Requests for resources containing "admin" automatically add **+40** risk points.
    - **Action Intensity**: "Write" or "Approve" actions add **+20** risk points.
    - **Temporal Analysis**: Requests made during high-risk hours (10:00 PM – 6:00 AM) add **+20** risk points to detect suspicious off-hour activity.
- **Decision Matrix**:
    - **ALLOW (0-29 risk)**: Standard access granted.
    - **VERIFY (30-59 risk)**: Requires a "Step-up" challenge (MFA/Biometric).
    - **DENY (60-100 risk)**: Critical threat detected; access blocked immediately.

### 3. Simulation Lab
A sandbox for security analysts to test policy drift.
- **How it works**: Analysts can manually compose requests (varying device posture, location, and resource type) and watch the Trust Engine respond in real-time without affecting live production traffic.

### 4. Live Posture Dashboard
A real-time overview of the environment's health.
- **How it works**: Aggregates data from the SQLite audit trail to calculate:
    - **Average Environment Risk**: The mean risk of the last 100 requests.
    - **Threat Index**: A percentage comparison of blocked vs. total requests.
    - **Traffic Volume**: Real-time request counter.

### 5. Decision Ledger (Audit Trail)
A forensic-ready stream of every decision made by the engine.
- **How it works**: Every evaluation is persisted in the `logs` table. Analysts can search by user or resource and "Inspect" a specific request to see the underlying risk factors (e.g., "Mutation-capable action detected").

---

## 🛡️ Security Flow (Life of a Request)

1. **Intake**: A request arrives at `/api/access/access` with a JWT and resource metadata.
2. **Authentication**: `AuthService` validates the JWT signature and extracts the Identity.
3. **Enrichment**: `ContextService` maps the request against known device postures and locations.
4. **Scoring**: `RiskService` applies the temporal and sensitivity heuristics to generate a Score.
5. **Verdict**: `PolicyService` applies the Decision Matrix to determine the outcome.
6. **Persistence**: The request, score, and verdict are saved to the SQLite ledger.
7. **Telemetry**: The Command Center UI updates via polling to show the latest activity.

---

## 🛠️ Development & Deployment

### Running the Backend
```bash
cd server/agnicore
cargo run --bin agnicore
```
*Listens on port 8080*

### Running the Frontend
```bash
cd client
npm run dev
```
*Available at http://localhost:5173*
