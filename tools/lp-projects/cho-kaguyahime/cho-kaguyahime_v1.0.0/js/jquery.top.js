/**
 * jquery.top.js
 * 最適化バージョン
 */

// 共通で使用するDOM要素をキャッシュ
const $window = $(window);
const $body = $('body');
const $document = $(document);

// VH設定とKV高さ合わせの最適化
let vh = window.innerHeight;
const kv2fv = () => {
	const $kv = $("#kv");
	if ($kv.length) {
		$("#fv").css({ height: $kv.innerHeight() });
	}
};

document.documentElement.style.setProperty('--vh', `${vh}px`);
kv2fv();

let resizeTimer;
window.addEventListener('resize', () => {
	clearTimeout(resizeTimer);
	resizeTimer = setTimeout(() => {
		vh = window.innerHeight;
		document.documentElement.style.setProperty('--vh', `${vh}px`);
		kv2fv();
	}, 200);
}, { passive: true });

// =======================================================
// KV Swiper
// =======================================================
const $kvImgs = $(".kv__imgOn");
const kvLength = $kvImgs.length;

if (kvLength > 1) {
	const kvSwitcherHtml = Array.from({ length: kvLength }, (_, i) => `
		<li class="fv__kvSwitcherItem">
			<a href="javascript:;" data-index="${i}" class="fv__kvSwitcherLink">
				<svg class="fv__kvSwitcherLink--circle"><circle></circle></svg>
			</a>
		</li>
	`).join('');
	
	$("#js-kvSwiperSwitchers").append(kvSwitcherHtml);
	const $kvSwitcherItems = $(".fv__kvSwitcherItem");

	const kvSwiper = new Swiper('#js-kvSwiper', {
		autoplay: {
			delay: 6000,
			disableOnInteraction: false,
			pauseOnMouseEnter: false,
		},
		loop: true,
		speed: 1000,
		slidesPerView: 'auto',
		autoHeight: true,
		effect: 'fade',
		fadeEffect: { crossFade: true },
		on: {
			slideChange: function(ev) {
				$kvSwitcherItems.removeClass('is-active').eq(ev.realIndex).addClass('is-active');
			},
		}
	});

	$document.on('click', '.fv__kvSwitcherLink', function() {
		kvSwiper.slideToLoop($(this).data('index'));
	});
}

// =======================================================
// Banners (FV)
// =======================================================
if ($('#js-bnr').length) {
	getPost('pages', 131).done(function(data) {
		const bnrLists = data.acf.fv_bnrlists;
		if (!bnrLists || bnrLists.length === 0) return;

		const chunks = [];
		for (let i = 0; i < bnrLists.length; i += 2) {
			chunks.push(bnrLists.slice(i, i + 2));
		}

		const bnrHtml = chunks.map(pair => {
			const items = pair.map((v, i) => {
				const tBlank = v.fv_bnrtarget ? ' target="_blank" rel="noopener noreferrer"' : '';
				const parallax = (i % 2 === 1) ? ' data-swiper-parallax="-100"' : '';
				return `
					<p class="fv__bnrSwiperItem"${parallax}>
						<a href="${v.fv_bnrurl}"${tBlank}><img src="${v.fv_bnrimg}" alt=""></a>
					</p>`;
			}).join('');
			return `<li class="fv__bnrSwiper-slide swiper-slide">${items}</li>`;
		}).join('');

		$("#js-bnrSwiperWrapper").html(bnrHtml);

		const $bnrItems = $(".fv__bnrSwiperItem");
		if ($bnrItems.length > 0) {
			if ($(".fv__bnrSwiper-slide").length > 1) {
				new Swiper('#js-bnrSwiper', {
					autoplay: { delay: 5000, disableOnInteraction: false },
					loop: true,
					speed: 600,
					slidesPerView: 'auto',
					parallax: true,
					pagination: { el: ".swiper-pagination", clickable: true },
					centeredSlides: true,
				});
			} else {
				$(".fv__bnr .swiper-pagination").remove();
			}
		}
	}).fail(() => console.error('[ERROR]Failed to get banners'));
}

// =======================================================
// Character Swiper
// =======================================================
let characterSwiper;
$window.on('load', function() {
	const characterChanger = [];
	const characterChangeLength = [];
	const $characterSection = $("#character");

	$(".character__content").each(function() {
		const $this = $(this);
		const id = parseInt($this.data('charaid'), 10);
		characterChanger[id] = 1;
		characterChangeLength[id] = $this.find('.character__img div').length;
	});

	const maxLen = Math.max(...characterChangeLength.filter(n => n));
	const classArrayFor = Array.from({ length: maxLen }, (_, i) => `--nowimg${i + 1}`);

	characterSwiper = new Swiper('#js-characterSwiper', {
		loop: true,
		slidesPerView: 1,
		loopedSlides: 1,
		lazy: { loadPrevNext: true },
		centeredSlides: true,
		speed: 600,
		spaceBetween: 50,
		on: {
			slideChange: function(e) {
				$(".character__thumbItem").removeClass('is-active').eq(e.realIndex).addClass('is-active');
				$characterSection.removeClass(classArrayFor.join(' ')).addClass('--nowimg' + characterChanger[e.realIndex]);
			}
		}
	});

	$(".js-characterPrev").on('click', () => characterSwiper.slidePrev());
	$(".js-characterNext").on('click', () => characterSwiper.slideNext());
	$(".character__thumbItemLink").on('click', function() {
		characterSwiper.slideToLoop($(this).data('character'), 600);
	});

	$document.on('click', '.js-change', function() {
		const $parent = $(this).parents('.character__content');
		const id = $parent.data('charaid');
		let nextImg = characterChanger[id] + 1;
		if (characterChangeLength[id] < nextImg) nextImg = 1;

		characterChanger[id] = nextImg;
		const newClass = '--nowimg' + nextImg;

		$parent.find('.character__img').removeClass(classArrayFor.join(' ')).addClass(newClass);
		$characterSection.removeClass(classArrayFor.join(' ')).addClass(newClass);
	});

	const cid = getParam('cid');
	if (cid) characterSwiper.slideToLoop(cid);
});

// =======================================================
// Intersection Observer (Sections)
// =======================================================
const sections = document.querySelectorAll('.sections');
const sectionIds = Array.from(sections).map(s => s.id).filter(Boolean);

const sectionObserver = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		if (entry.isIntersecting && entry.target.id) {
			sectionIds.forEach(id => $body.removeClass(`is-${id}`));
			$body.addClass(`is-${entry.target.id}`);
		}
	});
}, { rootMargin: '-60% 0px -39% 0px' });

sections.forEach(s => s.id && sectionObserver.observe(s));

// =======================================================
// Data Fetching (News, Movie, MV)
// =======================================================
$(function() {
	// 1. News
	getPosts('posts', 1, 3).done(data => {
		const newsHtml = data.map(v => {
			const d = getYmdHis(v.date);
			return `
				<li class="news__item">
					<a href="./news/detail.html?id=${v.id}" class="news__itemLink">
						<time class="news__itemTime" datetime="${d.Y}-${d.m}-${d.d}">${d.Y}<span><br></span>${d.m}.${d.d}</time>
						<p class="news__itemTitle">${v.title.rendered}</p>
					</a>
				</li>`;
		}).join('');
		$("#js-newsLists").append(newsHtml);
	});

	// 2. Movie
	getPosts('movie', 1, 10).done(data => {
		let switcherHtml = '';
		const movieElem = data.map((v, i) => {
			const ytID = v.acf.youtube_id;
			const bg = ytID ? ` style="background-image:url(https://img.youtube.com/vi/${ytID}/maxresdefault.jpg)"` : '';
			switcherHtml += `
				<li class="movie__swiperSwitcherItem">
					<a href="javascript:;" data-index="${i}" class="movie__swiperSwitcherLink">
						<svg class="movie__swiperSwitcherLink--circle"><circle></circle></svg>
					</a>
				</li>`;
			return `
				<div class="movie__swiper-slide swiper-slide">
					<div class="movie__swiper-slideContent">
						<div class="movie__swiper-slideObj">
							<a href="javascript:;" class="movie__swiper-slideLink js-movieThumb js-moviePlay" data-yt="${ytID}"${bg}>
								<span class="movie__frame"><span class="movie__framein"><span class="movie__playBtn"></span></span></span>
							</a>
						</div>
						<p class="movie__name">${v.title.rendered}</p>
					</div>
				</div>`;
		}).join('');

		$("#js-movieSwiperWrapper").append(movieElem);
		$("#js-movieSwiperSwitchers").append(switcherHtml);

		const $movieSwitchers = $(".movie__swiperSwitcherItem");
		let movieIs = 0, movieStart = false;

		const movieSwiper = new Swiper('#js-movieSwiper', {
			loop: true,
			autoplay: { delay: 6000, disableOnInteraction: false },
			slidesPerView: 'auto',
			centeredSlides: true,
			speed: 600,
			effect: 'coverflow',
			coverflowEffect: { rotate: -45, depth: 220, modifier: 1, stretch: 63, slideShadows: false },
			breakpoints: { 769: { coverflowEffect: { rotate: -45, depth: 300, modifier: 1, stretch: 70, slideShadows: false } } },
			on: {
				slideChange: function(e) {
					if (movieStart) {
						movieIs = e.realIndex;
						$movieSwitchers.removeClass('is-active');
						setTimeout(() => $movieSwitchers.eq(e.realIndex).addClass('is-active'), 500);
					}
				}
			}
		});

		$document.on('click', '.movie__swiperSwitcherLink', function() {
			movieSwiper.slideToLoop($(this).data('index'));
		});

		// Movie Scroll Logic
		const movieSection = document.getElementById('movie');
		if (movieSection) {
			let isPast = false, ticking = false;
			window.addEventListener('scroll', () => {
				if (!ticking) {
					window.requestAnimationFrame(() => {
						const rect = movieSection.getBoundingClientRect();
						const shouldBeActive = (rect.top + rect.height / 2) < (window.innerHeight / 2);
						if (shouldBeActive !== isPast) {
							isPast = shouldBeActive;
							$body.toggleClass('isnot-mask', isPast);
						}
						ticking = false;
					});
					ticking = true;
				}
			}, { passive: true });
		}

		// Movie Sticky Logic
		const stickySentinel = document.querySelector('.sticky-sentinel');
		if (stickySentinel) {
			new IntersectionObserver((entries) => {
				const entry = entries[0];
				if (!entry.isIntersecting) {
					movieStart = true;
					movieSwiper.autoplay.start();
					$movieSwitchers.eq(movieIs).addClass('is-active');
					$body.addClass('is-sticky-started');
				} else {
					movieSwiper.autoplay.stop();
					$movieSwitchers.removeClass('is-active');
					$body.removeClass('is-sticky-started');
				}
			}).observe(stickySentinel);
		}
	});

	// 3. MV
	getPosts('mv', 1, 10).done((data, status, xhr) => {
		const total = parseInt(xhr.getResponseHeader("x-wp-total"), 10) || 0;
		let mvHtml = '';

		if (total < 1) {
			mvHtml = Array.from({ length: 3 }, () => `
				<li class="music__item" style="flex-shrink:0">
					<img src="./assets/img/music/music_nowprinting.png" alt="NOW PRINTING">
				</li>`).join('');
		} else {
			mvHtml = data.map(v => {
				const acf = v.acf;
				let thumb = './assets/img/music/music_nowprinting.png';
				if (acf.mv_thumb?.sizes?.large) thumb = acf.mv_thumb.sizes.large;
				else if (acf.mv_ytid) thumb = `https://img.youtube.com/vi/${acf.mv_ytid}/maxresdefault.jpg`;

				return `
					<li class="music__item swiper-slide">
						<a href="javascript:;" class="music__itemLink js-moviePlay" data-yt="${acf.mv_ytid || ''}" style="background-image:url(${thumb});"></a>
						<p class="music__itemCaption">${v.title.rendered}</p>
					</li>`;
			}).join('');
		}

		$("#js-mvLists").append(mvHtml);

		if (total > 1 && $("#js-musicSwiper").length) {
			new Swiper('#js-musicSwiper', {
				autoplay: { delay: 5000, disableOnInteraction: false },
				loop: true,
				speed: 600,
				slidesPerView: 'auto',
				parallax: true,
				pagination: { el: ".swiper-pagination", clickable: true },
			});
		}
	});
});