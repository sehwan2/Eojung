import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function handler(event) {
  const memberIdRaw = event?.queryStringParameters?.memberId;
  const filters = [];
  const values = [];
  const memberId = Number(memberIdRaw);

  if (!Number.isNaN(memberId)) {
    filters.push("e.member_id = $1");
    values.push(memberId);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const { rows } = await pool.query(`
    SELECT
      e.id,
      e.member_id,
      m.nickname,
      m.birth_date,
      m.gender,
      m.region,
      e.enter_date,
      e.extend_days,
      e.status
    FROM extensions e
    JOIN members m ON e.member_id = m.id
    ${whereClause}
    ORDER BY e.id
  `, values);

  return {
    statusCode: 200,
    body: JSON.stringify(rows)
  };
}
