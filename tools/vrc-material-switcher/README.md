# VRC Material Switcher

VRChatアバターの衣装カラーバリエーションを、Modular Avatar を使って非破壊で Expression Menu から切り替えるエディタツール。

配布用パッケージ: リポジトリ直下 `VRCMaterialSwitcher.unitypackage`
ソース: `tools/vrc-material-switcher/Editor/`（`.unitypackage` の中身と同一）

## 使い方
1. `.unitypackage` をプロジェクトにインポート（`Assets/Editor/VRCMaterialSwitcher/` に展開）
2. メニュー `Tools > VRC Material Switcher` を開く
3. アバターを設定 → 衣装フォルダをスキャン → 自動マッピング → セットアップ実行

## 主な機能
- **マテリアル自動検出（スキーマv4ハイブリッド）**: `UVn` トークン優先 → パーツフォルダ → suffix/prefix → 色フォルダ横断。パーツ（オブジェクト）単位でグループ化
- **グループ編集**: 任意グループの新規作成・削除、グループ名／バリエーション名の編集
- **複数メッシュ対応**: 浴衣の上下（Yukata A/B）など1グループを複数レンダラー／スロットへ同時適用（マルチターゲット）
- **パラメータコスト表示**: NDMF `ParameterInfo` でビルド後の同期パラメータ実コストを集計し、256bit予算に対する残り／追加可能グループ数を表示
- **容量（Uncompressed Size）表示と削減**: 切替テクスチャ／本体・装着物テクスチャ／メッシュの内訳と合計を表示。テクスチャ最大解像度の一括縮小（切替色のみ／アバター全体、Crunch対応）

## ファイル構成（Editor/）
| ファイル | 役割 |
|---|---|
| `MaterialSwitcherData.cs` | データモデル（MaterialGroup / MaterialVariation / MaterialRenderTarget / SwitcherConfig）|
| `MaterialVariationDetector.cs` | フォルダスキャンによる検出・レンダラー自動マッピング |
| `MaterialSwitcherWindow.cs` | メインEditorWindow（UI・コスト/容量計算）|
| `MaterialSwitcherSetup.cs` | Modular Avatar による非破壊セットアップ |
| `MaterialSwitcherTest.cs` | 検出ロジックのテスト |

## 依存
- VRChat SDK3 Avatars
- Modular Avatar（nadena.dev.modular-avatar）
- NDMF（パラメータコスト集計に使用）
