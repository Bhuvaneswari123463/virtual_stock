# VirtualTrade REST API Specification (Phase 0)

## Global Headers
- `X-Request-Id`: Unique identifier (UUIDv4) issued for every request.
- `Content-Type`: `application/json`

## Global Response Envelopes

### Success Envelope
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "STRING_ERROR_CODE",
    "message": "Human-readable error explanation",
    "details": null
  },
  "meta": {
    "requestId": "a90b4d45-562a-46c5-8462-893c8375c3db",
    "timestamp": "2026-10-11T13:35:00.000Z"
  }
}
```

## Endpoints

### 1. System Health
* **Method:** `GET`
* **Path:** `/api/v1/health`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-10-11T13:35:00.000Z",
    "uptimeSeconds": 142,
    "environment": "development",
    "system": {
      "nodeVersion": "v22.17.1",
      "platform": "win32",
      "memoryUsageMB": 38,
      "freeMemoryMB": 8192
    }
  }
}
```

### 2. Database Readiness
* **Method:** `GET`
* **Path:** `/api/v1/health/ready`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "simulated_phase0",
    "database": "mongodb",
    "connected": false,
    "message": "Database persistence layer configured for Phase 1 Mongoose connection.",
    "timestamp": "2026-10-11T13:35:00.000Z"
  }
}
```
