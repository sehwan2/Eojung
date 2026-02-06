import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL
});

export async function handler() {
  const { rows } = await pool.query(`
    SELECT
      a.id,
      m.nickname,
      m.birth_year,
      m.gender,
      m.region,
      a.event_datetime,
      a.host,
      a.notice_time
    FROM absences a
    JOIN members m ON a.member_id = m.id
    ORDER BY a.event_datetime DESC
  `);

  return {
    statusCode: 200,
    body: JSON.stringify(rows)
  };
}
