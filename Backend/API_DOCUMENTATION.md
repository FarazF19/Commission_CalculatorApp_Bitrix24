# Jiggle CRM Backend API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Response Format

All API responses follow this consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Description of the operation",
  "data": {
    // Response data
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## Authentication Endpoints

### POST `/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@jiggle-crm.com",
      "role": "admin",
      "assigned_mids": [],
      "assigned_dbas": []
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### GET `/auth/profile`

Get the current user's profile information.

**Headers:** `Authorization: Bearer TOKEN`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@jiggle-crm.com",
      "role": "admin",
      "assigned_mids": [],
      "assigned_dbas": []
    }
  }
}
```

### PUT `/auth/profile`

Update the current user's profile.

**Headers:** `Authorization: Bearer TOKEN`

**Request Body:**
```json
{
  "email": "newemail@example.com"
}
```

### POST `/auth/change-password`

Change the current user's password.

**Headers:** `Authorization: Bearer TOKEN`

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

### POST `/auth/register` (Admin Only)

Register a new user.

**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Request Body:**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "role": "user",
  "assigned_mids": ["2101496360"],
  "assigned_dbas": ["J C Wise Limited"]
}
```

### GET `/auth/users` (Admin Only)

Get all users.

**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@jiggle-crm.com",
        "role": "admin",
        "assigned_mids": [],
        "assigned_dbas": [],
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

### PUT `/auth/users/:id` (Admin Only)

Update a user by ID.

**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Request Body:**
```json
{
  "email": "updated@example.com",
  "role": "user",
  "assigned_mids": ["2101496360", "2101496361"],
  "assigned_dbas": ["J C Wise Limited"]
}
```

### DELETE `/auth/users/:id` (Admin Only)

Delete a user by ID.

**Headers:** `Authorization: Bearer ADMIN_TOKEN`

## Transaction Endpoints

### GET `/transactions`

Get transactions with optional filtering and pagination.

**Query Parameters:**
- `mid` (string): Filter by MID
- `dba` (string): Filter by DBA name
- `month` (string): Filter by month (01-12)
- `year` (string): Filter by year (e.g., "2025")
- `responsible` (string): Filter by responsible person
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 100)

**Example:** `/transactions?mid=2101496360&month=02&year=2025&page=1&limit=10`

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 1,
        "statement_month": "202502 Feb",
        "mid": "2101496360",
        "dba": "J C Wise Limited",
        "sales_volume": "995.00",
        "sales_txn": "23.39",
        "commission": "0.00",
        "responsible": "Anna Lisowska",
        "earnings": "23.39",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ],
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

### GET `/transactions/:id`

Get a specific transaction by ID.

**Headers:** `Authorization: Bearer TOKEN`

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": 1,
      "statement_month": "202502 Feb",
      "mid": "2101496360",
      "dba": "J C Wise Limited",
      "sales_volume": "995.00",
      "sales_txn": "23.39",
      "commission": "0.00",
      "responsible": "Anna Lisowska",
      "earnings": "23.39",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### POST `/transactions/calculate-commission`

Calculate commission totals based on filters.

**Request Body:**
```json
{
  "mid": "2101496360",
  "month": "02",
  "year": "2025"
}
```

**Response:**
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

### POST `/transactions/upload` (Admin Only)

Upload and process a CSV or Excel file containing transaction data.

**Headers:** 
- `Authorization: Bearer ADMIN_TOKEN`
- `Content-Type: multipart/form-data`

**Form Data:**
- `file`: CSV or Excel file (max 10MB)

**Supported File Formats:**
- CSV (.csv)
- Excel (.xlsx, .xls)

**Expected Columns:**
- `statement_month` (required)
- `mid` (required)
- `dba` (required)
- `sales_volume` (optional)
- `sales_txn` (optional)
- `commission` (optional)
- `responsible` (optional)
- `earnings` (optional)

**Response:**
```json
{
  "success": true,
  "message": "File uploaded and processed successfully",
  "data": {
    "totalProcessed": 100,
    "totalInserted": 95,
    "totalErrors": 5,
    "insertedTransactions": [
      // First 5 inserted transactions
    ],
    "errors": [
      "Row 6: MID is required",
      "Row 12: Invalid date format"
    ]
  }
}
```

### PUT `/transactions/:id` (Admin Only)

Update a transaction by ID.

**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Request Body:**
```json
{
  "statement_month": "202502 Feb",
  "mid": "2101496360",
  "dba": "J C Wise Limited",
  "sales_volume": 1000.00,
  "sales_txn": 25.00,
  "commission": 5.00,
  "responsible": "Anna Lisowska",
  "earnings": 25.00
}
```

### DELETE `/transactions/:id` (Admin Only)

Delete a transaction by ID.

**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Response:**
```json
{
  "success": true,
  "message": "Transaction deleted successfully",
  "data": {
    "transaction": {
      "id": 1,
      "mid": "2101496360",
      // ... other fields
    }
  }
}
```

## Health Check

### GET `/health`

Check server health status.

**Response:**
```json
{
  "success": true,
  "message": "Jiggle CRM Backend is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

## Rate Limiting

Currently, there are no rate limits implemented, but consider implementing them for production use.

## File Upload Specifications

### Supported Formats
- **CSV**: `.csv` files with comma-separated values
- **Excel**: `.xlsx` and `.xls` files

### File Size Limits
- Maximum file size: 10MB (configurable via `MAX_FILE_SIZE` environment variable)

### Column Mapping
The system accepts various column name formats:

| Standard Field | Accepted Variations |
|----------------|-------------------|
| statement_month | statement_month, statementMonth, statement month, month |
| mid | mid, MID, merchant_id, merchantId |
| dba | dba, DBA, business_name, businessName, merchant_name |
| sales_volume | sales_volume, salesVolume, sales volume, volume |
| sales_txn | sales_txn, salesTxn, sales txn, sales_transaction, transactions |
| commission | commission, Commission, commission_amount |
| responsible | responsible, Responsible, responsible_person, sales_person |
| earnings | earnings, Earnings, commission_earnings, total_earnings |

### Sample CSV Format
```csv
statement_month,mid,dba,sales_volume,sales_txn,commission,responsible,earnings
202502 Feb,2101496360,J C Wise Limited,995.00,23.39,0.00,Anna Lisowska,23.39
202502 Feb,2101496361,Tech Solutions Ltd,1250.00,45.00,0.00,John Smith,28.50
```

## Role-Based Access Control

### Admin Users
- Full access to all endpoints
- Can view all transactions
- Can upload files
- Can manage users
- Can update/delete transactions

### Regular Users
- Can view only assigned transactions (based on `assigned_mids` and `assigned_dbas`)
- Cannot upload files
- Cannot manage users
- Read-only access to their data
- Can calculate commissions for their assigned data

### Data Access Rules
- Users can only see transactions where:
  - Transaction's MID is in their `assigned_mids` array, OR
  - Transaction's DBA is in their `assigned_dbas` array
- Admins can see all transactions regardless of assignments

## Testing the API

### Using curl

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Get Transactions:**
```bash
curl -X GET "http://localhost:5000/api/transactions?mid=2101496360&month=02&year=2025" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Upload File:**
```bash
curl -X POST http://localhost:5000/api/transactions/upload \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "file=@transactions.csv"
```

### Using Postman

1. Import this API documentation
2. Set up environment variables for base URL and tokens
3. Use the examples provided above

## Production Considerations

1. **Security**: Use HTTPS in production
2. **Environment Variables**: Set strong JWT secrets
3. **Database**: Use connection pooling and proper indexing
4. **Monitoring**: Implement logging and monitoring
5. **Rate Limiting**: Add rate limiting for API endpoints
6. **Validation**: Add comprehensive input validation
7. **CORS**: Configure CORS for your specific frontend domain 