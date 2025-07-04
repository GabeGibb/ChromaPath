# ChromaPath API

A serverless API for generating ChromaPath game boards, designed to run on Vercel.

## Features

- Generate random ChromaPath boards of various sizes
- Serverless architecture for scalability
- Health check endpoints
- Board size validation
- Prepared for future database integration

## API Endpoints

### Generate Random Board

```
GET /api/v1/boards/random?size={size}
```

**Parameters:**

- `size` (optional): Board size (5-15, default: 5)

**Response:**

```json
{
  "board": [...],
  "size": 5,
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Health Check

```
GET /api/v1/boards/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "minBoardSize": 5,
  "maxBoardSize": 15
}
```

### Get Constraints

```
GET /api/v1/boards/constraints
```

**Response:**

```json
{
  "minSize": 5,
  "maxSize": 15
}
```

## Development

### Local Development

```bash
npm install
npm run dev
```

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
vercel
```

## Architecture

### Current State (Serverless)

- Stateless board generation
- No caching (each request generates a new board)
- Suitable for low to medium traffic

### Future Database Integration

The API is structured to easily integrate with a database for caching:

1. **Board Caching**: Store pre-generated boards in database
2. **Cache Replenishment**: Separate endpoints to refill cache
3. **Performance Optimization**: Serve cached boards for faster response times

#### Planned Database Schema

```sql
-- Boards table for caching
CREATE TABLE boards (
  id SERIAL PRIMARY KEY,
  size INTEGER NOT NULL,
  board_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  used_count INTEGER DEFAULT 0
);

-- Cache management
CREATE TABLE cache_stats (
  size INTEGER PRIMARY KEY,
  available_count INTEGER DEFAULT 0,
  last_replenished TIMESTAMP DEFAULT NOW()
);
```

#### Future API Endpoints

```
POST /api/v1/boards/cache/replenish?size={size}&count={count}
GET /api/v1/boards/cache/stats
DELETE /api/v1/boards/cache/clear
```

## Environment Variables

- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (for local development)

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error description",
  "message": "Detailed error message",
  "additionalInfo": "..."
}
```

Common HTTP status codes:

- `200`: Success
- `400`: Bad request (invalid board size)
- `500`: Internal server error
