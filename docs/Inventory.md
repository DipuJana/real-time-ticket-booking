
# Seat & Inventory API

## 1. Seat & ShowInventory Generation

### Seat Generation

Seats are generated automatically when a hall is created.

The Hall Service calls:

```js
inventoryService.generateSeatsForHall(
  hallId,
  totalRows,
  seatsPerRow,
  premiumRows
);
````

The number of seats generated is:

```text
totalRows × seatsPerRow
```

For example:

```text
Hall
3 rows × 4 seats
Premium rows: ["A"]

A1  A2  A3  A4  → PREMIUM
B1  B2  B3  B4  → REGULAR
C1  C2  C3  C4  → REGULAR
```

Each seat is stored with:

```json
{
  "hallId": "ObjectId",
  "rowLabel": "A",
  "seatNumber": 1,
  "seatType": "PREMIUM"
}
```

Possible `seatType` values:

```text
REGULAR
PREMIUM
```

Seats are uniquely identified within a hall by:

```text
hallId + rowLabel + seatNumber
```

---

### ShowInventory Generation

When a show is created, ShowInventory records are generated for every seat belonging to the show's hall.

The Show Service calls:

```js
inventoryService.generateShowInventory(
  showId,
  hallId
);
```

The strategy is:

```text
Show
  +
Hall
  ↓
Find all seats belonging to Hall
  ↓
Create one ShowInventory record per Seat
```

For every seat:

```text
Seat + Show → ShowInventory
```

Example:

```text
Hall seats:

A1  A2  A3  A4
B1  B2  B3  B4

ShowInventory:

Show1 + A1 → AVAILABLE
Show1 + A2 → AVAILABLE
Show1 + A3 → AVAILABLE
Show1 + A4 → AVAILABLE
Show1 + B1 → AVAILABLE
Show1 + B2 → AVAILABLE
Show1 + B3 → AVAILABLE
Show1 + B4 → AVAILABLE
```

Initial ShowInventory structure:

```json
{
  "showId": "SHOW_ID",
  "seatId": "SEAT_ID",
  "status": "AVAILABLE",
  "holdUntil": null,
  "version": 0
}
```

Possible `status` values:

```text
AVAILABLE
HELD
BOOKED
```

ShowInventory records are uniquely identified by:

```text
showId + seatId
```

This ensures that a particular seat has only one inventory record for a particular show.

---

# 2. API Overview

| Method | Endpoint                   | Purpose                          |
| ------ | -------------------------- | -------------------------------- |
| `GET`  | `/api/shows/:showId/seats` | Get seat availability for a show |
| `POST` | `/api/inventory/hold`      | Temporarily hold selected seats  |
| `POST` | `/api/inventory/release`   | Release held seats               |

---

# 3. Get Show Seats

## `GET /api/shows/:showId/seats`

Returns all seat inventory records for a particular show.

### Authentication

```text
No authentication required
```

### Request

```http
GET /api/shows/:showId/seats
```

Example:

```http
GET /api/shows/SHOW_ID/seats
```

No request body is required.

### Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "INVENTORY_ID",
      "showId": "SHOW_ID",
      "seatId": {
        "_id": "SEAT_ID",
        "rowLabel": "A",
        "seatNumber": 1,
        "seatType": "PREMIUM"
      },
      "status": "AVAILABLE",
      "holdUntil": null,
      "version": 0
    },
    {
      "_id": "INVENTORY_ID_2",
      "showId": "SHOW_ID",
      "seatId": {
        "_id": "SEAT_ID_2",
        "rowLabel": "A",
        "seatNumber": 2,
        "seatType": "PREMIUM"
      },
      "status": "HELD",
      "holdUntil": "2026-09-29T15:00:00.000Z",
      "version": 1
    }
  ]
}
```

Before returning the inventory, expired holds for the show are released.

The returned seats are sorted by:

```text
rowLabel
↓
seatNumber
```

---

# 4. Hold Seats

## `POST /api/inventory/hold`

Temporarily holds one or more available seats.

### Request

```json
{
  "showId": "SHOW_ID",
  "seatIds": [
    "SEAT_ID_1",
    "SEAT_ID_2"
  ]
}
```

### Request Fields

| Field     | Type       | Required | Description              |
| --------- | ---------- | -------- | ------------------------ |
| `showId`  | ObjectId   | Yes      | ID of the show           |
| `seatIds` | ObjectId[] | Yes      | IDs of the seats to hold |

`seatIds` must:

* Be an array
* Contain at least one seat
* Contain valid ObjectIds
* Not contain duplicate IDs

### Successful Response

```json
{
  "success": true,
  "message": "Seats held successfully",
  "data": {
    "success": true,
    "seatIds": [
      "SEAT_ID_1",
      "SEAT_ID_2"
    ],
    "holdUntil": "2026-09-29T15:00:00.000Z"
  }
}
```

### State Transition

```text
AVAILABLE → HELD
```

The current hold duration is:

```text
5 minutes
```

The `holdUntil` field stores the expiration time.

The `version` field is incremented when the state changes.

Example:

```text
Before:

A1
status: AVAILABLE
version: 0
holdUntil: null


After hold:

A1
status: HELD
version: 1
holdUntil: <5 minutes from current time>
```

---

# 5. Release Seats

## `POST /api/inventory/release`

Releases seats that are currently held.

### Request

```json
{
  "showId": "SHOW_ID",
  "seatIds": [
    "SEAT_ID_1",
    "SEAT_ID_2"
  ]
}
```

### Request Fields

| Field     | Type       | Required | Description                 |
| --------- | ---------- | -------- | --------------------------- |
| `showId`  | ObjectId   | Yes      | ID of the show              |
| `seatIds` | ObjectId[] | Yes      | IDs of the seats to release |

### Successful Response

```json
{
  "success": true,
  "message": "Seats released successfully",
  "data": {
    "success": true,
    "seatIds": [
      "SEAT_ID_1",
      "SEAT_ID_2"
    ]
  }
}
```

### State Transition

```text
HELD → AVAILABLE
```

When a seat is released:

```text
status → AVAILABLE
holdUntil → null
version → version + 1
```

Example:

```text
Before:

A1
status: HELD
version: 1
holdUntil: <expiration time>


After release:

A1
status: AVAILABLE
version: 2
holdUntil: null
```

---

# 6. Inventory State Flow

The normal inventory lifecycle is:

```text
AVAILABLE
     │
     │ hold
     ▼
   HELD
     │
     │ booking completed
     ▼
  BOOKED
```

If a hold expires:

```text
HELD
  │
  │ hold expires
  ▼
AVAILABLE
```

If a user releases a hold:

```text
HELD
  │
  │ release
  ▼
AVAILABLE
```

---

# 7. Expired Hold Strategy

A held seat should not remain unavailable after its hold expires.

Each held inventory record contains:

```json
{
  "status": "HELD",
  "holdUntil": "2026-09-29T15:00:00.000Z"
}
```

Expired holds are identified using:

```text
status = HELD
AND
holdUntil <= current time
```

They are changed to:

```text
status = AVAILABLE
holdUntil = null
version = version + 1
```

The availability operation performs this cleanup before returning the show's seats:

```js
await showInventoryRepository.releaseExpiredHolds(showId);
```

Therefore:

```text
GET /api/shows/:showId/seats
```

can make expired seats available again before returning the current inventory state.

---

# 8. Concurrency Strategy

Seat holding uses a conditional database update.

The update only targets inventory records where:

```text
showId = requested show
seatId = requested seat
status = AVAILABLE
```

Conceptually:

```js
{
  showId,
  seatId: { $in: seatIds },
  status: "AVAILABLE"
}
```

The state is changed atomically to:

```text
HELD
```

The service then checks:

```text
modifiedCount === requested seat count
```

### Successful case

If all requested seats are updated:

```text
Hold succeeds
```

Example:

```text
Request:
A1, A2

A1 → AVAILABLE
A2 → AVAILABLE

Result:
A1 → HELD
A2 → HELD

modifiedCount = 2
requested seats = 2

SUCCESS
```

### Conflict case

If one or more requested seats are already unavailable:

```text
Hold fails
```

Example:

```text
User A:
A1 → HELD

User B:
tries to hold A1

A1 is no longer AVAILABLE

User B → conflict
```

The service returns:

```json
{
  "success": false,
  "message": "One or more seats are not available"
}
```

with HTTP status:

```text
409 Conflict
```

The hold operation runs inside a MongoDB transaction.

---

# 9. Object Relationships

The relevant relationship is:

```text
VENUE
  │
  └── HALL
        │
        └── SEAT
              │
              └── SHOW_INVENTORY
                         │
                         └── SHOW
```

More directly:

```text
Hall
 │
 ├── Seat A1
 ├── Seat A2
 ├── Seat A3
 └── Seat A4
```

For a particular show:

```text
Show 1
 │
 ├── ShowInventory → Seat A1
 ├── ShowInventory → Seat A2
 ├── ShowInventory → Seat A3
 └── ShowInventory → Seat A4
```

The important distinction is:

```text
Seat ≠ Seat Availability
```

`Seat` represents the physical seat in a hall.

`ShowInventory` represents the state of that seat for a particular show.

Therefore the same physical seat can have different states for different shows:

```text
Seat A1

Show 1 → AVAILABLE
Show 2 → BOOKED
Show 3 → HELD
```

---

# 10. API Error Structure

Inventory errors are returned as JSON.

Example:

```json
{
  "success": false,
  "message": "One or more seats are not available"
}
```

Common validation errors include:

```text
showId is required
Invalid show ID
seatIds must be a non-empty array
One or more seat IDs are invalid
Duplicate seat IDs are not allowed
```

A seat availability conflict uses:

```text
HTTP 409 Conflict
```

Example:

```http
409 Conflict
```

```json
{
  "success": false,
  "message": "One or more seats are not available"
}
```

```
```
