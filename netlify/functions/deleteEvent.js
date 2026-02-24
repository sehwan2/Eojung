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
    const { id } = JSON.parse(event.body);
    // event_attendees는 ON DELETE CASCADE로 자동 삭제
    await pool.query("DELETE FROM events WHERE id = $1", [id]);
    return { statusCode: 200 };
  } catch (err) {
    console.error("❌ deleteEvent error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
