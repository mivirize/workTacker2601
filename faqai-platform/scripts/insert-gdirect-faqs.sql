-- G-DIRECT FAQ Insert Script
-- organization_id: 871c225e-b65d-440f-9107-b3ce7fd105fc
-- site_id: bc0f3c96-bc30-4eda-bb6c-7e8182b5d136

BEGIN;

-- ============================================================
-- カテゴリ挿入 (faq_categories)
-- ============================================================

INSERT INTO faq_categories (id, organization_id, site_id, name, slug, sort_order, created_at, updated_at)
VALUES
  ('b0000002-0002-0002-0002-000000000001', '871c225e-b65d-440f-9107-b3ce7fd105fc', 'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136', '会員登録について', 'membership', 1, NOW(), NOW()),
  ('b0000002-0002-0002-0002-000000000002', '871c225e-b65d-440f-9107-b3ce7fd105fc', 'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136', 'ログイン・マイページについて', 'login-mypage', 2, NOW(), NOW()),
  ('b0000002-0002-0002-0002-000000000003', '871c225e-b65d-440f-9107-b3ce7fd105fc', 'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136', 'ご注文について', 'order', 3, NOW(), NOW()),
  ('b0000002-0002-0002-0002-000000000004', '871c225e-b65d-440f-9107-b3ce7fd105fc', 'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136', '商品について', 'product', 4, NOW(), NOW()),
  ('b0000002-0002-0002-0002-000000000005', '871c225e-b65d-440f-9107-b3ce7fd105fc', 'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136', 'デジタルコンテンツ商品について', 'digital-content', 5, NOW(), NOW()),
  ('b0000002-0002-0002-0002-000000000006', '871c225e-b65d-440f-9107-b3ce7fd105fc', 'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136', 'ハイレゾ音源商品について', 'hires-audio', 6, NOW(), NOW()),
  ('b0000002-0002-0002-0002-000000000007', '871c225e-b65d-440f-9107-b3ce7fd105fc', 'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136', 'お支払いについて', 'payment', 7, NOW(), NOW()),
  ('b0000002-0002-0002-0002-000000000008', '871c225e-b65d-440f-9107-b3ce7fd105fc', 'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136', '発送について', 'shipping', 8, NOW(), NOW()),
  ('b0000002-0002-0002-0002-000000000009', '871c225e-b65d-440f-9107-b3ce7fd105fc', 'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136', 'ネコポス発送について', 'nekopos', 9, NOW(), NOW()),
  ('b0000002-0002-0002-0002-000000000010', '871c225e-b65d-440f-9107-b3ce7fd105fc', 'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136', 'ポイントについて', 'points', 10, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FAQ挿入 (faq_items)
-- ============================================================

-- 会員登録について (3件)

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000001',
  'パソコンとスマートフォンの両方から使いたいのですが、パソコン・スマートフォンメールアドレスそれぞれで会員登録が必要ですか？',
  'いいえ、別々の登録は不要です。1つのID（ログインメールアドレス）でパソコンとスマートフォンの両方からアクセスできます。',
  'published',
  1.0,
  1,
  '{"sourceUrl": "https://gdirect.jp/faq/6873", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000001',
  '2014年7月31日（木）23:59までにG-DIRECTへ入会した会員なのですが、ログインできますか',
  '2014年7月31日以前に登録した会員は、新しいhubsynch会員システムへの移行手続き（無料）が必要です。G-DIRECTのトップページ「ログイン」メニューから、登録済みのメールアドレスとパスワードでログインし、移行手続きを完了してください。',
  'published',
  1.0,
  2,
  '{"sourceUrl": "https://gdirect.jp/faq/6871", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000001',
  '会員登録しないでも買えますか',
  '初回利用時はhubsynchへの会員登録（無料）が必要です。商品の閲覧・選択は登録前でも可能です。お支払い手続きの前に登録を完了してください。',
  'published',
  1.0,
  3,
  '{"sourceUrl": "https://gdirect.jp/faq/6870", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

-- ログイン・マイページについて (8件)

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000002',
  'HAPPY SWING・GLAY MOBILEを退会した場合、会員連携はどうすればよいでしょうか',
  'G-DIRECTの登録を変更する必要はありません。会員ステータスがプレミアムからレギュラーに自動移行し、プレミアム会員限定サービスが利用できなくなります。',
  'published',
  1.0,
  1,
  '{"sourceUrl": "https://gdirect.jp/faq/6869", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000002',
  'GLAY MOBILEに登録しているスマートフォンの機種変更をしたのですが、GLAY MOBILE会員連携の変更はどうすればよいですか',
  'お支払い方法やプラン変更によりGLAY MOBILE会員番号が変わる場合があります。会員番号が変更された場合は、アカウントのGLAY MOBILE会員連携セクションで情報を更新してください。',
  'published',
  1.0,
  2,
  '{"sourceUrl": "https://gdirect.jp/faq/6868", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000002',
  'HAPPY SWING・GLAY MOBILEの会員連携ができません',
  'G-DIRECT登録時にHAPPY SWINGまたはGLAY MOBILEの会員情報が正しく入力されていない可能性があります。HAPPY SWING会員連携ガイド、GLAY MOBILE会員連携ガイドをご確認ください。',
  'published',
  1.0,
  3,
  '{"sourceUrl": "https://gdirect.jp/faq/6867", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000002',
  'HAPPY SWING・GLAY MOBILEの会員番号やパスワードがわかりません',
  'HAPPY SWING会員はマイページで会員番号を確認できます。GLAY MOBILE会員はGLAY MOBILEの認証情報を使ってG-DIRECTに登録してください。',
  'published',
  1.0,
  4,
  '{"sourceUrl": "https://gdirect.jp/faq/6866", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000002',
  'プレミアム会員とレギュラー会員は、何が違うのですか',
  'G-DIRECT登録時は全員レギュラー会員です。HAPPY SWINGまたはGLAY MOBILEの会員がアカウント連携するとプレミアム会員になり、ボーナスポイント等の特典を受けられます。',
  'published',
  1.0,
  5,
  '{"sourceUrl": "https://gdirect.jp/faq/6865", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000002',
  'パスワードがわからない / 忘れてしまいました',
  'ご利用ガイドの「パスワードの変更／忘れた場合」セクションを参照してください。',
  'published',
  1.0,
  6,
  '{"sourceUrl": "https://gdirect.jp/faq/6864", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000002',
  'ログインできません',
  '主な原因は3つです：(1)大文字小文字・半角全角の入力ミス (2)登録メールアドレスが現在のものと異なる (3)パスワード忘れ→再設定機能をご利用ください。重複アカウントは作成しないでください。',
  'published',
  1.0,
  7,
  '{"sourceUrl": "https://gdirect.jp/faq/6863", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000002',
  '会員登録内容を間違えて登録してしまったのですが',
  '登録済みのメールアドレスとパスワードでログインし、「登録情報確認・変更」セクションで修正できます。',
  'published',
  1.0,
  8,
  '{"sourceUrl": "https://gdirect.jp/faq/6862", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

-- ご注文について (10件)

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000003',
  'G-DIRECT利用時に届くメールの送信元アドレスを教えてください',
  'G-DIRECTからは6つのメールアドレスから送信されます：support@gdirect.jp, member@gdirect.jp, account@gdirect.jp, order@gdirect.jp, magazine@gdirect.jp, delivery@gdirect.jp。これらのアドレスからのメール受信を許可し、迷惑メールフォルダもご確認ください。',
  'published',
  1.0,
  1,
  '{"sourceUrl": "https://gdirect.jp/faq/6861", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000003',
  '海外転送はできますか？（About Overseas shipping）',
  '日本国内に住所を持たない方は、tenso.comの転送サービスを利用して購入できます。',
  'published',
  1.0,
  2,
  '{"sourceUrl": "https://gdirect.jp/faq/6860", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000003',
  'お届け日・時間帯は指定できないのですか',
  'お届け日は注文時に指定できませんが、発送後の配送通知メールから指定可能です。時間帯は注文時に選択できます：午前中／14-16時／16-18時／18-20時／19-21時。',
  'published',
  1.0,
  3,
  '{"sourceUrl": "https://gdirect.jp/faq/6859", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000003',
  '二次予約で商品を申し込んだのですが、発売日に届きますか',
  '一次予約のお客様は発売日にお届け予定ですが、二次予約の場合は発売日以降順次発送となります。',
  'published',
  1.0,
  4,
  '{"sourceUrl": "https://gdirect.jp/faq/6858", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000003',
  '間違えて同じ注文を2回してしまいました（重複購入）',
  '重複注文した場合は注文当日中に注文番号・お名前を添えてカスタマーセンターへ連絡してください。翌営業日まで連絡がない場合や発送済みの場合は注文確定となります。',
  'published',
  1.0,
  5,
  '{"sourceUrl": "https://gdirect.jp/faq/6857", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000003',
  '注文した際、お届け先情報を間違えてしまった/メールアドレス、住所などが変わったのですが',
  '配送先変更はご利用ガイドの配送セクション、メール・住所変更はG-DIRECT会員登録ガイドの登録情報確認・変更セクションを参照してください。',
  'published',
  1.0,
  6,
  '{"sourceUrl": "https://gdirect.jp/faq/6853", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000003',
  '2件注文をしました。1つの注文にまとめてもらえますか（同梱できますか）',
  'ご利用ガイドの注文セクション「同梱について」を参照してください。',
  'published',
  1.0,
  7,
  '{"sourceUrl": "https://gdirect.jp/faq/6851", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000003',
  '注文した商品のキャンセル・変更（サイズ・カラー・数量等）はできますか',
  'お客様都合によるキャンセル・変更は一切お受けできません。ご注文前に十分ご確認ください。',
  'published',
  1.0,
  8,
  '{"sourceUrl": "https://gdirect.jp/faq/6849", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000003',
  '注文完了メールが届きません／注文が受け付けられたか心配です',
  '注文確認メールは@hubsynch.comから送信されます。迷惑メールフォルダをご確認ください。メールが届かなくても、マイページの購入履歴で注文状況を確認できます。',
  'published',
  1.0,
  9,
  '{"sourceUrl": "https://gdirect.jp/faq/6848", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000003',
  '電話、FAX、メールで注文できますか',
  '電話・FAX・メールでの注文は受け付けていません。パソコン・スマートフォン・タブレットからサイト上で直接ご注文ください。',
  'published',
  1.0,
  10,
  '{"sourceUrl": "https://gdirect.jp/faq/6847", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

-- 商品について (3件)

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000004',
  '再入荷リクエストをしたのですが、いつ入荷しますか',
  '再入荷リクエスト機能は自動通知を保証するものではありません。再入荷が確定した場合はサイト上でお知らせします。生産上の制約により再入荷されない場合もあります。',
  'published',
  1.0,
  1,
  '{"sourceUrl": "https://gdirect.jp/faq/6846", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000004',
  '商品が不良品だったのですが／届いた商品が頼んだ商品と違うのですが',
  'ご利用ガイドの「キャンセル・返品・交換」セクションをご確認ください。輸送用梱包箱の破損は交換補償の対象外です。',
  'published',
  1.0,
  2,
  '{"sourceUrl": "https://gdirect.jp/faq/6845", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000004',
  '品切れ（SOLD OUT）の商品は予約できますか',
  '売り切れ表示の商品の予約はお受けできません。',
  'published',
  1.0,
  3,
  '{"sourceUrl": "https://gdirect.jp/faq/6843", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

-- デジタルコンテンツ商品について (9件)

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000005',
  'ダウンロードしたアーカイブ（音源）の取り込みができないのですが',
  'ダウンロードしたアーカイブはzip形式で圧縮されています。保存したフォルダをダブルクリックして展開するか、右クリックで「すべて展開」を選択してください。OSによってはアーカイブユーティリティソフトのインストールが必要な場合があります。',
  'published',
  1.0,
  1,
  '{"sourceUrl": "https://gdirect.jp/faq/6842", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000005',
  '購入後のデジタルコンテンツ商品には、ダウンロード期限がありますか',
  '注文日から30日以内にダウンロード可能です。',
  'published',
  1.0,
  2,
  '{"sourceUrl": "https://gdirect.jp/faq/6840", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000005',
  '購入したものをキャンセルすることは可能ですか',
  'デジタルコンテンツの性質上、キャンセル・返品・注文変更はお受けできません。',
  'published',
  1.0,
  3,
  '{"sourceUrl": "https://gdirect.jp/faq/6836", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000005',
  'ダウンロード方法がわかりません',
  '注文完了後、マイページの購入履歴から注文詳細を開いてダウンロードできます。ハイレゾ音源は1〜10GBに達する場合があります。購入前に十分なストレージ容量をご確認ください。',
  'published',
  1.0,
  4,
  '{"sourceUrl": "https://gdirect.jp/faq/6827", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000005',
  '支払いはどんな方法がありますか（デジタルコンテンツ）',
  'デジタルコンテンツの支払い方法は3種類です：クレジットカード決済、コンビニ決済、銀行振込決済。コンビニ決済・銀行振込には手数料がかかります。',
  'published',
  1.0,
  5,
  '{"sourceUrl": "https://gdirect.jp/faq/6823", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000005',
  'iPhone/Android端末でダウンロードはできますか',
  '端末の特性上、iPhoneやAndroid端末からの直接ダウンロードはできません。パソコンでダウンロード・解凍してからモバイル端末に転送してご利用ください。',
  'published',
  1.0,
  6,
  '{"sourceUrl": "https://gdirect.jp/faq/6816", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000005',
  'ダウンロード前に注意することはありますか',
  'ダウンロード前にインターネット接続品質と十分なストレージ容量をご確認ください。データ通信料はお客様負担です。',
  'published',
  1.0,
  7,
  '{"sourceUrl": "https://gdirect.jp/faq/6814", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000005',
  '商品購入はどのように行うのですか',
  'サイトTOPのDIGITAL ITEMセクションから商品を選択し、カートに追加して決済を完了してください。注文完了後、マイページの購入履歴からダウンロードできます。',
  'published',
  1.0,
  8,
  '{"sourceUrl": "https://gdirect.jp/faq/6810", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000005',
  'kHz / bitとはなんですか',
  'kHzはサンプリング周波数（値が大きいほど高い周波数まで再現可能）、bitは量子化ビット深度（値が大きいほど細かい音の再現が可能）です。通常のCD規格は44.1kHz/16bitです。',
  'published',
  1.0,
  9,
  '{"sourceUrl": "https://gdirect.jp/faq/6809", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

-- ハイレゾ音源商品について (6件)

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000006',
  'GLAY「MUSIC LIFE」コラボモデルインサイドホンを使用して聴くことは可能ですか',
  '以前販売されたコラボイヤホンはハイレゾ音源の再生に対応しています。',
  'published',
  1.0,
  1,
  '{"sourceUrl": "https://gdirect.jp/faq/6821", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000006',
  'どのようにして再生できますか',
  'ハイレゾ音源の再生には専用アプリ、再生ソフト、またはハイレゾ対応プレーヤーが必要です。詳細はmoraのWebサイトをご確認ください。',
  'published',
  1.0,
  2,
  '{"sourceUrl": "https://gdirect.jp/faq/6819", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000006',
  'ハイレゾ音源のダウンロードが開始されません',
  'ハイレゾ音源は通常の圧縮音源より大幅にデータサイズが大きいため、接続速度によっては10〜60分かかる場合があります。ダウンロード完了までお待ちください。',
  'published',
  1.0,
  3,
  '{"sourceUrl": "https://gdirect.jp/faq/6817", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000006',
  'ハイレゾ音源の対応端末を教えてください',
  'ハイレゾ対応のオーディオ製品、パソコン、スマートフォン・タブレットで再生できます。具体的な対応機種は各メーカーにお問い合わせください。',
  'published',
  1.0,
  4,
  '{"sourceUrl": "https://gdirect.jp/faq/6815", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000006',
  '支払いはどんな方法がありますか（ハイレゾ）',
  'クレジットカード決済、コンビニ決済、銀行振込決済の3種類です。コンビニ・銀行振込には手数料がかかります。',
  'published',
  1.0,
  5,
  '{"sourceUrl": "https://gdirect.jp/faq/6811", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000006',
  'ハイレゾとはなんですか',
  'ハイレゾ音源とは、従来のCDを大幅に上回る情報量を持つ高品質音源で、スタジオで収録されたマスター音源に近い音質を再現できます。',
  'published',
  1.0,
  6,
  '{"sourceUrl": "https://gdirect.jp/faq/6808", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

-- お支払いについて (2件)

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000007',
  'コンビニ決済／銀行振込決済の入金期限が過ぎてしまいました。その場合はキャンセルとなってしまいますか',
  'コンビニ決済は注文から2日後、銀行振込は7日後が期限です。期限を過ぎると注文は自動キャンセルされます。再購入する場合は再度注文手続きが必要です。',
  'published',
  1.0,
  1,
  '{"sourceUrl": "https://gdirect.jp/faq/6807", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000007',
  'コンビニ振込用紙／銀行振込用紙はいつ届きますか',
  '物理的な支払い伝票の郵送は行っていません。ペーパーレス決済です。マイページの購入履歴とメールで支払い情報をご確認のうえ、コンビニまたは銀行でお支払いください。',
  'published',
  1.0,
  2,
  '{"sourceUrl": "https://gdirect.jp/faq/6806", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

-- 発送について (2件)

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000008',
  '支払いはどんな方法がありますか',
  'クレジットカード、コンビニ決済、銀行振込、代金引換の4種類です。注文完了後の支払い方法変更はできません。',
  'published',
  1.0,
  1,
  '{"sourceUrl": "https://gdirect.jp/faq/6804", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000008',
  '留守にしていて商品が受け取れませんでした',
  '不在の場合、配達員が不在票を残します。保管期限内にヤマト運輸営業所へ連絡してお受け取りください。',
  'published',
  1.0,
  2,
  '{"sourceUrl": "https://gdirect.jp/faq/6802", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

-- 宅急便発送について → 発送カテゴリ (shipping) に追加 (2件)

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000008',
  '商品はいつ届きますか',
  '商品により異なりますので商品詳細をご確認ください。配送期間の詳細はご利用ガイドの配送セクションを参照してください。',
  'published',
  1.0,
  3,
  '{"sourceUrl": "https://gdirect.jp/faq/6800", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000008',
  '届いた商品が破損していたのですが',
  'ネコポスでは配達完了後の紛失・破損については補償対象外です。G-DIRECTでは配達後に破損した商品の交換・補償・返金はお受けできません。',
  'published',
  1.0,
  4,
  '{"sourceUrl": "https://gdirect.jp/faq/6799", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

-- ネコポス発送について (7件 ※ 6791含む)

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000009',
  '送料・手数料はいくらですか',
  'ネコポスの送料は全国一律330円（税込）です。',
  'published',
  1.0,
  1,
  '{"sourceUrl": "https://gdirect.jp/faq/6798", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000009',
  'お荷物お届けのお知らせメールが届きません',
  '配送通知メールは宅急便利用時のみ送信されます。ネコポス利用時には送信されません。発送日や配送状況はマイページの購入履歴でご確認ください。',
  'published',
  1.0,
  2,
  '{"sourceUrl": "https://gdirect.jp/faq/6797", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000009',
  '商品が届きません',
  '配達遅延の原因として、表札がない、受取人名が異なる、建物名・部屋番号の未記入、郵便受けが小さい等が考えられます。注文前にこれらをご確認ください。',
  'published',
  1.0,
  3,
  '{"sourceUrl": "https://gdirect.jp/faq/6796", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000009',
  'お届け日・時間帯は指定できないのですか（ネコポス）',
  'ネコポスではお届け日・時間帯の指定はできません。発売日指定商品でも発売日当日の到着は保証されません。発売日受取をご希望の場合は宅急便をご利用ください。',
  'published',
  1.0,
  4,
  '{"sourceUrl": "https://gdirect.jp/faq/6794", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000009',
  '商品はいつ届きますか（ネコポス）',
  '商品ごとに異なりますので商品詳細ページでご確認ください。お届け日・時間帯の指定はできません。発売日当日の到着を希望する場合は宅急便オプションをご利用ください。',
  'published',
  1.0,
  5,
  '{"sourceUrl": "https://gdirect.jp/faq/6793", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000009',
  'ネコポスで注文できない商品があるのですが',
  'ネコポス非対応商品やサイズ超過の場合、ネコポスは選択できません。複数商品の場合は宅急便をご利用ください。各商品のネコポス対応状況は商品詳細ページでご確認ください。',
  'published',
  1.0,
  6,
  '{"sourceUrl": "https://gdirect.jp/faq/6792", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000009',
  '代金引換で注文したいのですが',
  'ネコポスは郵便受け投函のため代金引換は利用できません。クレジットカード、コンビニ決済、銀行振込からお選びください。',
  'published',
  1.0,
  7,
  '{"sourceUrl": "https://gdirect.jp/faq/6791", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

-- ポイントについて (6件)

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000010',
  'HAPPY SWING・GLAY MOBILEを継続したのに、ボーナスポイントがつきません',
  'ボーナスポイントは毎月25日頃に付与されます。前月末までの会員継続とG-DIRECTでのアカウント連携が必要です。',
  'published',
  1.0,
  1,
  '{"sourceUrl": "https://gdirect.jp/faq/6787", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000010',
  'HAPPY SWING会員・GLAY MOBILEの会員なのに、ポイントが2倍になっていません',
  'ポイント2倍にはG-DIRECTアカウントページでの会員連携登録が必要です。連携前の注文にはポイント2倍は適用されません。',
  'published',
  1.0,
  2,
  '{"sourceUrl": "https://gdirect.jp/faq/6786", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000010',
  'ポイントはいつまで有効ですか',
  '詳細はご利用ガイドのポイントセクション「ポイント有効期限」を参照してください。',
  'published',
  1.0,
  3,
  '{"sourceUrl": "https://gdirect.jp/faq/6785", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000010',
  'ポイントで商品は購入できますか',
  'ポイントでの商品購入や現金への換金はできません。',
  'published',
  1.0,
  4,
  '{"sourceUrl": "https://gdirect.jp/faq/6784", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000010',
  'G-DIRECTで交換できるグッズには何がありますか',
  'ポイント交換可能なグッズの一覧はポイント交換商品リストをご確認ください。',
  'published',
  1.0,
  5,
  '{"sourceUrl": "https://gdirect.jp/faq/6781", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

INSERT INTO faq_items (id, organization_id, site_id, category_id, question, answer, status, quality_score, sort_order, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '871c225e-b65d-440f-9107-b3ce7fd105fc',
  'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136',
  'b0000002-0002-0002-0002-000000000010',
  'ポイントは、いつ頃反映されますか（商品を買いましたがポイントがついていません）',
  'ポイントは決済処理完了後に付与されます。商品到着から1週間経ってもポイントが反映されない場合はサポートセンターにお問い合わせください。',
  'published',
  1.0,
  6,
  '{"sourceUrl": "https://gdirect.jp/faq/6780", "extractedBy": "claude-code-direct"}',
  NOW(), NOW()
);

COMMIT;

-- 挿入結果確認
SELECT
  c.name AS category_name,
  COUNT(i.id) AS item_count
FROM faq_categories c
LEFT JOIN faq_items i
  ON i.category_id = c.id
  AND i.site_id = 'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136'
WHERE c.site_id = 'bc0f3c96-bc30-4eda-bb6c-7e8182b5d136'
GROUP BY c.id, c.name, c.sort_order
ORDER BY c.sort_order;
