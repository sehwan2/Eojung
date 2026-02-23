# 마토모돌 백오피스 프로젝트

## 기술 스택
- Frontend: Vanilla JS (ES6 모듈), 커스텀 CSS
- Backend: Netlify Serverless Functions (Node.js)
- Database: PostgreSQL (Supabase)
- 배포: Netlify

## 배포 정보

### Supabase
- 프로젝트 ref: `bfnxucohotnkcvkreewi`
- 리전: ap-southeast-2 (시드니)
- Connection string (Transaction pooler):
  ```
  postgresql://postgres.bfnxucohotnkcvkreewi:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres
  ```
  > ⚠️ 실제 비밀번호는 Netlify 환경변수에만 저장. 여기에 기재 금지.

### Netlify 환경변수 (Site settings → Environment variables)
```
NETLIFY_DATABASE_URL = <Supabase Transaction pooler 연결 문자열>
API_PASSWORD         = <백오피스 접근 비밀번호>
```

## DB 스키마

```sql
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  nickname TEXT,
  birth_date DATE,
  phone TEXT,
  gender TEXT,
  region TEXT,
  status TEXT DEFAULT '활동',
  black BOOLEAN DEFAULT FALSE,
  admin BOOLEAN DEFAULT FALSE,
  memo TEXT
);

CREATE TABLE extensions (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id),
  enter_date DATE,
  extend_days INTEGER,
  status TEXT DEFAULT '유지'
);

CREATE TABLE absences (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id),
  event_datetime TIMESTAMPTZ,
  host TEXT,
  notice_time TEXT
);
```

## 주요 기능
- 멤버 관리 (CRUD, 상태: 활동/외출/강퇴, 블랙리스트)
- 날떼 기한 연장 관리
- 벙 불참 관리

## API 엔드포인트
| Method | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/.netlify/functions/getMembers` | ❌ | 멤버 목록 |
| POST | `/.netlify/functions/addMember` | ❌ | 멤버 추가 |
| POST | `/.netlify/functions/updateMember` | ❌ | 멤버 수정 |
| POST | `/.netlify/functions/deleteMember` | ✅ | 멤버 삭제 |
| GET | `/.netlify/functions/getExtensions` | ❌ | 연장 목록 |
| POST | `/.netlify/functions/addExtension` | ✅ | 연장 추가 |
| POST | `/.netlify/functions/deleteExtension` | ✅ | 연장 삭제 |
| GET | `/.netlify/functions/getAbsences` | ❌ | 불참 목록 |
| POST | `/.netlify/functions/addAbsence` | ✅ | 불참 추가 |
| POST | `/.netlify/functions/deleteAbsence` | ✅ | 불참 삭제 |
| POST | `/.netlify/functions/authGate` | ❌ | 비밀번호 검증 |
