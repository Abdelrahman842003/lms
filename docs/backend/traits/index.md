---
title: Traits Reference
description: Overview of all reusable traits in the Neetaq backend
---

# Traits Reference

Traits provide reusable pieces of functionality that are composed into models and controllers across the Neetaq backend.

## Trait Inventory

| Trait | Purpose | Used By |
|-------|---------|---------|
| [ApiResponseTrait](./api-response) | Standardized JSON responses | Controllers |
| [HasDeviceTokens](./has-device-tokens) | FCM device token management | User models |
| [HasAcademyFilter](./has-academy-filter) | Multi-tenancy scope filtering | Models with academy association |
| HasOwnershipScopes | Ownership-based query scopes | Models with creator/owner |
| [ResolvesAcademy](./resolves-academy) | Academy resolution from request | Controllers |
| [ResolvesTeacher](./resolves-teacher) | Teacher resolution from request | Controllers |
| HasAuditLog | Automatic audit logging | Models requiring change tracking |
| BroadcastsNotification | Real-time notification broadcasting | Models triggering live events |

## Common Patterns

### Trait Composition

Traits are composed into classes using PHP's `use` keyword:

```php
class AcademyController extends Controller
{
    use ApiResponseTrait;
    use ResolvesAcademy;

    public function show(Request $request)
    {
        $academy = $this->resolveAcademy($request);
        return $this->successResponse($academy);
    }
}
```

### Method Resolution Order

When multiple traits define the same method name, PHP resolves conflicts using `insteadof` and `as` operators. The Neetaq codebase avoids conflicts by keeping trait method names unique and descriptive.

## See Also

- [Services](../services) - Domain service reference
- [Policies](../policies) - Authorization policy reference
- [Patterns](../patterns) - Design patterns used in the codebase
