const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Configuration
const DB_PATH = path.resolve(__dirname, '../database.db');

const MBTI_CONTENT = {
    title: "【MBTI】性格タイプ別！ストレス解消法 Vol.1",
    summary: "MBTIの性格タイプに基づいた効果的なストレス解消法を紹介します。",
    script: `MBTI診断、楽しんでいますか？今回は、性格タイプ別の効果的なストレス解消法についてお話しします。

まず、外向型（E）の皆さん。
誰かと話したり、外に出かけることでエネルギーをチャージできるタイプです。
ストレスを感じたら、友人を誘って食事に行ったり、スポーツで汗を流すのがおすすめ。
一人で抱え込まず、発散することが大切です。

一方、内向型（I）の皆さん。
一人の時間を持つことで回復するタイプです。
静かな部屋で読書をしたり、好きな音楽を聴きながらリラックスするのが効果的。
無理に人に会おうとせず、自分の内面と向き合う時間を大切にしてください。

直感型（N）の方は、新しいアイデアや可能性に触れること。
感覚型（S）の方は、五感を使ったリラックス、例えば美味しいものを食べたり、マッサージを受けることが癒やしになります。

自分のタイプを知って、上手にストレスと付き合っていきましょう。
あなたのタイプは何でしたか？コメントで教えてくださいね。
それでは、また次回の動画でお会いしましょう！`
};

const db = new sqlite3.Database(DB_PATH);

async function main() {
    console.log(`Resetting database and generating 1 MBTI video script...`);

    db.serialize(() => {
        // Clear existing data for test
        db.run("DELETE FROM videos");

        // Reset ID counter if possible (sqlite sequence)
        db.run("DELETE FROM sqlite_sequence WHERE name='videos'");

        const stmt = db.prepare("INSERT INTO videos (title, summary, script, status) VALUES (?, ?, ?, 'planned')");

        stmt.run(MBTI_CONTENT.title, MBTI_CONTENT.summary, MBTI_CONTENT.script);
        stmt.finalize();
    });

    console.log(`Generated MBTI content with script length: ${MBTI_CONTENT.script.length} characters.`);
    db.close();
}

main().catch(console.error);
