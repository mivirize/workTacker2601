const tPath = $('body').data('rt');
const isTop = (tPath === './' || tPath === '');

// =======================================================
// MENU
// =======================================================
// [label, slug, isTopAnchor, isSubPage, isSoon]
const menus = [
	['最新情報', 'news', true, true, false],
	['映像', 'movie', true, false, false],
	['イントロダクション', 'introduction', true, false, false],
	['あらすじ', 'story', true, false, false],
	['音楽', 'music', true, true, false],
	['登場人物', 'character', true, false, false],
	['スタッフ・キャスト', 'staffcast', true, false, false],
	['関連商品', 'goods', false, true, false],
	['スペシャル', 'special', false, true, false],
];
let navTags = '';
let gnavTags = '';

menus.forEach((v) => {
	const [label, slug, isAnchor, isSub, isSoon] = v;
	// リンク先URLの決定
	let href = '';
	if (isTop) {
		href = isAnchor ? `#${slug}` : `${tPath}${slug}`;
	} else {
		href = !isSub ? `${tPath}#${slug}` : `${tPath}${slug}`;
	}
	const anchorClass = (isTop && isAnchor) ? ' js-anchor' : '';
	const soonClass = isSoon ? ' is-soon' : '';
	navTags += `
		<li class="nav__item">
			<a href="${href}" class="nav__itemLink nav__itemLink--${slug}${anchorClass}${soonClass}">
				<span class="nav__itemLink--text">${label}</span>
			</a>
		</li>`;
	gnavTags += `
		<li class="gnav__item">
			<a href="${href}" class="gnav__itemLink gnav__itemLink--${slug}${anchorClass}${soonClass}">
				<span class="gnav__itemLink--text">${label}</span>
			</a>
		</li>`;
});

// DOMへの反映
if ($("#js-nav").length) $("#js-nav").append(navTags);
if ($("#js-fnav").length) $("#js-fnav").append(navTags);
if ($("#js-gnav").length) $("#js-gnav").append(gnavTags);

if (typeof cont !== 'undefined' && cont) {
	$(`.gnav__itemLink--${cont}`).addClass('is-active');
	$(`.nav__itemLink--${cont}`).addClass('is-active');
}

// =======================================================
// OFFICIAL SNS
// =======================================================
const sns = [
	['X', 'x', 'https://x.com/Cho_KaguyaHime'],
	['TikTok', 'tiktok', 'https://www.tiktok.com/@cho_kaguyahime_pr'],
	['YouTube', 'youtube', 'https://www.youtube.com/@Cho-KaguyaHime-PR'],
	['Instagram', 'instagram', 'https://www.instagram.com/cho_kaguyahime_pr/'],
	['Niconico', 'niconico', 'https://www.nicovideo.jp/user/141907929'],
];

let snsTags = '';
let gsnsTags = '';
let fsnsTags = '';

sns.forEach((v) => {
	const [label, slug, url] = v;
	snsTags += `<dd class="fv__snsItem"><a href="${url}" target="_blank" class="fv__snsLink fv__snsLink--${slug}" rel="noopener noreferrer"><span class="hd">${label}</span></a></dd>`;
	gsnsTags += `<dd class="gnav__officialItem"><a href="${url}" target="_blank" class="gnav__officialLink gnav__officialLink--${slug}" rel="noopener noreferrer"><span class="hd">${label}</span></a></dd>`;
	fsnsTags += `<dd class="footer__officialItem"><a href="${url}" class="footer__officialLink footer__officialLink--${slug}" target="_blank" rel="noopener noreferrer"><span class="hd">${label}</span></a></dd>`;
});

if ($("#js-sns").length) $("#js-sns").append(snsTags);
$('#js-gsns').append(gsnsTags);
$('#js-fsns').append(fsnsTags);

// =======================================================
// NAV CHARACTER (Random)
// =======================================================
const navCharacters = [
	['gnav_c0.png', '月からやってきた謎の少女。', 0, 0],
	['gnav_c1.png', '17歳の女子高生。', 1, 1],
	['gnav_c2.png', '仮想空間『ツクヨミ』の管理人、兼トップライバー。', 2, 2],
	['gnav_c4.png', 'ヤチヨの相棒として『ツクヨミ』の案内を共に担う、ふわふわのウミウシ。', 4, 8],
	['gnav_c3.png', 'かぐやが携帯ゲームキットを買って作ったオリジナルの犬。', 3, 12],
];

const charIdx = Math.floor(Math.random() * navCharacters.length);
const selectedChar = navCharacters[charIdx];

$(".gnav__characterEn").addClass(`c${selectedChar[2]}`);

const charLink = isTop ? '#character' : `${tPath}?cid=${selectedChar[3]}#character`;

const charHtml = `
	<img src="${tPath}assets/img/common/${selectedChar[0]}" alt="">
	<dl class="gnav__characterProfile">
		<dt class="gnav__characterProfileTitle">PROFILE</dt>
		<dd class="gnav__characterProfileText">
			<span class="gnav__characterProfileText--t">${selectedChar[1]}</span>
			<div class="gnav__characterProfileText--m">
				<a href="${charLink}" class="js-navCharacter" data-cid="${selectedChar[3]}">MORE</a>
			</div>
		</dd>
	</dl>`;

$("#js-gnavCharacter").empty().append(charHtml);

// =======================================================
// FOOTER BANNER
// =======================================================
const banners = []; // 運用時に追加
if (banners.length) {
	const bannerTags = banners.map(bnr => `
		<li class="footer__bnrItem">
			<a href="${bnr[2]}" target="_blank" rel="noopener noreferrer" class="footer__bnrLink">
				<img src="${tPath}assets/img/bnr/${bnr[1]}" alt="${bnr[0]}" loading="lazy">
			</a>
		</li>`).join('');
	$("#js-banners").append(bannerTags);
} else {
	$("#js-banners").hide();
}