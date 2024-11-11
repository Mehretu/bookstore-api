# Book Service Documentation
## Service Overview

The Book Service is a core microservice in our bookstore API that handles:
- Book management (CRUD operations)
- Review management
- Search functionality
- Rating and voting systems
- Report handling

### Key Features
- Full-text search with suggestions
- Review management with voting system
- Book categorization and metadata
- Admin controls for content moderation
- Event-driven notifications
- Role-based access control

## API Endpoints

### Book Routes
***Public Routes***
```http
GET /api/books # Get all books with pagination and filters
GET /api/books/:id # Get a specific book by ID
```

***Protected Routes(Admin Only)***
```http
POST /api/books # Create a new book
POST /api/books/bulk # Bulk create books
PUT /api/books/:id # Update a book
DELETE /api/books/:id # Delete a book   
```
### Review Routes
***Public Routes***
```http
GET /api/reviews/book/:bookId # Get reviews for a book
```
***Protected Routes(User)***
```http
POST /api/reviews/book/:bookId # Create a review
PUT /api/reviews/:reviewId # Update own review
DELETE /api/reviews/:reviewId # Delete own review
POST /api/reviews/:reviewId/vote # Vote on a review
POST /api/reviews/:reviewId/report # Report a review
```
***Protected Routes(Admin Only)***
```http
GET /api/reviews/reported # Get all reported reviews
PUT /api/reviews/:reviewId/handle-report # Handle reported review
```
### Search Routes
***Public routes***
```http
GET /api/search # Search books with filters
GET /api/search/suggestions # Get search suggestions
```
## Data Models

### Book Model
```javascript
{
title: String,
author: String,
isbn: String,
category: String,
price: Number,
description: String,
metadata: {
genre: [String],
popularity: {
rating: Number,
reviewCount: Number
}
}
}
```

### Review Model
```javascript
{
bookId: ObjectId,
userId: ObjectId,
rating: Number,
title: String,
content: String,
tags: [String],
votes: {
upvotes: [ObjectId],
downvotes: [ObjectId]
},
reported: {
isReported: Boolean,
reports: [{
userId: ObjectId,
reason: String,
timestamp: Date
}],
handledBy: {
adminId: ObjectId,
action: String,
note: String,
timestamp: Date
}
}
}
```
## Search Functionality

The search system supports:
- Full-text search across titles, authors, and descriptions
- Category filtering
- Price range filtering
- Rating range filtering
- Genre filtering
- Multiple sort options (price, rating, review count)
- Auto-complete suggestions
- Pagination

### Search Parameters
```javascript
{
q: String, // Search query
category: String, // Book category
author: String, // Author name
genre: String|[String], // Genre(s)
minPrice: Number, // Minimum price
maxPrice: Number, // Maximum price
minRating: Number, // Minimum rating
maxRating: Number, // Maximum rating
sortBy: String, // Sort field
sortOrder: String, // Sort direction
page: Number, // Page number
limit: Number // Items per page
}
```
## Event System

The service publishes events to RabbitMQ for:
- New book notifications (when an admin creates a new book)



### Event Types
```json
{
"book.created": {
"type": "NEW_BOOK",
"payload": {
"book": {
"id": String,
"title": String,
"author": String,
"category": String,
"price": Number
},
"interestedUsers": [String] // Users who have upvoted reviews in the same category
}
}
}
```
This event is published in the `BookController.createBook` method:
```javascript
javascript
await publishEvent('book.created', {
type: 'NEW_BOOK',
payload: {
book: {
id: savedBook.id,
title: savedBook.title,
author: savedBook.author,
category: savedBook.category,
price: savedBook.price
},
interestedUsers
}
})
```
## Security

### Authentication
- Uses JWT-based authentication via Auth Service
- Tokens verified on protected routes

### Authorization
- Role-based access control (RBAC)
- Admin-only routes for sensitive operations
- User ownership verification for reviews

## Monitoring

### OpenTelemetry Integration
- Request tracing
- Operation tracking
- Error monitoring
- Performance metrics

### Health Checks
```http
GET /health
```
Response:
```javascript
{
    status:'ok',
    service:'book-service',
    timestamp:Date,
    checks:{
        mongodb:'connected|disconnected',
        vault:'connected|disconnected',
        rabbitmq:'connected|disconnected',
    }
}
```

## Configuration

### Environment Variables
```bash
PORT=8080
VAULT_ADDR=http://vault:8201
VAULT_TOKEN=YOUR_VAULT_TOKEN
```

### Vault Secrets
```javascript
{
database: {
mongodb_uri: String
},
services: {
auth_service_url: String,
rabbitmq_url: String
}
}
```
## Development Setup

1. Install dependencies:
```bash
npm install
```
2. Run setup script:
```bash
npm run setup
```

3. Start the service:
```bash
npm start
```
## Error Handling

The service uses HTTP-errors for consistent error responses:
```javascript
{
error: {
status: Number,
message: String,
stack: String // In development only
}
}
```

## Dependencies

- express: Web framework
- mongoose: MongoDB ODM
- node-vault: Vault client
- amqplib: RabbitMQ client
- @opentelemetry/api: Tracing
- http-errors: Error handling
- cors: CORS support
