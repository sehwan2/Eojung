import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL
});

export async function handler(event) {
  const memberIdRaw = event?.queryStringParameters?.memberId;
  const filters = [];
  const values = [];
  const memberId = Number(memberIdRaw);

  if (!Number.isNaN(memberId)) {
    filters.push("a.member_id = $1");
    values.push(memberId);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const { rows } = await pool.query(`
    SELECT
      a.id,
      a.member_id,
      m.nickname,
      m.birth_year,
      m.gender,
      m.region,
      a.event_datetime,
      a.host,
      a.notice_time
    FROM absences a
    JOIN members m ON a.member_id = m.id
    ${whereClause}
    ORDER BY a.event_datetime DESC
  `, values);

  return {
    statusCode: 200,
    body: JSON.stringify(rows)
  };
}
