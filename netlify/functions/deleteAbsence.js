import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function handler(event) {
  const { id } = JSON.parse(event.body);

  await pool.query(
    "DELETE FROM absences WHERE id = $1",
    [id]
  );

  return { statusCode: 200 };
}
