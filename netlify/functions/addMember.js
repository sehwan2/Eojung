import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL
});

export async function handler(event) {
  const m = JSON.parse(event.body);

  await pool.query(
    `INSERT INTO members
    (nickname,birth_date,phone,gender,region,status,black,admin,memo)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      m.nickname, m.birth_date, m.phone, m.gender, m.region,
      m.status, m.black, m.admin, m.memo
    ]
  );

  return { statusCode: 200 };
}
