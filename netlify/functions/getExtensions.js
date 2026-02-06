import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL
});

export async function handler() {
  const { rows } = await pool.query(`
    SELECT
      e.id,
      m.nickname,
      m.birth_year,
      m.gender,
      m.region,
      e.enter_date,
      e.extend_days,
      e.status
    FROM extensions e
    JOIN members m ON e.member_id = m.id
    ORDER BY e.id
  `);

  return {
    statusCode: 200,
    body: JSON.stringify(rows)
  };
}
