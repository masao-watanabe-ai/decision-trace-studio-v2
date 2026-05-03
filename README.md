# Decision Trace Studio

**意思決定を設計して、実行して、比較して、改善し続けるための Studio。**

---

## 🚧 Early Access

This is an early-stage prototype of Decision Trace Studio.

We are exploring a new paradigm:  
**AI as a decision system, not just a prediction engine.**

This project focuses on making decisions:
- explicit
- testable
- improvable

If you're interested in using this in real environments,  
feel free to reach out or open a discussion.

---

AI はシグナルを出す存在です。でも現場では、そのシグナルを受けて「最終的に何をするか」——つまり **Decision** を下す必要があります。Decision Trace Studio は、その Decision の部分を人間が設計・管理・改善するためのツールです。AIの精度を上げるツールではなく、**意思決定そのものを設計・運用するインフラ**です。

---

## できること

### Design — フローを設計する

判断ロジックをノードとエッジで視覚的に設計します。ノードは4種類。通常の判断をおこなう **Decision**、リスク境界を捉える **Boundary**、必ず人間が判断する **Human Gate**、どの条件にも当てはまらない **Fallback**。条件・アクション・優先度を各ノードに設定でき、変更のたびにバージョンが記録されます。

### Simulate — シナリオを実行する

テストシナリオを自動生成してフロー全体を実行検証します。各シナリオがどのノードを通過してどのアクションに至ったかがすべて記録されます。「このインプットでこの判断になるのか」を事前に確認できます。

### Compare — 変更の影響を比較する

フローを変更する前と後のシミュレーション結果を並べて比較します。どのシナリオのアクションが変わったか、変わっていないかが一目でわかります。改善が意図した効果をもたらしているか、予期しない副作用がないかを、本番反映前に定量的に確認できます。

### Trace — 判断の根拠を追う

各シナリオのノード評価ステップを時系列で追跡します。「なぜこの判断になったのか」を後から再現できる状態にします。説明責任が求められる業務での監査や、フロー改善のデバッグに使います。

### Improve — 提案を生成して反映する

シミュレーション結果を分析し、境界追加・条件分割・優先度調整などの改善提案を自動生成します。提案内容を確認して承認すると、フローにそのまま反映されます。その後 Simulate → Compare で改善効果を数値で確認できます。

### Interact — 現場の文脈からフローを改善する

interaction-core を **Decision Operation Interface** として統合した実験的なタブです。チャンネルに蓄積されたメッセージや分析結果をシグナルとして扱い、そこから構造化された仮説を生成してフロー改善につなげます。

---

## Interact タブ — interaction-core 統合（実験的）

> このタブは interaction-core バックエンドが別途起動している場合にのみ機能します。

### 概念

AI はシグナルを出す存在です。シグナルはまだ意思決定ではありません。Interact タブは、現場のやり取り（チャンネルのメッセージ・分析結果）をシグナルとして受け取り、オペレーターが「意味」を付与して Decision Proposal へと変換するインターフェースです。

```
Interaction（メッセージ・分析）
  → Signal（観測された事実の選択）
  → Meaning（IF / THEN / BECAUSE 仮説の生成）
  → Decision Proposal（Improve タブへ送信）
  → Flow への反映
  → Simulate → Compare（変更インパクトの確認）
```

### 操作の流れ

1. **チャンネルを選択する** — 左ペインのリストから対象チャンネルを選ぶ
2. **Analyze を実行する** — Signal Panel の「Analyze」ボタンを押してチャンネルを分析する
3. **シグナルを選択する** — 分析結果から関連するシグナルにチェックを入れる
4. **仮説を生成する** — 「Generate Decision Hypothesis」を押す。選択したシグナルをもとに以下の構造で仮説が生成される：

   ```
   IF       <観測された条件>
   THEN     <フローへの調整案>
   BECAUSE  <根拠>
   ```

   生成された内容は編集可能です。

5. **Decision Proposal を作成する** — 「Create Decision Proposal」を押す。仮説が Improve タブの DecisionContext として保存される。
6. **Improve タブで反映する** — Improve タブを開き、受け取った Context を確認する。「Convert to Decision Node」でノード提案に変換するか、「Generate Suggestion from Context」でルール改善提案を生成する。
7. **Simulate → Compare で確認する** — ノード追加後にバナーが表示されるので「Go to Simulate →」から再実行し、「Go to Compare →」で変更前後の差分を確認する。

### Signal と Decision の分離

| 概念 | 担当 | 説明 |
|---|---|---|
| Signal | interaction-core | 観測された事実（キーワード、洞察、スコア）|
| Meaning | オペレーター | IF/THEN/BECAUSE 仮説としての解釈 |
| Decision Proposal | Improve タブ | フロー変更の提案（承認前） |
| Decision | Studio フロー | 承認されてフローに反映された判断ロジック |

AI の出力（シグナル）をそのまま Decision に昇格させるのではなく、人間の解釈を挟む構造になっています。

---

## Run Decision Operation（実験的）

> この機能は Evolution Phase として追加された実験的な拡張です。通常の Interact → Improve ワークフローに加えて、より直接的な操作経路を提供します。

### 概念

通常のフローは「仮説を作成 → Improve タブで承認 → Simulate → Compare」という複数ステップを経ます。Run Decision Operation は、この一連の操作を**単一のアクションに統合した省略経路**です。

```
Interaction（メッセージ・分析）
  → Signal（観測された事実の選択）
  → Meaning（IF / THEN / BECAUSE 仮説の生成）
  → Decision Operation（ノード作成・反映・シミュレーションを一括実行）
  → Flow への反映（Auto Apply）
  → Simulate（Auto Simulation）
  → Compare（変更インパクトの確認）
```

人間の解釈（仮説の確認・編集）は維持されます。自動化されるのは、確認済みの仮説を Flow に反映する**操作手順**の部分です。

### オプション

| オプション | デフォルト | 説明 |
|---|---|---|
| Auto Apply | OFF | 仮説から生成した Suggestion を確認なしでフローに即反映する |
| Auto Simulation | OFF | Auto Apply 完了後、自動でシナリオ生成とシミュレーションを実行する |

両オプションとも OFF の場合、通常の Suggestion として Improve タブに積まれ、従来どおり手動で承認できます。

Auto Simulation は Auto Apply が ON のときのみ有効です。

### 呼び出し元

Run Decision Operation ボタンは2か所に配置されています：

- **Interact タブ > Signal Panel > Section 5** — 仮説を生成した直後に実行できる
- **Improve タブ > DecisionContext カード** — Improve タブに送信済みの Context から実行できる

### 注意事項

- この機能は**実験的**です。Auto Apply を ON にすると、確認ダイアログなしでフローが変更されます。
- Auto Simulation を ON にすると、シミュレーション結果が上書きされます。以前の実行結果との比較が目的の場合は OFF のままにして、Simulate タブから手動で再実行してください。
- フローへの反映は取り消せません（Undo は Design タブの保存操作のみ対応）。

---

## Call Center デモシナリオ

初期状態のプロジェクトには、**コールセンター対応フロー**のデモが組み込まれています。

| ノード | 種別 | 役割 |
|---|---|---|
| VIP Fast Track | Decision | VIPフラグが立っているお客様を優先対応 |
| Refund+Legal Risk | Boundary | 一定金額以上の返金 + 法的言及があるケースをエスカレーション |
| Complaint Gate | Human Gate | クレーム区分のケースを人間にエスカレーション |
| Default | Fallback | 上記いずれにも該当しない場合のデフォルト対応 |

このフローを出発点として、シミュレーション → Compare → Improve の一連のサイクルを体験できます。

---

## Guided Demo の使い方

Studio を開いたら、ヘッダー右上の **`▶ Demo`** ボタンを押してください。7ステップのウォークスルーが画面下部に表示され、各ステップで操作すべきタブに自動で切り替わります。

```
Step 1  Flow を見る        → Design タブ
Step 2  シナリオ生成        → Simulate タブ
Step 3  シミュレーション実行  → Simulate タブ
Step 4  Compare を見る     → Compare タブ
Step 5  提案生成           → Improve タブ
Step 6  承認して Flow に反映 → Improve タブ
Step 7  再実行して変化を見る  → Simulate タブ
```

ステップ番号をクリックすると任意のステップに移動できます。デモを終了するには「完了」または「✕」を押してください。

---

## デモを見る推奨順序

1. **Design タブ** でノード構成を確認する
2. **Simulate タブ** でシナリオ生成 → 全件実行する
3. **Trace** で任意シナリオの評価ステップを開く
4. **Compare タブ** で Before / After を確認する（初回は差分なし）
5. **Improve タブ** で改善提案を生成 → 承認して Flow に反映する
6. **Simulate タブ** で再実行する
7. **Compare タブ** で改善前後の差分を確認する

---

## 詳細なデモ台本

口頭でのプレゼン用に 1分版・3分版の台本を用意しています。

→ [docs/demo-script-ja.md](docs/demo-script-ja.md)

---

## セットアップ

### バックエンド

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

> Python 3.11 以上が必要です（`backend/.python-version` で指定）。

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。バックエンドは `http://localhost:8000` で起動していることを確認してください。

### Docker を使う場合

```bash
docker compose up
```

### interaction-core バックエンド（Interact タブを使う場合）

Interact タブは [interaction-core](../chatPF/interaction-core) バックエンドへの接続を前提としています。Decision Trace Studio のバックエンドがポート 8000 を使用するため、interaction-core は **ポート 8001** で起動してください。

```bash
# interaction-core リポジトリで実行
cd path/to/interaction-core/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

フロントエンドの `.env.local` に接続先を指定します（初回セットアップ時に自動生成されます）：

```
VITE_INTERACTION_CORE_URL=http://localhost:8001
```

データベース（PostgreSQL）と Redis が必要です。interaction-core の `docker-compose.yml` を使うか、個別に起動してください：

```bash
# interaction-core ディレクトリで DB と Redis のみ起動
docker compose up db redis
```

> interaction-core バックエンドが起動していない場合、Interact タブはチャンネル一覧の取得に失敗しますが、他のタブ（Design / Simulate / Compare / Improve）は影響を受けません。

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | React 18 + TypeScript + Vite |
| UIライブラリ | Tailwind CSS + @xyflow/react v12 |
| 状態管理 | TanStack Query v5 + Zustand v5 |
| バックエンド | FastAPI + Pydantic v2 |
| データ永続化 | インメモリ（開発用） |
| Interact レイヤー | interaction-core（FastAPI + PostgreSQL + Redis）— 別プロセス、実験的 |

## License

MIT License © 2026 Masao Watanabe
