# 오늘의 넌센스 퀴즈

`inAppToss_TNQ`는 앱인토스용 일일 퀴즈 프로젝트입니다. 실제 앱 소스는 `tnq-quiz/`에 있습니다. npm 패키지와 앱 설정에는 영문 소문자 식별자 `tnq-quiz`를 사용합니다.

## 실행

Windows PowerShell에서 Node.js 24 이상을 사용하세요.

```powershell
cd tnq-quiz
npm.cmd ci
npm.cmd run dev
```

Vite가 출력하는 로컬 주소를 여세요. 모바일 화면은 앱인토스 DevTools의 Viewport 또는 브라우저 반응형 모드에서 확인할 수 있습니다.

```powershell
npm.cmd run lint
npm.cmd exec -- tsc -b
npm.cmd run build
```

빌드는 Vite 웹 출력과 로컬 `.ait` 번들을 생성합니다. 콘솔 등록과 번들 업로드는 별도 단계입니다.

## 구조

- `tnq-quiz/src/App.tsx`에서 메인 퀴즈와 결과를 렌더링합니다. 공식 TDS Provider 및 Button과 함께 HTML 폼을 사용합니다.
- `tnq-quiz/src/quiz/schedule.ts`에서 서울 날짜와 공개 시간대를 계산합니다.
- `tnq-quiz/src/quiz/mockQuiz.ts`에서 샘플 문제, 채점, 브라우저 저장을 담당합니다. 추후 이 경계에 인증된 사용자와 서버 API를 연결할 수 있습니다.
- `tnq-quiz/apps-in-toss.config.ts`와 `vite.config.ts`는 공식 Web Framework와 개발 도구를 설정합니다.

공식 `create-ait-app --tds` 템플릿의 React 18, TypeScript, Vite를 사용합니다. [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/) · [공식 생성 도구](https://github.com/toss/create-ait-app)

## 수동 테스트

로컬 테스트 환경의 시계 또는 개발자 도구로 시각을 변경한 뒤 화면을 확인하세요. 화면은 1초마다 시간을 갱신합니다. 모든 시간은 한국시간입니다.

1. 05:59에는 오늘 문제 준비와 어제 결과를 표시합니다. 06:00부터 새 문제에 답안을 저장할 수 있습니다.
2. 힌트를 두 번 열고 새로고침합니다. 열린 힌트가 남고 세 번째 힌트는 요청할 수 없습니다.
3. 답안을 저장하고 수정한 뒤 새로고침해 최종 입력이 남는지 확인합니다.
4. 20:00부터 정답 확인 버튼이 표시됩니다. 확인 버튼을 누른 후 최종 정답과 채점 결과가 표시됩니다. 입력한 값은 공백까지 그대로 비교합니다.
5. 정답을 확인했을 때만 누적 횟수가 증가하며 동일 결과를 다시 열어도 중복 집계되지 않습니다. 누적 3회마다 받은 기회가 1회 늘어납니다.
6. 자정에 어제 결과를 계속 볼 수 있고, 다음 날 06:00에 새 문제로 바뀝니다. 테스트 데이터를 초기화하려면 브라우저에서 `localStorage.removeItem('tnq-quiz:mock:v1')`을 실행하고 새로고침하세요.

## 후속 범위

마이페이지, 문제 등록, 검수 상태 및 재심사 화면은 후속 구현 대상입니다. 공개 서비스에서는 서버가 시각, 정답, 누적 인정 및 등록 기회를 관리해야 합니다. 로컬 MVP의 문제와 정답은 브라우저 코드에 포함되며 기록은 브라우저별로 저장됩니다. 사용자 출제 문제는 검수 후 공개하는 흐름을 유지하고, 출시 전에 서비스 분류와 사용자 제출 콘텐츠 운영 기준을 확인해야 합니다. [앱인토스 개발자센터의 운영 정책·디자인 가이드](https://developers-apps-in-toss.toss.im/)

## Supabase 연결 준비

대상 개발 프로젝트는 `xztftqszpcaawnzqmowu`입니다.

1. `tnq-quiz`에서 `Copy-Item .env.server.example .env.server`를 실행합니다. Supabase 대시보드 **Connect**의 PostgreSQL URI를 `.env.server`의 `DATABASE_URL`에 넣습니다. IPv4 환경에서는 **Session pooler** 연결 문자열을 사용하세요. 이 파일은 Git에서 제외됩니다. [Supabase DB 연결 문서](https://supabase.com/docs/guides/database/connecting-to-postgres)
2. 같은 폴더에서 `node --env-file=.env.server server/check-db.mjs`로 연결을 확인합니다. 이 명령은 조회만 합니다.
3. 테이블을 만들 준비가 되면 Supabase SQL Editor에서 `supabase/migrations/202611210001_quiz.sql`을 실행합니다. 개발 DB에서 어제와 오늘 테스트 문제를 추가하려면 이어서 `supabase/seed.sql`을 실행합니다.
4. 연결 확인 명령을 다시 실행하면 세 테이블의 생성 여부를 확인할 수 있습니다.

`server/quiz.mjs`는 서버에서 검증한 사용자 식별자를 받아 답안 저장·수정, 힌트 열기, 정답 확인 및 집계를 처리하는 PostgreSQL 모듈입니다. 문제별 정답은 서버에서만 읽고, 결과 확인 요청을 성공적으로 처리한 뒤 반환합니다. 사용자 세션을 확인하는 HTTP API와 React 화면 연결은 후속 단계입니다. 현재 화면은 계속 기존 Mock으로 동작합니다.
