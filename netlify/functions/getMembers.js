import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function handler() {
  const { rows } = await pool.query(
    "SELECT * FROM members ORDER BY id"
  );
  return {
    statusCode: 200,
    body: JSON.stringify(rows)
  };
}
