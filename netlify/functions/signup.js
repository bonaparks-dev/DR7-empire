
const { getPool } = require('@netlify/neon');
const bcryptjs = require('bcryptjs');

// Helper to create a standard JSON response
const createResponse = (statusCode, body) => ({
  statusCode,
  headers: { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return createResponse(405, { error: 'Method Not Allowed' });
  }

  if (!process.env.NETLIFY_DATABASE_URL) {
    return createResponse(500, { error: 'Database URL not configured.' });
  }
  
  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is missing.' });
    }
    const { fullName, email, password } = JSON.parse(event.body);

    if (!fullName || !email || !password) {
      return createResponse(400, { error: 'Full name, email, and password are required.' });
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return createResponse(400, { error: 'Invalid email format.' });
    }

    const pool = getPool();
    
    // Check if user already exists
    const { rows: existingUsers } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUsers.length > 0) {
      return createResponse(409, { error: 'A user with this email already exists.' });
    }
    
    // Hash the password
    const passwordHash = await bcryptjs.hash(password, 10);
    
    // Insert new user
    await pool.query('INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3)', [fullName, email.toLowerCase(), passwordHash]);
    
    return createResponse(201, { message: 'User created successfully.' });

  } catch (error) {
    console.error('Signup error:', error);
    return createResponse(500, { error: 'An unexpected error occurred. Please try again.' });
  }
};