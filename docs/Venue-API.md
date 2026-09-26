# 🎭 Venue API

## Base URL
```
http://localhost:5000/api
```

## Routes

| Method | Route                  | Description       |
|--------|------------------------|--------------------|
| POST   | `/createVenues`        | Create a new venue |
| GET    | `/getVenues`           | Get all venues     |
| PUT    | `/updateVenues/:id`    | Update a venue     |
| DELETE | `/deleteVenues/:id`    | Delete a venue     |

---

## Create Venue

**POST** `http://localhost:5000/api/createVenues`

### Request Body
```json
{
  "name": "Netaji Indoor Stadium",
  "city": "Kolkata",
  "address": "Eden Gardens Road, Kolkata",
  "capacity": 12000
}
```

### Success Response — `201 Created`
```json
{
  "_id": "660f1a2b3c4d5e6f7a8b9c0d",
  "name": "Netaji Indoor Stadium",
  "city": "Kolkata",
  "address": "Eden Gardens Road, Kolkata",
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

## Get All Venues

**GET** `http://localhost:5000/api/getVenues`

### Success Response — `200 OK`
```json
[
  {
    "_id": "660f1a2b3c4d5e6f7a8b9c0d",
    "name": "Netaji Indoor Stadium",
    "city": "Kolkata",
    "address": "Eden Gardens Road, Kolkata",
    "capacity": 12000,
    "createdAt": "2026-09-26T10:00:00.000Z",
    "updatedAt": "2026-09-26T10:00:00.000Z"
  }
]
```

---

## Update Venue

**PUT** `http://localhost:5000/api/updateVenues/:id`

### Path Parameters
| Param | Type   | Description                |
|-------|--------|----------------------------|
| `id`  | string | MongoDB ObjectId of venue  |

### Request Body
```json
{
  "name": "Netaji Indoor Stadium (Renovated)",
  "city": "Kolkata",
  "address": "Eden Gardens Road, Kolkata",
  "capacity": 13500
}
```

### Success Response — `200 OK`
```json
{
  "_id": "660f1a2b3c4d5e6f7a8b9c0d",
  "name": "Netaji Indoor Stadium (Renovated)",
  "city": "Kolkata",
  "address": "Eden Gardens Road, Kolkata",
  "capacity": 13500,
  "updatedAt": "2026-09-26T10:05:00.000Z"
}
```

### Error Response — `404 Not Found`
```json
{
  "message": "Venue not found"
}
```

---

## Delete Venue

**DELETE** `http://localhost:5000/api/deleteVenues/:id`

### Path Parameters
| Param | Type   | Description                |
|-------|--------|----------------------------|
| `id`  | string | MongoDB ObjectId of venue  |

### Success Response — `200 OK`
```json
{
  "message": "Venue deleted successfully"
}
```

### Error Response — `404 Not Found`
```json
{
  "message": "Venue not found"
}
```

---

## Data Model

| Field       | Type   | Required | Description                     |
|-------------|--------|----------|----------------------------------|
| `_id`       | string | auto     | MongoDB ObjectId (auto-generated) |
| `name`      | string | yes      | Venue name                      |
| `city`      | string | yes      | City where venue is located     |
| `address`   | string | yes      | Full address                    |
| `capacity`  | number | yes      | Seating/audience capacity       |
| `createdAt` | date   | auto     | Timestamp of creation            |
| `updatedAt` | date   | auto     | Timestamp of last update         |

## Notes
- Backend stack: Express + MongoDB (Mongoose)
- A matching Postman collection (`Venue-API.postman_collection.json`) is available for testing all routes end-to-end
