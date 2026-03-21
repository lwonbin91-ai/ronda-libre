# Vercel 보안 설정 가이드

## 1. 환경변수를 Sensitive로 재등록

민감한 환경변수(DB 비밀번호, JWT Secret, SMTP 비밀번호 등)는 Vercel 대시보드에서 Sensitive로 설정해야 합니다.
Sensitive로 설정하면 생성 이후 값을 다시 읽을 수 없어 유출 위험이 줄어듭니다.

### 단계별 설정

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. `ronda-libre` 프로젝트 클릭
3. 상단 **Settings** 탭 클릭
4. 좌측 메뉴에서 **Environment Variables** 클릭
5. 아래 변수들을 각각 클릭하여 **Edit** 진입:

| 변수명 | Sensitive 적용 이유 |
|--------|---------------------|
| `DATABASE_URL` | DB 접속 비밀번호 포함 |
| `NEXTAUTH_SECRET` | JWT 서명 키 |
| `SMTP_PASSWORD` | 이메일 서비스 비밀번호 |
| `ADMIN_SEED_PASSWORD` | 관리자 초기 비밀번호 (있는 경우) |

6. 각 변수 편집 화면에서 **Sensitive** 체크박스 활성화 후 **Save**
7. 저장 후 해당 변수의 값이 `***` 로 마스킹되면 완료

> **주의**: Sensitive로 변경하면 기존 값이 마스킹되어 다시 볼 수 없습니다.  
> 변경 전 반드시 비밀번호 관리자(1Password, Bitwarden 등)에 백업해두세요.

---

## 2. Preview 배포에 Vercel Authentication 적용

Preview 배포는 /admin 경로를 포함한 모든 페이지가 외부에 노출됩니다.
Vercel Authentication을 활성화하면 Preview 접속 시 비밀번호를 요구합니다.

### 단계별 설정

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. `ronda-libre` 프로젝트 클릭
3. 상단 **Settings** 탭 클릭
4. 좌측 메뉴에서 **Deployment Protection** 클릭
5. **Vercel Authentication** 섹션에서 **Preview** 토글을 **ON** 으로 변경
6. **Save** 클릭

> 이후 Preview URL 접속 시 Vercel 팀 계정 로그인이 필요하게 됩니다.  
> Production URL (ronda-libre.vercel.app)은 영향받지 않습니다.

---

## 3. 관리자 계정 생성 (DB Seed 방법)

관리자 계정은 일반 회원가입으로 만들 수 없습니다.
아래 명령어로만 생성 가능합니다.

```bash
# 로컬에서 실행
cd liga
npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed.ts
```

또는 Vercel 대시보드에서:
1. 프로젝트 → **Settings** → **Environment Variables**
2. `ADMIN_EMAIL`, `ADMIN_PASSWORD` 환경변수 추가
3. 배포 시 seed 스크립트 자동 실행 (postinstall hook)

---

## 보안 체크리스트

- [ ] DATABASE_URL → Sensitive 설정
- [ ] NEXTAUTH_SECRET → Sensitive 설정  
- [ ] SMTP_PASSWORD → Sensitive 설정
- [ ] Preview 배포 Vercel Authentication 활성화
- [ ] 관리자 계정 일반 회원가입으로 생성 불가 확인
- [ ] /admin 접근 시 관리자 권한 재검증 확인 (middleware + requireAdmin)
