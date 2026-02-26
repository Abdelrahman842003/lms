---
title: Request Lifecycle
description: Complete request tracing with sequence diagrams
---

# Request Lifecycle

Complete tracing of an HTTP request through the Neetaq backend architecture.

## Overview Sequence

```mermaid
sequenceDiagram
    actor Client
    participant Nginx as Nginx Reverse Proxy
    participant Octane as Laravel Octane
    participant Middleware as Middleware Stack
    participant Route as Route Resolver
    participant Controller as Controller
    participant Service as Service Layer
    participant Model as Eloquent Model
    participant DB as MySQL
    participant Redis as Redis Cache
    participant Horizon as Horizon Queue
    participant FCM as Firebase FCM

    Client->>Nginx: HTTP Request
    Nginx->>Octane: Forward to Octane:8000
    
    Octane->>Middleware: Apply Middleware Stack
    Middleware->>Middleware: Throttle Check
    Middleware->>Middleware: Auth Check (Sanctum)
    Middleware->>Middleware: Academy Context
    
    Middleware->>Route: Match Route
    Route->>Controller: Dispatch to Controller
    
    Controller->>Service: Call Service Method
    Service->>Model: Query/Update Data
    
    alt Cache Hit
        Model->>Redis: Check Cache
        Redis-->>Model: Return Cached Data
    else Cache Miss
        Model->>DB: Execute Query
        DB-->>Model: Return Data
        Model->>Redis: Store in Cache
    end
    
    Model-->>Service: Return Model Data
    Service->>Service: Apply Business Logic
    Service-->>Controller: Return Result
    
    Controller->>Controller: Transform to Resource
    Controller-->>Octane: JSON Response
    Octane-->>Nginx: HTTP Response
    Nginx-->>Client: Return to Client
    
    opt Async Operations
        Service->>Horizon: Dispatch Job
        Horizon->>FCM: Send Notification
    end
```

## Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Client as Frontend
    participant Nginx as Nginx
    participant Octane as Laravel Octane
    participant Auth as Auth Middleware
    participant Sanctum as Sanctum
    participant DB as Database
    participant Redis as Redis Session

    User->>Client: Login Request
    Client->>Nginx: POST /api/v1/teacher/login
    Nginx->>Octane: Forward Request
    
    Octane->>Auth: Throttle Check
    Auth->>Auth: Validate Credentials
    Auth->>DB: Query User
    DB-->>Auth: User Record
    
    Auth->>Sanctum: Create Token
    Sanctum->>DB: Store Token
    Sanctum->>Redis: Cache Session
    
    Sanctum-->>Auth: Token + Cookie
    Auth-->>Octane: Authenticated User
    Octane-->>Nginx: 200 + Token
    Nginx-->>Client: Set-Cookie + JSON
    Client-->>User: Dashboard
```

## Authenticated Request Flow

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant Nginx as Nginx
    participant Octane as Laravel Octane
    participant Middleware as Middleware Stack
    participant Controller as Controller

    Client->>Client: Get Token from Storage
    Client->>Nginx: Request + Authorization: Bearer {token}
    Nginx->>Octane: Forward Request
    
    Octane->>Middleware: Process Stack
    
    note over Middleware: Middleware Execution Order
    Middleware->>Middleware: 1. HandleCors
    Middleware->>Middleware: 2. Throttle Requests
    Middleware->>Middleware: 3. Authenticate (Sanctum)
    Middleware->>Middleware: 4. EnsureTeacherNotSuspended
    Middleware->>Middleware: 5. InjectAcademyContext
    
    Middleware->>Controller: Request Authenticated
    Controller->>Controller: Execute Action
    Controller-->>Octane: Response
    Octane-->>Nginx: JSON Response
    Nginx-->>Client: 200 OK + Data
```

## Exam Attempt Flow

```mermaid
sequenceDiagram
    actor Student
    participant Client as Frontend
    participant Nginx as Nginx
    participant Octane as Octane
    participant Controller as StudentExamController
    participant Action as StartAttemptAction
    participant Service as ExamService
    participant Model as ExamAttempt
    participant DB as MySQL
    participant Redis as Redis
    participant Reverb as Laravel Reverb
    participant Horizon as Horizon

    Student->>Client: Start Exam
    Client->>Nginx: POST /api/v1/student/exams/{id}/start
    Nginx->>Octane: Forward
    
    Octane->>Controller: Authenticated Request
    Controller->>Action: StartAttemptAction
    
    Action->>Service: validateCanStart()
    Service->>DB: Check existing attempts
    Service->>DB: Verify exam availability
    
    Service->>Model: Create Attempt
    Model->>DB: INSERT exam_attempts
    DB-->>Model: Attempt Created
    
    Model->>Redis: Cache Attempt State
    Model->>Reverb: Broadcast ExamStarted Event
    
    Model-->>Service: Attempt Instance
    Service-->>Action: Result
    Action-->>Controller: Attempt Data
    
    Controller->>Controller: Transform to Resource
    Controller-->>Octane: JSON Response
    Octane-->>Client: 201 Created
    
    opt Scheduled End
        Service->>Horizon: Dispatch ProcessExamEnd Job
        Horizon->>Horizon: Schedule for exam end time
    end
```

## Notification Flow

```mermaid
sequenceDiagram
    participant Controller as NotificationController
    participant Service as NotificationService
    participant Factory as NotificationFactory
    participant ChannelF as FCM Channel
    participant ChannelV as Voice Channel
    participant ChannelD as Database Channel
    participant Queue as Queue Worker
    participant FCM as Firebase
    participant Voice as Voice API

    Controller->>Service: Send Notification
    Service->>Factory: Create Notification
    Factory-->>Service: Notification Instance
    
    Service->>Service: Determine Channels
    
    par FCM Notification
        Service->>Queue: Dispatch FCM Job
        Queue->>ChannelF: Process
        ChannelF->>FCM: Send Push
        FCM-->>ChannelF: Success
    and Voice Call
        Service->>Queue: Dispatch Voice Job
        Queue->>ChannelV: Process
        ChannelV->>Voice: Initiate Call
        Voice-->>ChannelV: Success
    and Database Record
        Service->>ChannelD: Store Record
        ChannelD->>DB: INSERT
    end
    
    Service-->>Controller: Dispatch Complete
```

## WebSocket Connection Flow

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant Nginx as Nginx
    participant Reverb as Laravel Reverb
    participant Octane as Laravel Octane
    participant Redis as Redis
    participant Channel as Private Channel

    Client->>Nginx: WS Connection Request
    Nginx->>Reverb: Upgrade to WebSocket
    
    Reverb->>Client: Connection Established
    
    Client->>Reverb: Subscribe to Channel
    Reverb->>Octane: Auth Request
    Octane->>Octane: Validate Token
    Octane->>Redis: Check Session
    Redis-->>Octane: Valid
    Octane-->>Reverb: Authorized
    
    Reverb->>Channel: Subscribe Client
    Reverb->>Client: Subscription Confirmed
    
    loop Real-time Updates
        Octane->>Redis: Publish Event
        Redis->>Reverb: Broadcast
        Reverb->>Channel: Push to Subscribers
        Channel->>Client: Receive Event
    end
```

## File Upload Flow

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant Nginx as Nginx
    participant Octane as Laravel Octane
    participant Controller as MediaController
    participant Service as ImageService
    participant Adapter as CloudflareR2Adapter
    participant Queue as Queue Worker
    participant R2 as Cloudflare R2
    participant DB as Database

    Client->>Nginx: POST /api/v1/media/upload
    Nginx->>Octane: Forward Request
    
    Octane->>Controller: Handle Upload
    Controller->>Service: Process Upload
    
    Service->>Service: Validate File
    Service->>Service: Generate Filename
    
    alt Direct Upload
        Service->>Adapter: Store File
        Adapter->>R2: PUT Object
        R2-->>Adapter: URL
    else Queued Upload
        Service->>Queue: Dispatch ProcessMediaUpload
        Queue->>Adapter: Process
        Adapter->>R2: PUT Object
    end
    
    Adapter-->>Service: Public URL
    Service->>DB: Store Reference
    Service-->>Controller: URL
    Controller-->>Client: 201 + URL
```

## Cache Invalidation Flow

```mermaid
sequenceDiagram
    participant Controller as Controller
    participant Model as Eloquent Model
    participant Observer as Model Observer
    participant Cache as Cache Service
    participant Redis as Redis
    
    Controller->>Model: Update Record
    Model->>DB: Save Changes
    DB-->>Model: Updated
    
    Model->>Observer: Updated Event
    Observer->>Cache: Invalidate Cache
    Cache->>Redis: DEL cache:key
    Redis-->>Cache: OK
    
    alt Tag-based Invalidation
        Cache->>Redis: Invalidate by Tag
        Redis->>Redis: Delete all with tag
    end
    
    Observer-->>Model: Done
    Model-->>Controller: Updated Model
```

## Error Handling Flow

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant Octane as Laravel Octane
    participant App as App Exception Handler
    participant Exception as Custom Exception
    participant Handler as Exception Handler
    participant Logger as Log Service

    Client->>Octane: Request
    
    alt Validation Error
        Octane->>Exception: ValidationException
        Exception->>Handler: Handle
        Handler->>Client: 422 + Validation Errors
    else Not Found
        Octane->>Exception: ModelNotFoundException
        Exception->>Handler: Handle
        Handler->>Client: 404 + Not Found
    else Authentication
        Octane->>Exception: AuthenticationException
        Exception->>Handler: Handle
        Handler->>Client: 401 + Unauthorized
    else Authorization
        Octane->>Exception: AuthorizationException
        Exception->>Handler: Handle
        Handler->>Client: 403 + Forbidden
    else Server Error
        Octane->>Exception: Exception
        Exception->>Handler: Handle
        Handler->>Logger: Log Error
        Handler->>Client: 500 + Error Message (dev only)
    end
```

## Request Lifecycle Steps

### 1. Entry Point (Nginx)

```nginx
# nginx/conf.d/default.conf
server {
    listen 80;
    server_name neetaq.com;
    
    location /api {
        proxy_pass http://octane:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        proxy_pass http://frontend:3000;
    }
}
```

### 2. Laravel Octane Boot

```php
// Swoole server initialization
1. Load configuration
2. Boot service providers
3. Warm caches
4. Start worker processes
```

### 3. Middleware Pipeline

```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api([
        \Illuminate\Routing\Middleware\ThrottleRequests::class,
        \App\Domains\Auth\Http\Middleware\EnsureTeacherNotSuspended::class,
    ]);
})
```

### 4. Route Resolution

```php
// routes/api.php
Route::middleware('auth:sanctum')
    ->prefix('teacher')
    ->group(function () {
        Route::get('/students', [StudentController::class, 'index']);
    });
```

### 5. Response Formation

```php
// Controller response
return response()->json([
    'status' => true,
    'status_code' => 200,
    'message' => 'Success',
    'data' => $resource,
]);
```

## Performance Considerations

| Stage | Optimization |
|-------|-------------|
| Nginx | Enable gzip, caching headers |
| Octane | Worker count = CPU cores |
| Database | Query optimization, indexes |
| Redis | Connection pooling |
| Queue | Separate queue for notifications |

## References

- [`backend/routes/api.php`](/backend/routes/api.php)
- [`backend/bootstrap/app.php`](/backend/bootstrap/app.php)
- [`backend/app/Domains/Support/Traits/ApiResponseTrait.php`](/backend/app/Domains/Support/Traits/ApiResponseTrait.php)
- [`nginx/conf.d/default.conf`](/nginx/conf.d/default.conf)

## TODO

- [ ] Add distributed tracing with OpenTelemetry
- [ ] Document rate limiting implementation
- [ ] Add request timing metrics
- [ ] Document request/response compression
