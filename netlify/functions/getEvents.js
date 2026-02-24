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
        ev.id,
        ev.title,
        ev.host_member_id,
        m.nickname AS host_nickname,
        ev.event_datetime,
        ev.location,
        ev.created_at,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', mem.id, 'nickname', mem.nickname)
            ORDER BY mem.nickname
          ) FILTER (WHERE mem.id IS NOT NULL),
          '[]'
        ) AS attendees
      FROM events ev
      LEFT JOIN members m ON ev.host_member_id = m.id
      LEFT JOIN event_attendees ea ON ev.id = ea.event_id
      LEFT JOIN members mem ON ea.member_id = mem.id
      GROUP BY ev.id, m.nickname
      ORDER BY ev.event_datetime DESC
    `);

    return {
      statusCode: 200,
      body: JSON.stringify(rows)
    };
  } catch (err) {
    console.error("❌ getEvents error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
