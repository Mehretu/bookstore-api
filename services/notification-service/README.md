# Notification Service

## Overview
The Notification Service is a microservice component of the Bookstore API that handles real-time notifications for users. It manages notifications for new books, delivering them through both REST API endpoints and WebSocket connections.

## Features
- Real-time notifications using Socket.IO
- REST API endpoints for notification management
- Redis caching for improved performance
- RabbitMQ integration for event-driven notifications
- JWT-based authentication
- Health monitoring endpoints
- Swagger API documentation

## Technical Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Real-time**: Socket.IO
- **Security**: JWT, Vault
- **Documentation**: Swagger/OpenAPI 3.0
- **Monitoring**: OpenTelemetry

## Architecture

### Core Components
1. **Event Handler**
   - Processes incoming events from RabbitMQ
   - Creates notifications based on event type
   - Broadcasts notifications via Socket.IO

2. **Cache Layer**
   - Redis-based caching
   - Caches notification lists and counts
   - Implements cache invalidation patterns

3. **WebSocket Server**
   - Real-time notification delivery
   - User-specific rooms
   - Broadcast capabilities

4. **REST API**
   - CRUD operations for notifications
   - Pagination support
   - Category-based filtering

### Data Flow
1. Event received from RabbitMQ
2. Notification created in MongoDB
3. Cache invalidated
4. Real-time update sent via Socket.IO
5. REST API updated with new data

## API Endpoints

### Notification Management
- `GET /api/notifications` - Get paginated list of notifications
- `GET /api/notifications/category/{category}` - Get notifications by category
- `GET /api/notifications/unread/count` - Get unread notifications count
- `PUT /api/notifications/{id}/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read
- `DELETE /api/notifications/{id}` - Delete a notification

### System
- `GET /api/health` - Service health check
- `GET /api-docs` - Swagger documentation

## Event Types
1. **NEW_BOOK**
   ```json
   {
     "type": "NEW_BOOK",
     "payload": {
       "book": {
         "id": "book_id",
         "title": "Book Title",
         "author": "Author Name",
         "category": "FICTION",
         "price": 29.99,
         "genre": ["Classic"]
       },
       "interestedUsers": ["user_id1", "user_id2"]
     }
   }
   ```

## Models

### Notification Schema
```javascript
{
userId: ObjectId,
type: String,
data: {
bookId: ObjectId,
title: String,
author: String,
category: String,
price: Number,
genre: [String],
rating: Number,
message: String
},
read: Boolean,
createdAt: Date,
updatedAt: Date
}

```
## Configuration

### Environment Variables
```bash
PORT=6001
VAULT_ADDR=http://vault:8200
VAULT_TOKEN=your_vault_token
```

### Vault Secrets
Required secrets in Vault:
- `services/data/database` - MongoDB configuration
- `services/data/redis` - Redis configuration
- `services/data/rabbitmq` - RabbitMQ configuration
- `services/data/auth` - Auth service configuration

## Setup and Installation

1. **Prerequisites**
   ```bash
   - Node.js v16+
   - MongoDB
   - Redis
   - RabbitMQ
   - Vault
   ```

2. **Installation**
   ```bash
   cd services/notification-service
   npm install
   ```

3. **Running**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Monitoring and Health

### Health Check Response
```json
{
"status": "ok",
"service": "notification-service",
"timestamp": "2024-03-11T18:14:51.735Z",
"checks": {
"mongodb": "connected",
"redis": "connected",
"vault": "connected",
"rabbitmq": "connected"
}
}
```

## Error Handling
- HTTP 400 - Bad Request
- HTTP 401 - Unauthorized
- HTTP 403 - Forbidden
- HTTP 404 - Not Found
- HTTP 500 - Internal Server Error
- HTTP 503 - Service Unavailable

## Caching Strategy
- Notification lists: 5 minutes
- Unread counts: 1 minute
- Category-based lists: 5 minutes
- Cache invalidation on updates

## WebSocket Events
- `new-book` - New book notification
- `notifications` - General notifications
- `connect` - Client connection
- `disconnect` - Client disconnection

## Security
- JWT-based authentication
- CORS configuration
- Input validation

## Performance Considerations
- Redis caching for frequently accessed data
- Pagination for large datasets
- Efficient MongoDB indexes
- WebSocket for real-time updates
- Event-driven architecture


