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
      gender,
      real_name,
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
        nickname  = $1,
        gender    = $2,
        real_name = $3,
        region    = $4,
        status    = $5,
        black     = $6,
        admin     = $7,
        memo      = $8
      WHERE id = $9
      `,
      [
        nickname,
        gender,
        real_name,
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
