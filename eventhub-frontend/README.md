# EventHub Frontend - High-Performance Ticketing Platform & Cockpit

A modern, dark-mode single-page application (SPA) built in **React (Vite + Tailwind CSS + Lucide Icons)** for **EventHub**, designed to serve as both a customer-facing event ticketing experience and an operating/testing cockpit for Spring Boot microservices.

---

## 1. Quick Start & Execution

```bash
# 1. Navigate to the project directory
cd eventhub-frontend

# 2. Install dependencies
npm install

# 3. Launch the Vite development server (port 3000)
npm run dev

# 4. Production build
npm run build
```

---

## 2. Microservices Architecture & Network Topology

| Component | Target URL | Responsibility |
|---|---|---|
| **API Gateway** | `http://localhost:8080` | All client HTTP traffic ingress, JWT validation, header injection (`X-User-Id`, `X-User-Role`) |
| **Eureka Registry** | `http://localhost:8761` | Service discovery |
| **Spring Cloud Config** | `http://localhost:8888` | Centralized external configuration |
| **Auth Service** | `/api/v1/auth` | 2-step registration, OTP generation & verification (`auth_db`) |
| **User Service** | `/api/v1/users` | Customer profiles & billing addresses (`user_db`) |
| **Event & Venue Service** | `/api/v1/events` | Venues, sections, schedules, seat availability grids (`event_db`) |
| **Booking Service** | `/api/v1/bookings` | Redis 5-minute atomic distributed seat locking & state machine (`booking_db`) |
| **Payment Simulator** | `/api/v1/payments` | Kafka Saga payment orchestration with dual success/failure triggers (`payment_db`) |
| **Ticket Service** | `/api/v1/tickets` | Base64 QR code passes, turnstile entry scanner validation (`ticket_db`) |

---

## 3. Key Features & Visual Design Highlights

1. **Interactive Stadium Seating Experience**:
   - **Curved Stage / Pitch**: Illuminated stage indicator with acoustic perspective lines and direct field viewing angles.
   - **Differentiated Visual Seat Forms**:
     - **Available Seats**: Ergonomic stadium armchair buttons with section accents (VIP Pavilion, Premium Grandstand, General Bleachers), price tags, and hover tooltips.
     - **Reserved / Locked Seats**: Distinct recessed metallic nodes with diagonal safety hazard stripes (`reserved-hatch-pattern`) and security padlock icons.
     - **Selected Seats**: Vivid electric indigo glow with 3D elevation and checkmark badge.
   - **Sticky Reservation Drawer**: Real-time price subtotal, selected seat tags, and instant checkout lock CTA.

2. **5-Minute Reservation Expiry Timer**:
   - Real-time countdown bound to Redis lock TTL (`expiresAt`).
   - Dynamic alert states: Amber under 2 minutes, flashing rose under 30 seconds.

3. **Dual Payment Simulation Controls**:
   - **Simulate Successful Payment**: Emits `payment-completed`, turns booking `CONFIRMED`, triggers QR pass minting, and dispatches email alert with celebratory confetti.
   - **Simulate Payment Failure**: Emits `payment-failed`, initiates Kafka Saga rollback, marks booking `CANCELLED`, and releases Redis locks.

4. **Digital Pass & Turnstile Scanner**:
   - Renders Base64 QR code passes with ticket codes and venue addresses.
   - Built-in venue turnstile validator to toggle status from `VALID` to `USED` (`POST /api/v1/tickets/validate`).

5. **Cockpit Simulation Mode Toggle**:
   - Switch anytime via the top navigation bar between direct `http://localhost:8080` microservice calls and local simulation demo mode for offline testing.
