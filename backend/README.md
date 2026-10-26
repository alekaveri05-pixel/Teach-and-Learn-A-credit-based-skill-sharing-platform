# TeachTrade Backend

Node.js + Express + MongoDB backend for the TeachTrade platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/teachtrade
JWT_SECRET=your-secret-key-change-this
```

3. Make sure MongoDB is running locally or use MongoDB Atlas.

4. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:5000` and seed initial data if the database is empty.

## API Endpoints

### Auth
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires auth)

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (requires auth)

### Sessions
- `GET /api/sessions` - Get user's sessions (requires auth)
- `GET /api/sessions/:id` - Get session by ID
- `POST /api/sessions` - Create session (requires auth)
- `PUT /api/sessions/:id` - Update session (requires auth)
- `POST /api/sessions/:id/join` - Join session (requires auth)
- `POST /api/sessions/:id/feedback` - Submit feedback (requires auth)
