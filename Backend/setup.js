#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Jiggle CRM Backend...\n');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envTemplate = `# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jiggle_crm
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=jiggle_crm_secret_${Date.now()}_change_in_production
JWT_EXPIRES_IN=24h

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS Configuration
FRONTEND_URL=http://localhost:5173
`;

  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env file');
  console.log('⚠️  Please update your PostgreSQL credentials in .env file\n');
} else {
  console.log('✅ .env file already exists\n');
}

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('✅ Created uploads directory');
} else {
  console.log('✅ Uploads directory already exists');
}

console.log('\n📋 Next steps:');
console.log('1. Update your PostgreSQL credentials in .env file');
console.log('2. Create PostgreSQL database: CREATE DATABASE jiggle_crm;');
console.log('3. Install dependencies: npm install');
console.log('4. Seed the database: npm run seed');
console.log('5. Start the server: npm run dev');

console.log('\n🎯 Default admin login:');
console.log('   Username: admin');
console.log('   Password: admin123');

console.log('\n📚 For more information, see README.md'); 