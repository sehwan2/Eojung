import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL
});

export async function handler(event) {
  const { member_id, enter_date, extend_days, status } = JSON.parse(event.body);

  await pool.query(
    `INSERT INTO extensions (member_id, enter_date, extend_days, status)
     VALUES ($1, $2, $3, $4)`,
    [member_id, enter_date, extend_days, status]
  );

  return { statusCode: 200 };
}
