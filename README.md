# User and Admin Management API

This is a Next.js application with separate tables for users and admins using Prisma ORM and PostgreSQL.

## Setup

1. Install dependencies:
```bash
npm install
npm install otplib
```

2. Configure your database and authentication:
- Create a PostgreSQL database
- Update the `.env` file with your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/myapp?schema=public"
JWT_SECRET="your-secret-key-change-this-in-production"
FRONTEND_URL="Your-Frontend-URL"
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepassword",
    "walletAddress": "0x123...abc",
    "enableTwoFactor": true // Optional: set to true to enable 2FA
  }
  ```

- POST `/api/auth/login` - Login user
  ```json
  {
    "username": "john_doe",
    "password": "securepassword",
    "twoFactorCode": "123456" // Required if 2FA is enabled for the user
  }
  ```

### Protected Routes
These routes require a valid JWT token in the Authorization header:
`Authorization: Bearer <token>`

- POST `/api/auth/verify-2fa` - Verify 2FA code and get a new token
  ```json
  {
    "twoFactorCode": "123456"
  }
  ```
  *Note: This endpoint is used when a user has 2FA enabled but has not yet verified their current session. The initial login will return a token with `twoFactorVerified: false`, and this endpoint is used to get a new token with `twoFactorVerified: true` after successful 2FA code verification.*

### Users
- GET `/api/users` - Get all users
- POST `/api/users` - Create a new user
- PATCH `/api/users` - Update user information

### Idols

- `GET /api/idols` - Get all idols
- `POST /api/idols` - Create a new idol
- `DELETE /api/idols?id=<id>` - Delete an idol by ID

### Admins
- GET `/api/admins` - Get all admins
- POST `/api/admins` - Create a new admin

## Models

### User
- id: Int (auto-increment)
- username: String (unique)
- email: String (unique)
- walletAddress: String? (unique, optional)
- status: String (default: "active")
- verified: Boolean (default: false)
- credits: Float (default: 0)
- joinedAt: DateTime
- updatedAt: DateTime
- password: String (hashed)
- twoFactorSecret: String? (Store the 2FA secret)
- twoFactorEnabled: Boolean (default: false)

### Admin
- id: Int (auto-increment)
- email: String (unique)
- name: String
- password: String (hashed)
- twoFactorSecret: String? (Store the 2FA secret)
- twoFactorEnabled: Boolean (default: false)
- role: String (default: "admin")
- createdAt: DateTime
- updatedAt: DateTime

## Authentication Flow
1. Register a new user via `/api/auth/register`
2. Login with credentials via `/api/auth/login`
3. Use the returned JWT token in the Authorization header for protected routes

## Security Features
- Password hashing using bcryptjs
- JWT-based authentication
- Protected API routes
- Account status checking
- Input validation
- Environment variables for sensitive data
- Two-Factor Authentication (2FA) support

## Error Handling
- 400: Bad Request - Missing or invalid input
- 401: Unauthorized - Invalid or missing token
- 403: Forbidden - Account suspended
- 409: Conflict - Resource already exists
- 500: Internal Server Error

## Production Considerations
1. Use a strong, unique JWT secret key
2. Implement rate limiting
3. Add CORS protection
4. Use HTTPS
5. Regular security audits
6. Implement password recovery
7. Add email verification
8. Monitor failed login attempts
