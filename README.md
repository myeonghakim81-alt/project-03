# Escape: The Ashford File (초안)

기획서(`ESCAPE: THE ASHFORD FILE — 게임 기획안 v0.1`) 기준 Phase 1 범위 — **FILE 01~02, 코어 루프·타이머·점수 시스템** — 를 구현한 웹 방탈출 게임 프로토타입.

## 실행 방법

```bash
npm install
npm run dev
```

## 지금까지 구현된 것

- **코어 루프**: 스테이지 선택 → 난이도 선택(Easy/Medium/Hard) → 타이머 진행 → 3가지 탈출 경로(정석/히든/얼터너티브) → 결과 & 하이스코어
- **FILE NO.01 서재**, **FILE NO.02 온실** 2개 스테이지 플레이 가능. 나머지 FILE 03~10은 로드맵을 보여주기 위한 "Coming Soon" 상태
- 방마다 Phaser Graphics로 그린 실제 2D 벡터 일러스트 배경(책장·창문·책상·벽난로 / 화분·온도조절기·배관 등)이 있고, 그 위에 클릭 가능한 오브젝트로 각 경로를 조사·해결
- 난이도별로 경로 안내 노출 수준이 다름: Easy는 3경로 모두 금색 테두리로 표시, Medium은 정석 경로만 표시, Hard는 아무 표시 없이 순수 탐색으로 찾아야 함(기획서 5장)
- 난이도별 제한시간 배율·힌트 횟수·오답/함정 페널티·점수 배율을 기획서 5장 수치 그대로 반영
- 하드 난이도 전용 경로별 점수 배율(정석 ×1.0 / 히든 ×1.3 / 얼터너티브 ×1.6, 기획서 8장) 반영
- 점수 계산식(7장) 그대로 구현: `ROUND((1000 + 잔여시간×10 − 힌트×150) × 난이도배율 × 경로배율)`
- 스테이지×난이도별 개인 최고 기록(30개 리더보드) + 종합 랭킹 합산을 `localStorage`에 저장
- 하드 난이도 힌트는 "리워드 광고 시청" 흐름을 확인창으로 시뮬레이션 (실제 광고 SDK는 미연동)

## 아직 없는 것 (다음 단계)

- FILE 03~10 나머지 8개 방 콘텐츠
- 사운드/음악, 연출 애니메이션
- 리워드 광고 SDK, 스토어 결제 등 실제 수익화 연동
- Capacitor 앱 포팅, 서버 기반 글로벌 랭킹

## 기술 스택

기획서 10장 로드맵대로 Phaser 3 + TypeScript + Vite. 하이스코어는 LocalStorage에 저장.

## 프로젝트 구조

```
src/
  data/
    stages.ts       # 스테이지(방) 데이터 — 정석/히든/얼터너티브 경로 정의
    difficulty.ts   # 난이도별 배율/힌트/페널티 설정
  systems/
    score.ts        # 점수 계산 공식
    save.ts         # localStorage 하이스코어 저장/조회
  scenes/
    StageSelectScene.ts
    DifficultySelectScene.ts
    RoomScene.ts       # 실제 방 탈출 플레이
    ResultScene.ts
    roomArt.ts         # 방별 2D 벡터 일러스트 + 오브젝트 위치(hotspot) 정의
  types.ts
```
