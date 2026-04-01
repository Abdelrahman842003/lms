---
title: Secretary API
description: Complete reference for secretary-facing API endpoints
---

# Secretary API

**Base Path:** `/api/v1/secretary`

All secretary endpoints require `auth:sanctum` middleware. Secretary routes currently do not have `EnsureSecretaryIsActive` middleware, though the model has an `is_active` field.

## Authentication

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/login/secretary` | Login (phone + password) | No |
| POST | `/secretary/logout` | Logout | Yes |
| GET | `/secretary/me` | Get current profile | Yes |
| POST | `/secretary/change-password` | Change password | Yes |

### Login Secretary

```http
POST /api/v1/login/secretary
Content-Type: application/json

{
  "phone": "201234567890",
  "password": "secret123"
}
```

**Rate Limit:** `throttle:auth`

---

## Notifications

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| GET | `/secretary/notifications` | List notifications | - |
| POST | `/secretary/notifications` | Create notification | `notifications` |
| POST | `/secretary/notifications/{id}/read` | Mark as read | `notifications` |

### Create Notification

```http
POST /secretary/notifications
Content-Type: application/json

{
  "title": "Notification title",
  "body": "Notification body text",
  "type": "general"
}
```

---

## Notes

> **Note:** Secretary routes do not currently have an `EnsureSecretaryIsActive` middleware. The `Secretary` model has an `is_active` boolean field that should be checked. A future TODO is to add this middleware to prevent inactive secretaries from accessing the API.

Secretaries can also access academy management routes when authenticated through the academy context. See [Academy API](/backend/api/academy) for the full set of management endpoints available to academy secretaries.

---

## References

- [Authentication](/backend/api/authentication) - Login flow
- [Response Format](/backend/api/response-format) - Standard response structure
- [Academy API](/backend/api/academy) - Academy management endpoints
- [Auth Domain](/backend/domains/auth) - Secretary model
- [Notifications Domain](/backend/domains/notifications) - Notification system
