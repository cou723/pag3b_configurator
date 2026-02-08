# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Onshape CAD APIを利用して、手のサイズ測定データに基づいてパラメトリックCADモデル（キーボードのトッププレート）を生成し、STLファイルをダウンロードするツール。

- ランタイム: **Deno**
- 言語: TypeScript
- アーキテクチャ: クリーンアーキテクチャ（domain/app/infrastructure）
- 外部API: Onshape REST API v10

## 開発コマンド

### メインコマンド
```bash
# すべてのバリエーション（mine、AIST統計データ6種）のSTLをダウンロード
deno task download-all

# 現在の設定値のSTLのみをダウンロード
deno task download-current

# 自分の手の測定値でOnshapeパラメータを更新
deno task update
```

### 型生成
```bash
# Onshape APIのOpenAPI定義から型定義を再生成
deno task regenerate-client
```

このコマンドは以下を実行:
1. Onshape公式OpenAPIをダウンロード
2. `scripts/clean_openapi.ts`でスキーマをクリーンアップ（`btType`プロパティの衝突を解決）
3. `openapi-typescript`で型定義生成 → `src/infrastructure/api.d.ts`

### パーミッション
実行時には以下の権限が必要:
- `--allow-read`: CSVファイル、credentials.ts読み込み
- `--allow-write`: STLファイル書き込み
- `--allow-net`: Onshape API通信

## アーキテクチャ

### ディレクトリ構造
```
src/
├── domain/          # ビジネスロジック・型定義
│   ├── entity/      # データ構造（MeasureParam、MilliMeter）
│   ├── repository/  # インターフェース定義
│   └── service/     # ドメインサービス（ParameterConverter）
├── app/             # ユースケース層
└── infrastructure/  # 外部システム実装（Onshape、ファイルIO、AISTデータ）
```

### 主要な概念

#### 1. 測定データの変換フロー
```
手の計測値（MeasureParam）
  ↓ ParameterConverter.toOnshapeParams()
Onshapeパラメータ（OnshapeParameters）
  ↓ OnshapeRepository.set()
CADモデル更新
  ↓ OnshapeRepository.fetchStl()
STLファイル
```

#### 2. AIST統計データの利用
`statistics.csv`から日本人の手の平均サイズ（性別・統計値別）を読み込み、それを基準に複数のバリエーションを生成。`ParameterConverter.fromAistTable()`でAIST統計値をOnshapeパラメータに変換する際、ハードコードされた補正値（`-16mm`、`+6mm`など）を適用している（src/domain/service/parameter-converter.ts:63-74）。

#### 3. Onshape APIの操作
- **パラメータ設定**: `/variables/d/{did}/w/{wid}/e/{eid}/variables` エンドポイントでグローバル変数を一括更新
- **STL取得**: 2段階のAPI呼び出し
  1. パーツリスト取得 → `TopPlate`パーツのIDを特定
  2. STLダウンロードURL取得（リダイレクト） → 実際のSTLをfetch

### 認証情報
`credentials.ts`（gitignore対象）にOnshapeのaccessKey/secretKeyを設定。サンプルは`credentials.sample.ts`を参照。

### 測定データのソース
- **自分の測定値**: `src/infrastructure/my-measure.ts`にハードコードされた実測値
- **AIST統計**: `statistics.csv`から動的に読み込み（男性/女性×平均/最小/最大）

### 座標系とパラメータのマッピング
- `L03`～`L18`: AIST人体寸法データベースの項目番号（手の各部位の長さ）
- `B03`, `B04`: 指間隔の基準値
- `MY_B03`: 自分の手の基準値（parameter-converter.ts:6）。指間隔の比率計算に使用

## 開発時の注意事項

- **throwの使用禁止**: Denoではエラーハンドリングは返り値で行う（現状はthrowを使っているが、リファクタ推奨）
- **型安全性**: Onshape APIの型定義は`src/infrastructure/api.d.ts`で管理。不完全な場合は`as unknown as any`でバイパス（onshape.ts:69）
- **STLファイル**: 生成されたSTLファイルは`.gitignore`で除外される
- **OpenAPI型定義の問題**: Onshape公式OpenAPIは`btType`プロパティでdiscriminatorと衝突するため、`clean_openapi.ts`で事前削除が必要

## コーディング規約

- **linter/formatter**: biomeを使用（明示的な設定ファイルはないが、グローバル設定に従う）
- **package manager**: pnpmを推奨（本プロジェクトはDenoのため不要）
- **コメント**: 日本語（既存コードに準拠）
