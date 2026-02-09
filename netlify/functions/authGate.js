import { isApiPasswordValid } from "./utils/auth.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "POST 요청만 허용됩니다." })
    };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "요청 본문을 해석할 수 없습니다." })
    };
  }

  if (!isApiPasswordValid(body.password)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "비밀번호가 일치하지 않습니다." })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
}
