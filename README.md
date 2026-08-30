# 이미지 검색웹 (1단계 프로토타입)

텍스트로 설명하면 Google Custom Search API로 웹 이미지를 검색해 보여주는 프로토타입입니다.
자세한 기획은 프로젝트 기획안(이미지 검색웹 기획안 요약본)을 참고하세요.

## 로드맵

1. **Google Custom Search 텍스트 검색 프로토타입** ← 현재 단계
2. AI 재순위화 레이어 추가
3. Bing / Openverse 등 소스 추가 통합
4. 이미지 업로드(역이미지) 검색 추가
5. UI 완성도(필터, 라이선스 표시 등) 다듬기

## API 키 발급 방법

이 프로젝트는 Google Programmable Search Engine(Custom Search JSON API)을 사용합니다. 아래 두 가지를 직접 발급받아야 합니다.

### 1) API 키 발급

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트를 생성(또는 선택)합니다.
2. 좌측 메뉴에서 **API 및 서비스 → 라이브러리**로 이동해 **Custom Search API**를 검색해 사용 설정합니다.
3. **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → API 키**를 클릭해 키를 발급받습니다.
4. (권장) 발급된 키는 "API 제한사항"에서 Custom Search API로만 사용하도록 제한해 두세요.

무료 할당량은 하루 100회 쿼리이며, 초과 시 유료로 전환됩니다(기획안 기준 개인 사용 목적으로는 충분).

### 2) 검색엔진(CX) ID 발급

1. [Programmable Search Engine](https://programmablesearchengine.google.com/)에 접속해 **새 검색엔진 추가**를 클릭합니다.
2. 검색 대상을 "전체 웹 검색"으로 설정합니다.
3. 생성 후 해당 검색엔진의 **설정 → 기본사항**에서 **이미지 검색** 옵션을 켭니다.
4. **검색엔진 ID**(cx 값)를 복사합니다.

### 3) 환경변수 설정

`.env.example`을 복사해 `.env.local`을 만들고 값을 채워주세요.

```bash
cp .env.example .env.local
```

```
GOOGLE_CSE_API_KEY=발급받은_API_키
GOOGLE_CSE_CX=발급받은_검색엔진_ID
```

`.env.local`은 `.gitignore`에 포함되어 있어 커밋되지 않습니다.

## 실행 방법

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 검색어를 입력하면 `/api/search` 라우트가 서버에서 Google Custom Search API를 호출해 이미지 결과를 반환합니다. API 키는 서버 사이드에서만 사용되며 브라우저에 노출되지 않습니다.
