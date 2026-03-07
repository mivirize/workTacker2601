"""Insert Claude Code-generated MBTI scripts into the database."""

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "database.db"

SCRIPTS = [
    {
        "title": "【MBTI】INTJが恋に落ちる瞬間、実は超わかりやすい",
        "summary": "INTJの恋愛における意外な特徴を解説するショート動画",
        "script": (
            "INTJって恋愛に興味なさそうに見えるけど、実は好きな人への態度が超わかりやすい。\n\n"
            "まず、普段は効率重視で無駄な会話を嫌うINTJが、特定の相手にだけ長時間話し続ける。これが第一のサイン。\n\n"
            "次に、相手の問題を勝手に分析して解決策を提示してくる。「こうすれば効率いいよ」ってアドバイスが増えたら、それは好意の表れ。\n\n"
            "さらに意外なのが、好きな人の前では完璧主義が加速すること。普段以上に身だしなみを気にしたり、会話の内容を事前にシミュレーションしたりする。\n\n"
            "でも一番わかりやすいのは、自分の将来のビジョンに相手を含めて話し始めること。「将来こういう生活がしたい」って話に、さりげなく相手の存在を組み込んでくる。\n\n"
            "INTJの恋愛は不器用だけど、一度本気になったら誰よりも一途。あなたの周りのINTJ、実はもうサイン出してるかも？"
        ),
    },
    {
        "title": "【MBTI相性】ENFPとINTJが惹かれ合う科学的な理由",
        "summary": "MBTI史上最強と言われるENFP×INTJの相性を分析",
        "script": (
            "MBTIで最強の相性って言われるENFPとINTJ。正反対なのに、なぜこんなに惹かれ合うのか。\n\n"
            "まずENFPは感情豊かで社交的。アイデアが次々湧いてきて、周りを巻き込む天才。一方INTJは論理的で戦略家。長期計画を立てて着実に実行する。\n\n"
            "この二人が出会うと、お互いに持っていないものを補完し合える。ENFPの創造力にINTJが構造を与え、INTJの計画にENFPが柔軟性を加える。\n\n"
            "認知機能で見ると、ENFPの主機能は外向的直観、INTJの主機能は内向的直観。同じ直観型だから、抽象的な話題で深く盛り上がれる。\n\n"
            "しかも、ENFPはINTJの内面の温かさを引き出せる数少ない存在。普段クールなINTJが、ENFPの前では素直に笑ったりする。\n\n"
            "逆にINTJは、ENFPの散らかりがちなエネルギーに方向性を与えてくれる安心感がある。\n\n"
            "最強カップルになれるかは、お互いの違いを尊重できるかどうか。あなたの気になるあの人、MBTIチェックしてみて。"
        ),
    },
    {
        "title": "【MBTI】あなたのタイプ別ストレス反応が当たりすぎる",
        "summary": "16タイプ別のストレス時の特徴的な行動パターンを紹介",
        "script": (
            "MBTIタイプ別のストレス反応、自分に当てはまるか確認してみて。\n\n"
            "まずアナリスト型。INTJは完璧主義が暴走して周りに厳しくなる。INTPは引きこもって延々と考え続ける。ENTJは支配的になって全部自分でやろうとする。ENTPは飽きっぽさが加速して何も完成しない。\n\n"
            "次にディプロマット型。INFJは突然キレる。普段穏やかなだけに周りが驚く。INFPは自分の殻に閉じこもって創作に没頭。ENFJは他人の世話を焼きすぎて自分が倒れる。ENFPはネガティブ思考のループにはまる。\n\n"
            "センチネル型。ISTJはルールに固執して融通が利かなくなる。ISFJは人に尽くしすぎて限界突破。ESTJは怒りっぽくなって命令口調に。ESFJは他人の評価を気にしすぎてパニック。\n\n"
            "最後にエクスプローラー型。ISTPは完全に無口になる。ISFPは感情が爆発して涙。ESTPはリスクの高い行動に走る。ESFPは衝動買いが止まらなくなる。\n\n"
            "あなたはどれが当てはまった？コメントで教えて。"
        ),
    },
]


def main() -> None:
    conn = sqlite3.connect(str(DB_PATH))
    now = datetime.now(timezone.utc).isoformat()

    inserted_ids = []
    for s in SCRIPTS:
        cursor = conn.execute(
            "INSERT INTO videos (title, summary, script, status, created_at) "
            "VALUES (?, ?, ?, 'planned', ?)",
            (s["title"], s["summary"], s["script"], now),
        )
        inserted_ids.append(cursor.lastrowid)

    conn.commit()

    # Verify
    conn.row_factory = sqlite3.Row
    for vid in inserted_ids:
        row = conn.execute(
            "SELECT id, title, status, LENGTH(script) as script_len FROM videos WHERE id = ?",
            (vid,),
        ).fetchone()
        print(f"  id={row['id']}  status={row['status']}  chars={row['script_len']}  {row['title']}")

    total = conn.execute(
        "SELECT COUNT(*) FROM videos WHERE status = 'planned'"
    ).fetchone()[0]
    print(f"\nTotal planned tasks: {total}")
    conn.close()


if __name__ == "__main__":
    main()
