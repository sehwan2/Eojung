const PASSWORD_ENV = process.env.API_PASSWORD || process.env.BACKOFFICE_PASSWORD;

export function isApiPasswordValid(provided) {
  if (!PASSWORD_ENV || !provided) return false;
  return provided === PASSWORD_ENV;
}

export function requireApiPassword(event) {
  if (!PASSWORD_ENV) {
    throw new Error("API_PASSWORD 환경 변수가 설정되어 있지 않습니다.");
  }

  const headers = event?.headers || {};
  const provided =
    headers["x-api-password"] ||
    headers["X-API-PASSWORD"] ||
    headers["authorization"] ||
    headers["Authorization"];

  if (!isApiPasswordValid(provided)) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "비밀번호가 일치하지 않습니다."
      })
    };
  }

  return null;
}
