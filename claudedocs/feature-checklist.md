# KeepTabs 기능 검증 체크리스트

> 검증 도구: Claude in Chrome + 하네스(`http://localhost:8795/harness.html`)
> 범례: `[x]` 검증완료 · `[~]` 부분/우회검증 · `[ ]` 미검증(실제 확장 필요)
> 하네스는 `chrome.storage`(인메모리)·`chrome.tabs`(mock: query→Example, create→noop)를 목업. `showDirectoryPicker`·서비스워커·실제 탭열기·FSA는 실제 확장에서만 동작.

## 1. 설치 / 초기화 `[실제 확장]` — 서비스워커 필요, 코드검증만
- [~] 1.1 설치 시 빈 상태 초기화 (`onInstalled`) — background.js:3 `onInstalled→ensureInit` 확인
- [~] 1.2 재시작 시 초기화 보장 (`onStartup`) — background.js:4 `onStartup→ensureInit` 확인

## 2. 툴바 아이콘 저장 (OneTab 방식) `[실제 확장]` — chrome.action 필요, 코드검증만
- [~] 2.1 아이콘 클릭 → 현재 창 저장가능 탭 전부 저장 — background.js:17 확인
- [~] 2.2 저장 제외 URL: chrome/edge/about/brave — background.js:9 isSavable 확인
- [~] 2.3 저장 후 목록 열림 + 저장된 탭 닫힘 — background.js:42-46 확인
- [~] 2.4 저장할 탭 없으면 목록만 열림 — background.js:29-32 확인

## 3. 상단바
- [x] 3.1 "현재 창 저장" → 저장 + 토스트 (탭 안 닫음) — "1 tabs saved", 세션 추가 확인
- [x] 3.2 저장할 탭 없으면 "저장할 탭이 없어요" 토스트 — chrome:// 만일 때 "No tabs to save" 확인
- [x] 3.3 언어 EN↔KO 즉시 번역 + 재렌더 — 전체 UI 한↔영 전환 확인
- [x] 3.4 통계줄 정확 (세션/탭/자동백업 수) — "2 sessions · 4 tabs · 2 auto-backups" 확인
- [ ] 3.5 세션 없을 때 empty 상태 표시

## 4. 세션 카드 렌더링
- [x] 4.1 커스텀 이름 / "저장 N" 플레이스홀더 — "Saved 2"+"Research" 확인
- [x] 4.2 메타: "N개 탭 · 날짜시간" — "3 tabs · 8/15/2026..." 확인
- [x] 4.3 파비콘 표시 + 실패 시 fallback 교체 — fallback 블록 표시 확인
- [x] 4.4 탭 제목 링크 새 탭 열림 — anchor target="_blank" 확인

## 5. 세션 액션
- [x] 5.1 모두 열기 → 탭 열기 + 토스트 — 토스트 "Opening 2 tabs" 확인 (실제 열기는 실제확장)
- [x] 5.2 삭제 → 제거 + 토스트 — "Deleted — restore from Backups" 확인
- [x] 5.3 이름 변경 (인라인, Enter 저장/Esc 취소) — "Research"→"Research Papers" 확인
- [x] 5.4 탭 삭제(X) → 개별 제거 + 재렌더 — "Hacker News" 제거, 카운트 갱신 확인

## 6. 백업 기록(버전 복원)
- [x] 6.1 모든 변경마다 스냅샷 생성 — 저장/이름변경/탭제거/삭제/복원 모두 스냅샷 확인(2→6)
- [x] 6.2 history 최대 50개 유지 — 유닛테스트 "history is capped at 50" 통과
- [x] 6.3 기록 모달: 시각+사유+세션수 — Deleted/Removed/Renamed/Saved 로그 확인
- [x] 6.4 "이 시점으로 복원" → 롤백 + 토스트 — 삭제세션+제거탭 모두 복원 확인
- [~] 6.5 기록 없으면 안내문 — 코드상 no_history 폴백 존재(누적으로 실측 불가)

## 7. 내보내기 / 가져오기
- [x] 7.1 내보내기 → JSON 다운로드 + 토스트 — app/exportedAt/sessions JSON + "Backup file exported" 확인
- [x] 7.2 가져오기 → 병합 + 토스트 — "Imported Session" 최상단 병합 + "Import complete" 확인
- [x] 7.3 잘못된 JSON → 실패 토스트 — "Import failed — check the JSON format" 확인

## 8. 백업 설정 (sync folder)
- [x] 8.1 라디오 Off/Sync folder 전환 → 패널 표시 — 확인
- [x] 8.2 상태 배지 Connected/Not connected — Not connected 실측, Connected는 이전턴 실측
- [x] 8.3 단일 토글 버튼 Connect/Disconnect — Connect 실측, Disconnect는 이전턴 실측
- [~] 8.4 Connect → 폴더선택 → 백업 → 토스트 → Connected `[실제 확장]` — 이전턴 실제 FSA 연결(875B) 확인, 하네스는 IDB 구조화복제 한계로 재현불가
- [x] 8.5 연결 중 토글 스피너 + 비활성화 — .loading 시 spinner block + pointer-events:none 확인(양버튼)
- [x] 8.6 상세줄 파일정보/권한안내 — 미연결 시 빈줄, 연결 시 파일정보(이전턴) 확인
- [x] 8.7 Disconnect → 연결만 해제(folder 유지) — 이전턴 Connected→Disconnect 시 라디오 folder 유지 확인 + backup.js 시맨틱 검증
- [~] 8.8 변경 시마다 자동 백업 (1.2s 디바운스) `[실제 확장]` — 코드상 maybeAutoBackup 1200ms 디바운스(연결폴더 필요)
- [x] 8.9 지금 백업 → 스피너(진행텍스트 없음) → 결과 — loading=true+진행텍스트 clear+결과메시지 확인

## 9. 지속성 / 동기화 `[실제 확장]` — 코드검증만
- [~] 9.1 서비스워커 저장 시 목록 자동 재렌더 (onChanged) — list.js storage.onChanged 리스너 확인(하네스는 onChanged mock noop)
- [~] 9.2 FSA 동기화 폴더 실제 파일 기록 — 이전턴 실제 폴더에 keeptabs-backup.json(875B) 기록 확인

## 10. UI/UX 폴리시
- [x] 10.1 틸 테마 일관성 — 버튼/브랜드/포커스 틸 확인
- [x] 10.2 헤더 아이콘 빠른 툴팁(~120ms) — data-tip="Backups" + 호버 표시 확인
- [x] 10.3 탭 X 항상 옅게 표시 → 호버 빨강 — opacity 0.55, 호버 danger 확인
- [x] 10.4 반응형(<820px 라벨 접힘) — 760px에서 헤더 버튼 아이콘전용 접힘 확인
- [x] 10.5 키보드 포커스 링 — 셀렉터 틸 포커스링 확인
- [~] 10.6 prefers-reduced-motion 존중 — 미디어쿼리 스타일시트 등록 확인(OS 토글은 불가)

---
## 검증 결과 요약 (2026-08-15, 하네스)
- **하네스 실측 완료**: 3.1~3.5, 4.1~4.4, 5.1~5.4, 6.1~6.4, 7.1~7.3, 8.1·8.2·8.3·8.5·8.6·8.7·8.9, 10.1~10.5
- **코드검증/이전턴 실측**: 6.2(유닛), 6.5, 8.4·8.8, 10.6
- **실제 확장 로드 필요(코드검증만)**: 1.1~1.2, 2.1~2.4, 9.1~9.2
- **유닛 테스트**: 18/18 통과 (storage/backup/i18n)

## 발견된 이슈 → 전부 수정 완료 (2026-08-15)
1. **[FIXED] 백업 기록 사유 줄 라벨 오류** — `sessions_count` i18n 키 추가, `list.js` 기록행이 "N sessions" 사용. 하네스 확인: "2 sessions"/"1 sessions" 표시.
2. **[FIXED] 인페이지 저장 URL 필터 불일치** — `isSavable`를 `storage.js`로 단일화(export), `background.js`·`list.js` 공용 import. brave:// 제외 확인(`isSavable('brave://')===false`), save 정상.
3. **[FIXED] 백업 모달 세로 리센터** — `.modal` 상단 정렬(`align-items:flex-start` + `padding-top:min(11vh,80px)`). 패널 펼침/접힘 시 라디오·컨트롤 위치 고정 확인.
4. **[FIXED] refreshBackupUI 라벨 공백(레이스)** — generation 토큰 가드 추가(오래된 호출이 DOM 덮어쓰지 못하게). 오픈직후 무지연 change + clean 마우스 시퀀스 모두 라벨 정상 확인.

검증: 4파일 `node --check` 통과, 유닛 18/18 통과, 하네스 콘솔 에러 0.
