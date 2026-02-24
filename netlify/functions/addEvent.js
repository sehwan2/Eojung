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
    const { title, host_member_id, event_datetime, location, attendee_ids } = JSON.parse(event.body);

    const { rows } = await pool.query(
      `INSERT INTO events (title, host_member_id, event_datetime, location)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [title, host_member_id || null, event_datetime || null, location]
    );

    const eventId = rows[0].id;

    if (Array.isArray(attendee_ids) && attendee_ids.length > 0) {
      const placeholders = attendee_ids.map((_, i) => `($1, $${i + 2})`).join(", ");
      await pool.query(
        `INSERT INTO event_attendees (event_id, member_id) VALUES ${placeholders}`,
        [eventId, ...attendee_ids]
      );
    }

    return { statusCode: 200, body: JSON.stringify({ id: eventId }) };
  } catch (err) {
    console.error("❌ addEvent error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
