# api server docs - api v1

## 목차

## base url
- https://api.solidloop-studio.xyz/api/v1

## Admin
  - authorization 부분에 supabase jwt토큰을 필수로 넣어야 함.

### Crawler
#### [GET] /admin/crawler/health
- 크롤러 채널별로 health 상태를 반환합니다.

- response schema
```ts
{
    channels:{id: string, healthy: boolean}[]
}
```

#### [POST] /admin/crawler/session
- 크롤러의 세션 정보를 저장합니다.

- Request body
```ts
{
  channelId: string,
  jwtToken: string,
  refreshToken: string
}
```

- response schema
```ts
  { message: 'Session saved successfully' }
```


### Logs
#### [GET] /admin/logs/api-server
- api-server의 로그 조회

- Parameters
  - date: 조회할 로그의 날짜 (형식 YYYY-MM-DD, 기본값 오늘 날짜)
  
- Response
  - text/plain

#### [GET] /admin/logs/crawler
- crawlwe의 로그 조회

- Parameters
  - date: 조회할 로그의 날짜 (형식 YYYY-MM-DD, 기본값 오늘 날짜)
  
- Response
  - text/plain

## User
### [GET] /profile/total
- 등록된 총 사용자 수 조회

#### Response
```ts
{
  data: {
    totalUsers: number
  },
  status: 200
}
```

### [GET] /profile/:query
- 유저 프로필 조회

- Parameters
  - query: string / 닉네임 또는 사용자 ID
  - type: string / 쿼리의 유형 (닉네임 또는 사용자 ID) / Available values : nick, id

Response
- code 200
```ts
{
    data:{
        user: {
            id: string,
            nickname: string,
            exp: number,
            observedAt: string, // iso format
            exordial: string,
            level: number
        },
        equipment: {
            userId: string,
            slot: string,
            itemId: string
        }[],
        record: {
            id: string,
            userId: string,
            modeId: string,
            total: number,
            win: number,
            exp: number,
            playtime: number // ms
        }[],
        presence: {
            userId: string,
            channelId: string | null,
            roomId: string | null,
            crawlerId: string,
            updatedAt: string // ios format
        }
    },
    status: 200
}
```
- code 404
등록된 유저가 아님.


## Item
### [GET] /item
- 아이템 정보 조회

Parameters:
- query: 조회할 아이템 ID들 (쉼표로 구분)

Response:
```ts
{
    data: {
        id: string,
        name: string,
        description: string,
        updatedAt: number,
        group: string,
        options: {
            gEXP?: number, // 획득 경험치
            hEXP?: number, // 분당 추가 경험치
            gMNY?: number, // 획득 핑
            hMNY?: number, // 분당 추가 핑
            [key: string]: number
        }
    },
    status: 200
}
```

## Mode
### [GET] /mode
- 모드 전체 정보 조회

Response:
```ts
{
    data: {
        modeId: string,
        modeName: string,
        group: string
    }[],
    status: 200
}
```

## Ranking
### [GET] /ranking/:mode
- 모드에 맞는 랭킹 조회

Parameters:
- mode: 랭킹을 조회할 모드 ID
- page: 페이지 번호 (기본값 1)

Response:
```ts
{
    data:{
        rank: number,
        userRecord: {
            id: number,
            userId: string,
            modeId: string,
            total: number,
            win: number,
            exp: number,
            playtime: number
        },
        userInfo: {
            id: string,
            nickname: string,
            exp: number,
            observedAt: string, // iso format
            exordial: string,
            level: number
        }
    },
    status: 200
}
```