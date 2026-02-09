import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL
});

export async function handler(event) {
  const { member_id, enter_date, extend_days, status } = JSON.parse(event.body);
  const storedEnterDate = normalizeDateToNoon(enter_date);

  await pool.query(
    `INSERT INTO extensions (member_id, enter_date, extend_days, status)
     VALUES ($1, $2, $3, $4)`,
    [member_id, storedEnterDate, extend_days, status]
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
  const date = new Date(Date.UTC(year, month, day, 12, 0, 0));
  return date.toISOString();
}
