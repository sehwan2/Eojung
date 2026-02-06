import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function handler(event) {
  try {
    const {
      id,
      nickname,
      region,
      status,
      black,
      admin,
      memo
    } = JSON.parse(event.body);

    if (!id) {
      return {
        statusCode: 400,
        body: "Missing member id"
      };
    }

    await pool.query(
      `
      UPDATE members
      SET
        nickname = $1,
        region   = $2,
        status   = $3,
        black    = $4,
        admin    = $5,
        memo     = $6
      WHERE id = $7
      `,
      [
        nickname,
        region,
        status,
        black,
        admin,
        memo,
        id
      ]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error("❌ updateMember error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to update member" })
    };
  }
}
