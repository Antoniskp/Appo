# Appo

Application for news, education and polls with PostgreSQL and strong authentication.

## Features

- **Strong Authentication**: JWT-based authentication with bcrypt password hashing
- **News Management**: Create, read, update, and delete news articles
- **Education**: Manage educational courses and content
- **Polls**: Create polls with multiple options and voting functionality
- **PostgreSQL Database**: Robust relational database with proper indexing
- **Security**: Helmet for HTTP headers, CORS protection, input validation, rate limiting
- **RESTful API**: Clean and well-structured API endpoints

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **UI**: Static HTML in `public/` with optional Material-styled theme overlays

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Appo
```

2. Install dependencies:
```bash
npm install
```

3. Set up PostgreSQL database:
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE appo;

# Exit psql
\q

# Run the schema
psql -U postgres -d appo -f sql/schema.sql
```

4. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Set a strong `JWT_SECRET`
- Update database credentials if needed
- Configure CORS origin for your frontend

5. Start the application:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### News

#### Get all news (public)
```
GET /api/news
```

#### Get news by ID (public)
```
GET /api/news/:id
```

#### Create news (requires authentication)
```
POST /api/news
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "News Title",
  "content": "News content..."
}
```

#### Update news (requires authentication)
```
PUT /api/news/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

#### Delete news (requires authentication)
```
DELETE /api/news/:id
Authorization: Bearer <token>
```

### Education

#### Get all courses (public)
```
GET /api/education
```

#### Get course by ID (public)
```
GET /api/education/:id
```

#### Create course (requires authentication)
```
POST /api/education
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Course Title",
  "description": "Course description",
  "content": "Course content..."
}
```

#### Update course (requires authentication)
```
PUT /api/education/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "content": "Updated content..."
}
```

#### Delete course (requires authentication)
```
DELETE /api/education/:id
Authorization: Bearer <token>
```

### Polls

#### Get all polls (public)
```
GET /api/polls
```

#### Get poll by ID with options and vote counts (public)
```
GET /api/polls/:id
```

#### Create poll (requires authentication)
```
POST /api/polls
Authorization: Bearer <token>
Content-Type: application/json

{
  "question": "What is your favorite color?",
  "options": ["Red", "Blue", "Green", "Yellow"]
}
```

#### Vote on poll (requires authentication)
```
POST /api/polls/:id/vote
Authorization: Bearer <token>
Content-Type: application/json

{
  "optionId": 1
}
```

#### Delete poll (requires authentication)
```
DELETE /api/polls/:id
Authorization: Bearer <token>
```

### Health Check
```
GET /health
```

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds
2. **JWT Authentication**: Secure token-based authentication
3. **Input Validation**: All inputs are validated using express-validator
4. **HTTP Security Headers**: Helmet middleware for secure HTTP headers
5. **CORS Protection**: Configurable CORS to prevent unauthorized access
6. **SQL Injection Protection**: Parameterized queries with PostgreSQL
7. **Authorization**: Users can only modify their own content
8. **Rate Limiting**: 
   - General API: 100 requests per 15 minutes per IP
   - Authentication endpoints: 5 requests per 15 minutes per IP
   - Create endpoints: 20 requests per 15 minutes per IP

## Database Schema

The application uses the following tables:
- `users`: User accounts with hashed passwords
- `news`: News articles
- `courses`: Educational courses
- `polls`: Poll questions
- `poll_options`: Poll answer options
- `poll_votes`: Tracks user votes (prevents duplicate voting)

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

## UI Theme Notes

- Base styles live in `public/app.css`.
- Material-style overrides live in `public/material.css` and are enabled via `class="material-theme"` on the `<body>`.
- To disable the Material theme later, remove the `material.css` link and remove the `material-theme` class from the `<body>` element.

## Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `DB_HOST`: PostgreSQL host
- `DB_PORT`: PostgreSQL port
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: Secret key for JWT (use a strong random string in production)
- `JWT_EXPIRES_IN`: Token expiration time (e.g., 24h, 7d)
- `CORS_ORIGIN`: Allowed CORS origin

## License

ISC
