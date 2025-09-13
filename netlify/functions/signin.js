import { getPool } from '@netlify/neon';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';

// Helper to create a standard JSON response
const createResponse = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { error: 'Method Not Allowed' });
  }

  if (!process.env.NETLIFY_DATABASE_URL) {
    return createResponse(500, { error: 'Database URL not configured.' });
  }

  if (!process.env.JWT_SECRET) {
      return createResponse(500, { error: 'JWT secret not configured.' });
  }

  try {
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return createResponse(400, { error: 'Email and password are required.' });
    }

    const pool = getPool();

    // Find user by email
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (rows.length === 0) {
      return createResponse(401, { error: 'Invalid email or password.' });
    }
    
    const user = rows[0];

    // Compare password
    const isMatch = await bcryptjs.compare(password, user.password_hash);
    if (!isMatch) {
      return createResponse(401, { error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jsonwebtoken.sign(
      { 
        id: user.id, 
        email: user.email,
        fullName: user.full_name
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // Token expires in 1 day
    );

    return createResponse(200, { 
        token, 
        user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
        }
    });

  } catch (error) {
    console.error('Signin error:', error);
    return createResponse(500, { error: 'An unexpected error occurred. Please try again.' });
  }
};
