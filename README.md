<div align="center">
  <h1>Shrimati Setu Guardian Dashboard</h1>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Flutter-3.10+-blue?logo=flutter" alt="Flutter" />
  <img src="https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Storage-orange" alt="Firebase" />
  <img src="https://img.shields.io/badge/Status-Guardian%20Console-success" alt="Status" />
  <img src="https://img.shields.io/badge/Mode-Real-time%20Safety-purple" alt="Mode" />
</p>

<p align="center">
  <img src="web/mockup.png" alt="Shrimati Setu dashboard mockup" width="100%" />
</p>

<div align="center">
  <h3>Built for guardians who cannot afford delays.</h3>
</div>

<p align="center">
  <b>Shrimati Setu Guardian Dashboard</b> is a real-time protection platform for guardians, designed to keep them aware, informed, and ready to respond when safety conditions change.
</p>

---

## Why this matters

Guardians need clarity, speed, and confidence when an emergency happens.

This dashboard gives them:

- instant awareness of SOS events
- live monitoring of location and status
- geofence-based safe zone protection
- boundary alerts for zone entry and exit
- evidence records to act with confidence

---

## Core features

- Guardian login and secure access
- live user profile and safety overview
- SOS event tracking and emergency response visibility
- safe zone creation, editing, and activation
- real-time boundary entry/exit alert monitoring
- recording and evidence-linked safety data

---

## Tech stack

- Flutter
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Google Maps Flutter
- Dart + Material UI

---

## System architecture

<p align="center">
  <img src="web/2f380280-e706-4aab-8d16-0004f529c493.png" alt="Shrimati Setu system architecture" width="100%" />
</p>

This architecture brings together the guardian-facing Flutter dashboard, Firebase services, real-time safety data, geofencing, and evidence storage into a single operational system. The flow is built around security, speed, and reliable monitoring for rapid guardian response.

---

## Gap analysis

| Category | Existing market solutions | Shrimati Setu Guardian Dashboard |
| --- | --- | --- |
| Real-time safety response | Often fragmented and delayed | Built for instant guardian visibility and reaction |
| SOS handling | Basic alerts with poor context | Clear emergency event monitoring with structured data |
| Safe zone control | Generic geofence tools | Guardian-specific safe zone management and boundary logic |
| Evidence access | Limited records or weak traceability | Recording and activity-linked evidence support |
| User experience | Traditional dashboards, slow and cluttered | Premium dark-tech command center interface |
| Trust & operational clarity | Hard to act on without context | Centralized monitoring for fast, informed decisions |

---

## App flow

```mermaid
flowchart TD
    A[Guardian Login] --> B[Dashboard Overview]
    B --> C[SOS Monitoring]
    B --> D[Safe Zone Management]
    B --> E[Boundary Alerts]
    D --> F[Map-based Zone Setup]
    C --> G[Emergency Response Actions]
    E --> H[Entry / Exit Event Review]
```

---

## Quick start

### 1. Install dependencies

```bash
flutter pub get
```

### 2. Set up Firebase

- create a Firebase project
- enable Authentication
- enable Firestore
- enable Storage
- configure `firebase_options.dart`

### 3. Run the project

```bash
flutter run
```

For web:

```bash
flutter run -d chrome
```

### 4. Build for production

```bash
flutter build web
```

---

## Status

This project is positioned as a guard-focused safety monitoring dashboard for the Shrimati Setu ecosystem, with emphasis on speed, trust, and operational clarity.

---

## Final intent

The goal is simple: turn safety data into a fast, reliable command center that helps guardians act before situations become critical.

