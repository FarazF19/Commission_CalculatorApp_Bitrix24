# Jiggle CRM Backend

Node.js backend for the Jiggle CRM financial commissions dashboard with Express.js and PostgreSQL.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 📊 **Transaction Management** - CRUD operations with filtering and pagination
- 📁 **File Upload** - CSV/Excel file processing for bulk transaction imports
- 💰 **Commission Calculation** - Real-time commission calculations with filters
- 🛡️ **Data Security** - User access restrictions based on assigned MIDs/DBAs
- 🚀 **Performance** - Optimized database queries with indexing

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Clone and navigate to the backend directory:**
   ```bash
   cd Backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the Backend directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=jiggle_crm
   DB_USER=postgres
   DB_PASSWORD=your_password_here

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   JWT_EXPIRES_IN=24h

   # File Upload Configuration
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads

   # CORS Configuration
   FRONTEND_URL=http://localhost:5173
   ```

4. **Set up PostgreSQL database:**
   ```sql
   CREATE DATABASE jiggle_crm;
   ```

5. **Start the server:**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |
| GET | `/api/auth/profile` | Get user profile | Yes |
| PUT | `/api/auth/profile` | Update profile | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |
| POST | `/api/auth/register` | Register new user | Admin |
| GET | `/api/auth/users` | Get all users | Admin |
| PUT | `/api/auth/users/:id` | Update user | Admin |
| DELETE | `/api/auth/users/:id` | Delete user | Admin |

### Transactions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/transactions` | Get transactions with filters | Optional |
| POST | `/api/transactions/calculate-commission` | Calculate commission | Optional |
| POST | `/api/transactions/upload` | Upload CSV/Excel file | Admin |
| GET | `/api/transactions/:id` | Get transaction by ID | Yes |
| PUT | `/api/transactions/:id` | Update transaction | Admin |
| DELETE | `/api/transactions/:id` | Delete transaction | Admin |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |

## Request/Response Examples

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@jiggle-crm.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Transactions with Filters
```bash
GET /api/transactions?mid=2101496360&month=02&year=2025&page=1&limit=10
Authorization: Bearer YOUR_TOKEN
```

Response:
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 50,
      "limit": 10
    },
    "filters": {
      "mid": "2101496360",
      "month": "02",
      "year": "2025"
    }
  }
}
```

### Upload File
```bash
POST /api/transactions/upload
Authorization: Bearer ADMIN_TOKEN
Content-Type: multipart/form-data

file: transactions.csv
```

### Calculate Commission
```bash
POST /api/transactions/calculate-commission
Content-Type: application/json

{
  "mid": "2101496360",
  "month": "02",
  "year": "2025"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "totalEarnings": 59.69,
    "totalCommission": 0.00,
    "transactionCount": 11,
    "filters": {
      "mid": "2101496360",
      "month": "02",
      "year": "2025"
    }
  }
}
```

## Database Schema

### Tables

#### `transactions`
- `id` - Primary key
- `statement_month` - Statement period (e.g., "202502 Feb")
- `mid` - Merchant ID
- `dba` - Doing Business As name
- `sales_volume` - Sales volume amount
- `sales_txn` - Number of sales transactions
- `commission` - Commission amount
- `responsible` - Responsible person
- `earnings` - Earnings amount
- `created_at` - Record creation timestamp
- `updated_at` - Record update timestamp

#### `users`
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address
- `password_hash` - Hashed password
- `role` - User role ('admin' or 'user')
- `assigned_mids` - Array of accessible MIDs
- `assigned_dbas` - Array of accessible DBAs
- `created_at` - User creation timestamp
- `updated_at` - User update timestamp

## File Upload Format

### CSV/Excel File Structure
The uploaded files should contain the following columns (column names are flexible):

| Field | Variations | Required | Type |
|-------|------------|----------|------|
| Statement Month | statement_month, statementMonth, month | Yes | String |
| MID | mid, MID, merchant_id | Yes | String |
| DBA | dba, DBA, business_name | Yes | String |
| Sales Volume | sales_volume, salesVolume, volume | No | Number |
| Sales Transactions | sales_txn, salesTxn, transactions | No | Number |
| Commission | commission, Commission, commission_amount | No | Number |
| Responsible | responsible, responsible_person | No | String |
| Earnings | earnings, Earnings, total_earnings | No | Number |

### Example CSV:
```csv
statement_month,mid,dba,sales_volume,sales_txn,commission,responsible,earnings
202502 Feb,2101496360,J C Wise Limited,995.00,23.39,0.00,Anna Lisowska,23.39
202502 Feb,2101496361,Tech Solutions Ltd,1250.00,45.00,0.00,John Smith,28.50
```

## Role-Based Access Control

### Admin Users
- Can see all transactions
- Can upload files
- Can manage users
- Can delete/update transactions

### Regular Users
- Can only see transactions for their assigned MIDs/DBAs
- Cannot upload files
- Cannot manage users
- Read-only access to their data

## Error Handling

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Additional error details (dev mode only)"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | jiggle_crm |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Token expiration | 24h |
| `MAX_FILE_SIZE` | Max upload size | 10485760 |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |

## Development

### Project Structure
```
Backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── transactionController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   └── Transaction.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── transactions.js
│   └── server.js
├── uploads/
├── package.json
└── README.md
```

### Default Admin Account
- **Username:** admin
- **Password:** admin123
- **Email:** admin@jiggle-crm.com

### Running in Development
```bash
npm run dev
```

This starts the server with nodemon for auto-reloading.

## Deployment

1. Set `NODE_ENV=production`
2. Set a strong `JWT_SECRET`
3. Configure production database
4. Set appropriate CORS origins
5. Use a process manager like PM2:

```bash
npm install -g pm2
pm2 start src/server.js --name "jiggle-crm-backend"
```

## Security Notes

- Change default admin password
- Use strong JWT secrets in production
- Enable HTTPS in production
- Regularly update dependencies
- Monitor for security vulnerabilities

## License

This project is licensed under the ISC License. 