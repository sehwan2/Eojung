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
  const storedEventDate = normalizeDateToNoon(event_datetime);

  await pool.query(
    `
    INSERT INTO absences
    (member_id, event_datetime, host, notice_time)
    VALUES ($1, $2, $3, $4)
    `,
    [member_id, storedEventDate, host, notice_time]
  );

  return { statusCode: 200 };
}
function normalizeDateToNoon(rawValue) {
  if (!rawValue) return null;
  const parsed = rawValue.split("-");
  if (parsed.length < 3) return null;
  const year = Number(parsed[0]);
  const month = Number(parsed[1]) - 1;
  const day = Number(parsed[2]);
  if ([year, month, day].some(v => Number.isNaN(v))) return null;
  return new Date(Date.UTC(year, month, day, 12, 0, 0)).toISOString();
}
