import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL
});

export async function handler(event) {
  const {
    member_id,
    event_datetime,
    host,
    notice_time
  } = JSON.parse(event.body);

  await pool.query(
    `
    INSERT INTO absences
    (member_id, event_datetime, host, notice_time)
    VALUES ($1, $2, $3, $4)
    `,
    [member_id, event_datetime, host, notice_time]
  );

  return { statusCode: 200 };
}
