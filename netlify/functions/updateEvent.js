import pkg from "pg";
import { requireApiPassword } from "./utils/auth.js";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function handler(event) {
  const authError = requireApiPassword(event);
  if (authError) return authError;

  try {
    const { id, title, host_member_id, event_datetime, location, attendee_ids } = JSON.parse(event.body);

    if (!id) return { statusCode: 400, body: "Missing event id" };

    await pool.query(
      `UPDATE events
       SET title = $1, host_member_id = $2, event_datetime = $3, location = $4
       WHERE id = $5`,
      [title, host_member_id || null, event_datetime || null, location || null, id]
    );

    // 기존 참석자 삭제 후 새로 삽입
    await pool.query("DELETE FROM event_attendees WHERE event_id = $1", [id]);

    if (Array.isArray(attendee_ids) && attendee_ids.length > 0) {
      const placeholders = attendee_ids.map((_, i) => `($1, $${i + 2})`).join(", ");
      await pool.query(
        `INSERT INTO event_attendees (event_id, member_id) VALUES ${placeholders}`,
        [id, ...attendee_ids]
      );
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("❌ updateEvent error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
