import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function handler() {
  try {
    const { rows } = await pool.query(`
      SELECT
        m.*,
        COUNT(DISTINCT CASE
          WHEN DATE_TRUNC('month', e.event_datetime) = DATE_TRUNC('month', NOW())
          THEN ea.id END
        ) AS monthly_count,
        COUNT(DISTINCT ea.id) AS total_count
      FROM members m
      LEFT JOIN event_attendees ea ON m.id = ea.member_id
      LEFT JOIN events e ON ea.event_id = e.id
      GROUP BY m.id
      ORDER BY m.id
    `);
    return {
      statusCode: 200,
      body: JSON.stringify(rows)
    };
  } catch (err) {
    console.error("❌ getMembers error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
