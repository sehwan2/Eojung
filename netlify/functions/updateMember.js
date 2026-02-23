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
      birth_date,
      phone,
      gender,
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
        nickname   = $1,
        birth_date = $2,
        phone      = $3,
        gender     = $4,
        region     = $5,
        status     = $6,
        black      = $7,
        admin      = $8,
        memo       = $9
      WHERE id = $10
      `,
      [
        nickname,
        birth_date,
        phone,
        gender,
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
