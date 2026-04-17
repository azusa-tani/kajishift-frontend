# KAJISHIFT フロントエンド — データフロー図（DFD・デマルコ式）

本ドキュメントはブラウザ上の KAJISHIFT フロントエンドを対象とした DFD です。Mermaid で記述しています。

## 記号（デマルコ式と Mermaid の対応）

| デマルコ式 | Mermaid での表現 |
|-----------|------------------|
| 源泉・吸収 | 角長方形 `[テキスト]`（青系スタイル） |
| プロセス | `((番号\n名称))`（橙系） |
| データストア | `[(名称)]` ＋太枠（紫系）※二重線の近似 |
| データフロー | 矢印＋`|ラベル|`（データ名のみ） |
| 外部システム | `BE[...]`（緑系） |

実行順序は表しません。プロセス番号は階層（0 → 1.x → 1.x.y）に対応します。

**目次**: レベル0（コンテキスト） → レベル1 → レベル2（1.3 / 1.5 / 1.6 / 1.7） → **顧客説明用（運営管理者）** → 実装対応・書き出し手順

---

## レベル0：コンテキスト図

```mermaid
%%{init: {"flowchart": {"htmlLabels": true}, "themeCSS": ".edgeLabel { font-size: 11px; }"}}%%
flowchart TB
  classDef entity fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
  classDef process fill:#FFF8E1,stroke:#E65100,stroke-width:2px,color:#BF360C
  classDef backend fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
  classDef boundary fill:#FAFAFA,stroke:#9E9E9E,stroke-width:2px,stroke-dasharray: 6 4

  subgraph boundary0["対象システム境界"]
    class boundary0 boundary
    P0(("0\nKAJISHIFT フロントエンド\n（ブラウザアプリ）"))
    class P0 process
  end

  V[一般訪問者]
  C[依頼者]
  W[ワーカー]
  A[管理者]
  BE[KAJISHIFT バックエンド\nREST API・Socket.IO]

  class V,C,W,A entity
  class BE backend

  V -->|"公開ページ参照要求"| P0
  P0 -->|"静的ページ・スタイル資源"| V

  C -->|"認証・登録に関する送信データ"| P0
  C -->|"予約・決済・メッセージ等の業務送信データ"| P0
  P0 -->|"認証結果・ユーザー属性の表示用データ"| C
  P0 -->|"予約・ワーカー・通知等の参照結果データ"| C

  W -->|"認証に関する送信データ"| P0
  W -->|"案件・スケジュール等の業務送信データ"| P0
  P0 -->|"認証結果・ユーザー属性の表示用データ"| W
  P0 -->|"予約・報酬・通知等の参照結果データ"| W

  A -->|"認証に関する送信データ"| P0
  A -->|"管理業務の入力データ"| P0
  P0 -->|"認証結果・ユーザー属性の表示用データ"| A
  P0 -->|"ユーザー・マスタ・集計の参照結果データ"| A

  P0 <-->|"HTTP JSON リクエスト・レスポンス"| BE
  P0 <-->|"Socket.IO イベントペイロード"| BE
```

---

## レベル1：フロントエンド分解図

```mermaid
%%{init: {"flowchart": {"htmlLabels": true}}}%%
flowchart TB
  classDef entity fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
  classDef process fill:#FFF8E1,stroke:#E65100,stroke-width:2px,color:#BF360C
  classDef datastore fill:#F3E5F5,stroke:#6A1B9A,stroke-width:5px,color:#4A148C
  classDef backend fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20
  classDef febox fill:#FFFDE7,stroke:#F9A825,stroke-width:1px,stroke-dasharray: 4 3

  subgraph users["源泉・吸収"]
    direction TB
    V[一般訪問者]
    C[依頼者]
    W[ワーカー]
    A[管理者]
  end
  class V,C,W,A entity

  subgraph FE["フロントエンド（対象システム）"]
    class FE febox
    direction TB
    subgraph row1[" "]
      direction LR
      P1((1.1\n認証トークン・ユーザー属性の\n取得とキャッシュ))
      P2((1.2\n静的・公開画面の配信))
      P3((1.3\n予約データの送受信))
    end
    subgraph row2[" "]
      direction LR
      P4((1.4\nワーカー・サービス・エリア等の\n検索送受信))
      P5((1.5\nメッセージ・通知の\n送受信))
      P6((1.6\n決済・ファイル・レビュー・\nお気に入りの送受信))
      P7((1.7\n管理者向けマスタ・\n集計データの送受信))
    end
  end
  class P1,P2,P3,P4,P5,P6,P7 process

  D1[(D1 認証トークン・ユーザー属性キャッシュ\nブラウザ localStorage)]
  class D1 datastore

  BE[KAJISHIFT バックエンド\nREST・Socket.IO]
  class BE backend

  V -->|"公開ページ参照要求"| P2
  P2 -->|"静的マークアップ・スタイル資源"| V

  C -->|"登録・ログイン入力データ"| P1
  C -->|"予約操作入力データ"| P3
  C -->|"ワーカー検索条件・選定入力"| P4
  C -->|"メッセージ送信内容"| P5
  C -->|"決済・カード・ファイル・レビュー入力"| P6
  P1 -->|"認証結果・エラー表示用データ"| C
  P3 -->|"予約一覧・詳細の表示用データ"| C
  P4 -->|"ワーカー・予約画面向け検索結果"| C
  P5 -->|"スレッド・通知の表示用データ"| C
  P6 -->|"決済・ファイル一覧の表示用データ"| C

  W -->|"登録・ログイン入力データ"| P1
  W -->|"案件・カレンダー・プロフィール操作入力"| P3
  W -->|"チャット送信内容"| P5
  W -->|"報酬・ファイル参照条件"| P6
  P1 -->|"認証結果・エラー表示用データ"| W
  P3 -->|"案件・予定の表示用データ"| W
  P5 -->|"メッセージ・通知の表示用データ"| W
  P6 -->|"報酬・ファイルの表示用データ"| W

  A -->|"管理者ログイン入力データ"| P1
  A -->|"ユーザー・ワーカー・チケット等の管理入力"| P7
  P1 -->|"認証結果・エラー表示用データ"| A
  P7 -->|"管理画面向け一覧・詳細・設定の表示用データ"| A

  P1 <-->|"認証系 HTTP リクエスト・レスポンス"| BE
  P3 <-->|"予約系 HTTP リクエスト・レスポンス"| BE
  P4 <-->|"ワーカー・レビュー・エリア等 HTTP リクエスト・レスポンス"| BE
  P5 <-->|"メッセージ・通知 HTTP リクエスト・レスポンス"| BE
  P5 <-->|"Socket.IO イベントペイロード"| BE
  P6 <-->|"決済・ファイル・お気に入り HTTP リクエスト・レスポンス"| BE
  P7 <-->|"管理・マスタ・レポート HTTP リクエスト・レスポンス"| BE

  P1 -->|"トークン文字列・ユーザー属性 JSON"| D1
  D1 -->|"保存済みトークン・ユーザー属性 JSON"| P1
  D1 -->|"Authorization 付与用トークン"| P3
  D1 -->|"Authorization 付与用トークン"| P4
  D1 -->|"Authorization 付与用トークン"| P5
  D1 -->|"Authorization 付与用トークン"| P6
  D1 -->|"Authorization 付与用トークン"| P7
```

**補足:** 実装では `ApiClient.request` がトークンを一括参照しますが、図では業務プロセスごとの論理参照として D1 から各プロセスへ矢印を引いています。

---

## レベル2：プロセス 1.3「予約データの送受信」の分解

```mermaid
%%{init: {"flowchart": {"htmlLabels": true}}}%%
flowchart LR
  classDef entity fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
  classDef process fill:#FFF8E1,stroke:#E65100,stroke-width:2px,color:#BF360C
  classDef datastore fill:#F3E5F5,stroke:#6A1B9A,stroke-width:5px,color:#4A148C
  classDef backend fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20

  C[依頼者]
  W[ワーカー]
  class C,W entity

  subgraph inner["1.3 の下位プロセス"]
    direction TB
    P31((1.3.1\n予約一覧・期間条件の\n照会整形))
    P32((1.3.2\n単一予約詳細の\n照会整形))
    P33((1.3.3\n予約新規・変更・\nキャンセル要求の整形))
    P34((1.3.4\n予約状態更新要求の\n整形))
  end
  class P31,P32,P33,P34 process

  D1[(D1 認証トークン・ユーザー属性キャッシュ)]
  class D1 datastore
  BE[KAJISHIFT バックエンド REST]
  class BE backend

  C -->|"一覧・検索の入力条件"| P31
  C -->|"詳細画面の識別子"| P32
  C -->|"新規・変更・キャンセル入力項目"| P33
  W -->|"一覧・カレンダー用の期間条件"| P31
  W -->|"詳細画面の識別子"| P32
  W -->|"承諾・辞退・完了操作の識別子・理由"| P34

  P31 -->|"予約一覧の表示用データ"| C
  P31 -->|"案件一覧の表示用データ"| W
  P32 -->|"予約詳細の表示用データ"| C
  P32 -->|"案件詳細の表示用データ"| W
  P33 -->|"登録・更新結果の表示用データ"| C
  P34 -->|"状態更新結果の表示用データ"| W

  D1 -->|"Authorization 付与用トークン"| P31
  D1 -->|"Authorization 付与用トークン"| P32
  D1 -->|"Authorization 付与用トークン"| P33
  D1 -->|"Authorization 付与用トークン"| P34

  P31 <-->|"予約クエリ・予約コレクション JSON"| BE
  P32 <-->|"予約ID・単一予約 JSON"| BE
  P33 <-->|"予約作成・更新・キャンセル JSON"| BE
  P34 <-->|"承諾・辞退・完了 JSON"| BE
```

---

## レベル2：プロセス 1.5「メッセージ・通知の送受信」の分解

```mermaid
%%{init: {"flowchart": {"htmlLabels": true}}}%%
flowchart TB
  classDef entity fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
  classDef process fill:#FFF8E1,stroke:#E65100,stroke-width:2px,color:#BF360C
  classDef datastore fill:#F3E5F5,stroke:#6A1B9A,stroke-width:5px,color:#4A148C
  classDef backend fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20

  C[依頼者]
  W[ワーカー]
  class C,W entity

  P51((1.5.1\nREST によるメッセージ履歴・\n通知一覧の取得))
  P52((1.5.2\nREST によるメッセージ送信・\n既読更新の整形))
  P53((1.5.3\nSocket 接続と\nプッシュイベントの受信))
  class P51,P52,P53 process

  D1[(D1 認証トークン・ユーザー属性キャッシュ)]
  class D1 datastore
  BE_HTTP[バックエンド REST]
  BE_WS[バックエンド Socket.IO]
  class BE_HTTP,BE_WS backend

  C -->|"スレッド・ページング条件"| P51
  W -->|"スレッド・ページング条件"| P51
  P51 -->|"メッセージ履歴・通知の表示用データ"| C
  P51 -->|"メッセージ履歴・通知の表示用データ"| W

  C -->|"送信メッセージ本文・予約ID"| P52
  W -->|"送信メッセージ本文・予約ID"| P52
  P52 -->|"送信結果・既読状態の表示用データ"| C
  P52 -->|"送信結果・既読状態の表示用データ"| W

  C -->|"接続に用いるトークン"| P53
  W -->|"接続に用いるトークン"| P53
  P53 -->|"通知・未読件数・メッセージの表示用データ"| C
  P53 -->|"通知・未読件数・メッセージの表示用データ"| W

  D1 -->|"Authorization 付与用トークン"| P51
  D1 -->|"Authorization 付与用トークン"| P52
  D1 -->|"接続資格の参照用トークン"| P53

  P51 <-->|"メッセージ・通知 HTTP JSON"| BE_HTTP
  P52 <-->|"送信・既読 HTTP JSON"| BE_HTTP
  P53 <-->|"Socket.IO イベントペイロード"| BE_WS
```

---

## レベル2：プロセス 1.6「決済・ファイル・レビュー・お気に入りの送受信」の分解

依頼者・ワーカーがそれぞれの画面から扱う付帯業務を、API の責務に沿って分割しています。

```mermaid
%%{init: {"flowchart": {"htmlLabels": true}}}%%
flowchart TB
  classDef entity fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
  classDef process fill:#FFF8E1,stroke:#E65100,stroke-width:2px,color:#BF360C
  classDef datastore fill:#F3E5F5,stroke:#6A1B9A,stroke-width:5px,color:#4A148C
  classDef backend fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20

  C[依頼者]
  W[ワーカー]
  class C,W entity

  subgraph inner["1.6 の下位プロセス"]
    direction LR
    P61((1.6.1\n決済・カード・\n領収関連データの送受信))
    P62((1.6.2\nファイルデータの\n送受信))
    P63((1.6.3\nレビュー・お気に入り\nデータの送受信))
    P64((1.6.4\nサポートチケット\nデータの送受信))
  end
  class P61,P62,P63,P64 process

  D1[(D1 認証トークン・ユーザー属性キャッシュ)]
  class D1 datastore
  BE[KAJISHIFT バックエンド REST]
  class BE backend

  C -->|"決済・カード登録・領収希望の入力"| P61
  C -->|"アップロード・削除・参照条件"| P62
  C -->|"評価・お気に入り操作の入力"| P63
  C -->|"問い合わせ・チケットの入力"| P64

  W -->|"報酬・支払い参照条件"| P61
  W -->|"提出ファイルの送受信条件"| P62
  W -->|"評価参照条件"| P63
  W -->|"チケット参照・追記の入力"| P64

  P61 -->|"決済状況・カード一覧・領収用データ"| C
  P61 -->|"報酬・支払いの表示用データ"| W
  P62 -->|"ファイル一覧・ダウンロード用データ"| C
  P62 -->|"ファイル一覧・ダウンロード用データ"| W
  P63 -->|"レビュー・お気に入りの表示用データ"| C
  P63 -->|"評価の表示用データ"| W
  P64 -->|"チケット一覧・詳細の表示用データ"| C
  P64 -->|"チケット一覧・詳細の表示用データ"| W

  D1 -->|"Authorization 付与用トークン"| P61
  D1 -->|"Authorization 付与用トークン"| P62
  D1 -->|"Authorization 付与用トークン"| P63
  D1 -->|"Authorization 付与用トークン"| P64

  P61 <-->|"決済・カード・領収 HTTP JSON"| BE
  P62 <-->|"ファイルメタ・バイナリ参照 HTTP"| BE
  P63 <-->|"レビュー・お気に入り HTTP JSON"| BE
  P64 <-->|"サポートチケット HTTP JSON"| BE
```

---

## レベル2：プロセス 1.7「管理者向けマスタ・集計データの送受信」の分解

運営が管理画面から行う操作を、バックエンドの管理系 API に対応させて分割しています（7 プロセス以内）。

```mermaid
%%{init: {"flowchart": {"htmlLabels": true}}}%%
flowchart TB
  classDef entity fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
  classDef process fill:#FFF8E1,stroke:#E65100,stroke-width:2px,color:#BF360C
  classDef datastore fill:#F3E5F5,stroke:#6A1B9A,stroke-width:5px,color:#4A148C
  classDef backend fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20

  A[管理者]
  class A entity

  subgraph inner["1.7 の下位プロセス"]
    direction TB
    subgraph r1[" "]
      direction LR
      P71((1.7.1\n依頼者ユーザー\nデータの送受信))
      P72((1.7.2\nワーカー登録・\nアカウントの送受信))
      P73((1.7.3\n予約・売上・利用状況\nレポートの照会))
    end
    subgraph r2[" "]
      direction LR
      P74((1.7.4\nシステム設定\nデータの送受信))
      P75((1.7.5\nサービスメニュー・\n対応エリアの送受信))
      P76((1.7.6\nサポートチケット\n運用データの送受信))
      P77((1.7.7\n集計帳票ファイル\nの取得))
    end
  end
  class P71,P72,P73,P74,P75,P76,P77 process

  D1[(D1 認証トークン・ユーザー属性キャッシュ)]
  class D1 datastore
  BE[KAJISHIFT バックエンド REST]
  class BE backend

  A -->|"依頼者検索・更新・削除の入力"| P71
  A -->|"ワーカー検索・承認・更新の入力"| P72
  A -->|"レポート期間・種別の指定"| P73
  A -->|"システム設定の入力"| P74
  A -->|"メニュー・エリアの登録・変更入力"| P75
  A -->|"チケット対応・削除の入力"| P76
  A -->|"出力形式・条件の指定"| P77

  P71 -->|"依頼者一覧・詳細の表示用データ"| A
  P72 -->|"ワーカー一覧・詳細の表示用データ"| A
  P73 -->|"集計結果・ダッシュボード用データ"| A
  P74 -->|"現在の設定の表示用データ"| A
  P75 -->|"マスタ一覧の表示用データ"| A
  P76 -->|"チケット一覧・詳細の表示用データ"| A
  P77 -->|"CSV・Excel ファイルデータ"| A

  D1 -->|"Authorization 付与用トークン"| P71
  D1 -->|"Authorization 付与用トークン"| P72
  D1 -->|"Authorization 付与用トークン"| P73
  D1 -->|"Authorization 付与用トークン"| P74
  D1 -->|"Authorization 付与用トークン"| P75
  D1 -->|"Authorization 付与用トークン"| P76
  D1 -->|"Authorization 付与用トークン"| P77

  P71 <-->|"管理ユーザー HTTP JSON"| BE
  P72 <-->|"管理ワーカー HTTP JSON"| BE
  P73 <-->|"各種レポート HTTP JSON"| BE
  P74 <-->|"システム設定 HTTP JSON"| BE
  P75 <-->|"サービス・エリア HTTP JSON"| BE
  P76 <-->|"管理チケット HTTP JSON"| BE
  P77 <-->|"帳票バイナリ・ダウンロード応答"| BE
```

---

## 顧客説明用：運営管理者の操作とデータの流れ

**読み手**: システム概要を把握する依頼主・ステークホルダ向け。技術用語を減らし、運営側の業務イメージが伝わるようにしています。記号の意味は冒頭の対応表と同じです。

**補足**: 「ログイン状態の記憶」は、ブラウザの所定領域（図では D1）に、サーバーが発行した**ログイン識別子**と**画面表示に必要な運営者属性**を保存するイメージです。パスワードそのものをアプリが保存する図ではありません。

```mermaid
%%{init: {"flowchart": {"htmlLabels": true}}}%%
flowchart LR
  classDef entity fill:#E1F5FE,stroke:#0277BD,stroke-width:2px,color:#01579B
  classDef process fill:#FFF3E0,stroke:#EF6C00,stroke-width:2px,color:#E65100
  classDef datastore fill:#F3E5F5,stroke:#7B1FA2,stroke-width:5px,color:#4A148C
  classDef backend fill:#E8F5E9,stroke:#388E3C,stroke-width:2px,color:#1B5E20
  classDef febox fill:#FFFDE7,stroke:#F9A825,stroke-width:1px,stroke-dasharray: 4 3

  OP[運営管理者]
  class OP entity

  subgraph screen["KAJISHIFT 管理画面（ブラウザ上）"]
    class screen febox
    direction TB
    PA1((A.1\nログイン情報の確認と\nログイン状態の記憶))
    PA2((A.2\n売上・予約の状況\n把握用データの参照))
    PA3((A.3\n依頼者・ワーカー\n情報の確認・更新))
    PA4((A.4\nサービス内容・対応地域など\n運用ルールの設定))
    PA5((A.5\nお問い合わせ内容の\n確認・対応記録))
    PA6((A.6\n帳票・一覧の\nダウンロード))
  end
  class PA1,PA2,PA3,PA4,PA5,PA6 process

  D1[(D1\nログイン状態・\n運営者表示用属性\n（端末内の所定領域）)]
  class D1 datastore

  SRV[KAJISHIFT サーバー\n（業務データの正本）]
  class SRV backend

  OP -->|"ログイン用の ID・パスワード"| PA1
  OP -->|"知りたい期間・種類の指定"| PA2
  OP -->|"確認・承認・修正の内容"| PA3
  OP -->|"メニュー名・地域・料金などの入力"| PA4
  OP -->|"返信・ステータスなどの入力"| PA5
  OP -->|"欲しい帳票の種類・条件"| PA6

  PA1 -->|"ログイン結果・エラー内容の表示"| OP
  PA2 -->|"数字・一覧などの把握用画面データ"| OP
  PA3 -->|"利用者・ワーカー情報の画面データ"| OP
  PA4 -->|"現在の設定の画面データ"| OP
  PA5 -->|"問い合わせ一覧・詳細の画面データ"| OP
  PA6 -->|"Excel・CSV などのファイル"| OP

  PA1 <-->|"認証の問い合わせ・結果"| SRV
  PA2 <-->|"集計・ダッシュボード用データ"| SRV
  PA3 <-->|"利用者・ワーカーに関するデータ"| SRV
  PA4 <-->|"運用マスタのデータ"| SRV
  PA5 <-->|"問い合わせチケットのデータ"| SRV
  PA6 <-->|"帳票ファイルのデータ"| SRV

  PA1 -->|"ログイン識別子・表示用属性"| D1
  D1 -->|"保存済みログイン識別子"| PA1
  D1 -->|"認証に必要な識別子"| PA2
  D1 -->|"認証に必要な識別子"| PA3
  D1 -->|"認証に必要な識別子"| PA4
  D1 -->|"認証に必要な識別子"| PA5
  D1 -->|"認証に必要な識別子"| PA6
```

---

## 実装との対応（参照）

| 論理 | 主な実装 |
|------|-----------|
| D1 | `localStorage` の `token` / `user`、`js/api.js` の `ApiClient` |
| 1.1 | `register` / `login` / `getMe` / `clearToken` 等、`js/auth.js` |
| 1.5・Socket | `js/socket.js`、顧客の `dashboard.html` / `notifications.html` / `chat.html` |
| 1.6.1 | `getPayments` / `createPayment` / `processPayment` / `getCards` / `addCard` / `updateCard` / `deleteCard` / `downloadReceipt` |
| 1.6.2 | `uploadFile` / `getFiles` / `getFileById` / `downloadFile` / `deleteFile` |
| 1.6.3 | `createReview` / `getReviewsByWorkerId` / `getFavorites` / `addFavorite` / `removeFavorite` / `checkFavorite` |
| 1.6.4 | `getSupportTickets` / `createSupportTicket` / `getSupportTicketById`（依頼者・ワーカー向け） |
| 1.7.1 | `getAdminUsers` / `updateUser` / `deleteUser` / `registerAdmin` |
| 1.7.2 | `getAdminWorkers` / `approveWorker` / `updateWorker` / `deleteWorker` |
| 1.7.3 | `getAdminBookingReport` / `getAdminRevenueReport` / `getAdminUserReport` / `getAdminWorkerReport` |
| 1.7.4 | `getSystemSettings` / `updateSystemSettings` |
| 1.7.5 | `getServiceMenus` / `createServiceMenu` / `updateServiceMenu` / `deleteServiceMenu` / `getAreas` / `createArea` / `updateArea` / `deleteArea` |
| 1.7.6 | `getSupportTickets` / `getSupportTicketById` / `updateSupportTicket` / `deleteSupportTicket` |
| 1.7.7 | `downloadCSV` / `downloadExcel` |
| 顧客説明用 A.1〜A.6 | 上記 1.1・1.7 系と D1 を、運営業務の言葉で要約したビュー（`admin/*.html` 一式） |
| 環境 URL | `js/config.js` の `API_BASE_URL` / `SOCKET_SERVER_URL` |

---

## PNG / SVG で書き出す場合

1. [Mermaid Live Editor](https://mermaid.live) を開く。
2. 各コードブロックの **中身**（`flowchart` から最後の行まで）だけをコピーして貼り付ける。
3. **Actions** から PNG または SVG をダウンロードする。

または `@mermaid-js/mermaid-cli` の `mmdc` で `.mmd` ファイルから一括変換できます。
