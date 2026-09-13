# Development Guide

## Backend Structure

The backend follows a modular architecture.

### `server/src`

| Directory | Purpose |
|---|---|
| `config/` | Database, Redis and environment configuration |
| `middleware/` | Authentication, validation, error handling, and other request middleware |
| `modules/` | Domain-specific business logic organized by feature |
| `shared/` | Reusable code shared across multiple modules |
| `socket/` | Socket.IO configuration and real-time event handling |
| `jobs/` | Background and scheduled tasks |
| `routes/` | Central API route registration |

## Backend Modules

| Module | Responsibility |
|---|---|
| `auth/` | Authentication and authorization |
| `event/` | Events, venues, halls and shows |
| `inventory/` | Seats and show inventory |
| `booking/` | Booking lifecycle |
| `payment/` | Mock payment processing |

### Module Implementation

The module structure and implementation should follow the finalized domain/ER design and assigned team ownership.

Actual module implementation will be added when development of each module begins.

## Git Workflow

Feature and chore branches should be created from `develop`.

```text
feature/chore branch
        ↓
       PR
        ↓
     develop
        ↓
       PR
        ↓
      main


      # Authentication API

Base URL: `http://localhost:5000`

---

## Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login user |
| POST | `/api/auth/refresh` | ❌ | Refresh access token |
| POST | `/api/auth/logout` | ✅ | Logout user |
| GET | `/api/auth/profile` | ✅ | Get user profile |
| PUT | `/api/auth/profile` | ✅ | Update user profile |
| POST | `/api/auth/change-password` | ✅ | Change password |

---

## 1. Register

**Endpoint:** `POST /api/auth/register`

**Auth:** Not required

### Request Body

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "phone": "+1234567890"
}