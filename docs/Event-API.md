# 🎫 Event API

## Base URL
```
http://localhost:5000/api
```

## Routes

| Method | Route                | Description         |
|--------|----------------------|----------------------|
| POST   | `/createEvents`      | Create a new event   |
| GET    | `/getEvents`         | Get all events       |
| GET    | `/events/:id`        | Get a single event by id |
| PUT    | `/updateEvents/:id`  | Update an event      |
| DELETE | `/deleteEvents/:id`  | Delete an event      |

---

## Create Event

**POST** `http://localhost:5000/api/createEvents`

### Request Body
```json
{
  "name": "IPL Final 2026",
  "description": "T20 cricket final match",
  "venueId": "660f1a2b3c4d5e6f7a8b9c0d",
  "date": "2026-10-15",
  "startTime": "19:00",
  "endTime": "23:00",
  "capacity": 12000
}
```

### Success Response — `201 Created`
```json
{
  "_id": "670a1b2c3d4e5f6a7b8c9d0e",
  "name": "IPL Final 2026",
  "description": "T20 cricket final match",
  "venueId": "660f1a2b3c4d5e6f7a8b9c0d",
  "date": "2026-10-15",
  "startTime": "19:00",
  "endTime": "23:00",
  "capacity": 12000,
  "createdAt": "2026-09-26T10:00:00.000Z",
  "updatedAt": "2026-09-26T10:00:00.000Z"
}
```

### Error Response — `400 Bad Request`
```json
{
  "message": "Validation error: name is required"
}
```

---

## Get All Events

**GET** `http://localhost:5000/api/getEvents`

### Success Response — `200 OK`
```json
[
  {
    "_id": "670a1b2c3d4e5f6a7b8c9d0e",
    "name": "IPL Final 2026",
    "description": "T20 cricket final match",
    "venueId": "660f1a2b3c4d5e6f7a8b9c0d",
    "date": "2026-10-15",
    "startTime": "19:00",
    "endTime": "23:00",
    "capacity": 12000,
    "createdAt": "2026-09-26T10:00:00.000Z",
    "updatedAt": "2026-09-26T10:00:00.000Z"
  }
]
```

---

## Get Event By Id

**GET** `http://localhost:5000/api/events/:id`

### Path Parameters
| Param | Type   | Description               |
|-------|--------|----------------------------|
| `id`  | string | MongoDB ObjectId of event  |

### Success Response — `200 OK`
```json
{
  "_id": "670a1b2c3d4e5f6a7b8c9d0e",
  "name": "IPL Final 2026",
  "description": "T20 cricket final match",
  "venueId": "660f1a2b3c4d5e6f7a8b9c0d",
  "date": "2026-10-15",
  "startTime": "19:00",
  "endTime": "23:00",
  "capacity": 12000,
  "createdAt": "2026-09-26T10:00:00.000Z",
  "updatedAt": "2026-09-26T10:00:00.000Z"
}
```

### Error Response — `404 Not Found`
```json
{
  "message": "Event not found"
}
```

---

## Update Event

**PUT** `http://localhost:5000/api/updateEvents/:id`

### Path Parameters
| Param | Type   | Description               |
|-------|--------|----------------------------|
| `id`  | string | MongoDB ObjectId of event  |

### Request Body
```json
{
  "name": "IPL Final 2026 (Rescheduled)",
  "date": "2026-10-16",
  "startTime": "19:30"
}
```

### Success Response — `200 OK`
```json
{
  "_id": "670a1b2c3d4e5f6a7b8c9d0e",
  "name": "IPL Final 2026 (Rescheduled)",
  "description": "T20 cricket final match",
  "venueId": "660f1a2b3c4d5e6f7a8b9c0d",
  "date": "2026-10-16",
  "startTime": "19:30",
  "endTime": "23:00",
  "capacity": 12000,
  "updatedAt": "2026-09-26T10:10:00.000Z"
}
```

### Error Response — `404 Not Found`
```json
{
  "message": "Event not found"
}
```

---

## Delete Event

**DELETE** `http://localhost:5000/api/deleteEvents/:id`

### Path Parameters
| Param | Type   | Description               |
|-------|--------|----------------------------|
| `id`  | string | MongoDB ObjectId of event  |

### Success Response — `200 OK`
```json
{
  "message": "Event deleted successfully"
}
```

### Error Response — `404 Not Found`
```json
{
  "message": "Event not found"
}
```

---

## Data Model

| Field         | Type   | Required | Description                          |
|---------------|--------|----------|----------------------------------------|
| `_id`         | string | auto     | MongoDB ObjectId (auto-generated)      |
| `name`        | string | yes      | Event name                             |
| `description` | string | no       | Event description                      |
| `venueId`     | string | yes      | Reference to a Venue `_id`             |
| `date`        | string | yes      | Event date (`YYYY-MM-DD`)              |
| `startTime`   | string | yes      | Start time (`HH:mm`)                   |
| `endTime`     | string | no       | End time (`HH:mm`)                     |
| `capacity`    | number | no       | Expected/allowed attendee count        |
| `createdAt`   | date   | auto     | Timestamp of creation                  |
| `updatedAt`   | date   | auto     | Timestamp of last update                |

> **Note:** Field names above are inferred from typical event data — adjust to match your actual `eventRepository`/`eventService` schema if it differs.

## Architecture
This route file wires a layered architecture per request:
- **Repository** (`eventRepository`) — data access layer
- **Service** (`eventService`) — business logic, depends on the repository
- **Controller** (`eventController`) — HTTP layer, depends on the service

## Notes
- Backend stack: Express + MongoDB (Mongoose, inferred from ObjectId-style ids)
- Related: `Venue-API.md` — events reference a `venueId` from the Venue API
