
  (function(d) {
    var config = {
      kitId: 'zbs0tzu',
      scriptTimeout: 3000,
      async: true
    },
    h=d.documentElement,t=setTimeout(function(){h.className=h.className.replace(/\bwf-loading\b/g,"")+" wf-inactive";},config.scriptTimeout),tk=d.createElement("script"),f=false,s=d.getElementsByTagName("script")[0],a;h.className+=" wf-loading";tk.src='https://use.typekit.net/'+config.kitId+'.js';tk.async=true;tk.onload=tk.onreadystatechange=function(){a=this.readyState;if(f||a&&a!="complete"&&a!="loaded")return;f=true;clearTimeout(t);try{Typekit.load(config)}catch(e){}};s.parentNode.insertBefore(tk,s)
  })(document);


window.jQuery || document.write('<script src="./assets/js/libs/jquery-3.6.0.min.js"><\/script>')

/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - EASING EQUATIONS
 * 
 * Open source under the BSD License. 
 * 
 * Copyright Â© 2001 Robert Penner
 * All rights reserved.
 *
 * TERMS OF USE - jQuery Easing
 * 
 * Open source under the BSD License. 
 * 
 * Copyright Â© 2008 George McGinley Smith
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
*/
jQuery.easing.jswing=jQuery.easing.swing;jQuery.extend(jQuery.easing,{def:"easeOutQuad",swing:function(e,f,a,h,g){return jQuery.easing[jQuery.easing.def](e,f,a,h,g)},easeInQuad:function(e,f,a,h,g){return h*(f/=g)*f+a},easeOutQuad:function(e,f,a,h,g){return -h*(f/=g)*(f-2)+a},easeInOutQuad:function(e,f,a,h,g){if((f/=g/2)<1){return h/2*f*f+a}return -h/2*((--f)*(f-2)-1)+a},easeInCubic:function(e,f,a,h,g){return h*(f/=g)*f*f+a},easeOutCubic:function(e,f,a,h,g){return h*((f=f/g-1)*f*f+1)+a},easeInOutCubic:function(e,f,a,h,g){if((f/=g/2)<1){return h/2*f*f*f+a}return h/2*((f-=2)*f*f+2)+a},easeInQuart:function(e,f,a,h,g){return h*(f/=g)*f*f*f+a},easeOutQuart:function(e,f,a,h,g){return -h*((f=f/g-1)*f*f*f-1)+a},easeInOutQuart:function(e,f,a,h,g){if((f/=g/2)<1){return h/2*f*f*f*f+a}return -h/2*((f-=2)*f*f*f-2)+a},easeInQuint:function(e,f,a,h,g){return h*(f/=g)*f*f*f*f+a},easeOutQuint:function(e,f,a,h,g){return h*((f=f/g-1)*f*f*f*f+1)+a},easeInOutQuint:function(e,f,a,h,g){if((f/=g/2)<1){return h/2*f*f*f*f*f+a}return h/2*((f-=2)*f*f*f*f+2)+a},easeInSine:function(e,f,a,h,g){return -h*Math.cos(f/g*(Math.PI/2))+h+a},easeOutSine:function(e,f,a,h,g){return h*Math.sin(f/g*(Math.PI/2))+a},easeInOutSine:function(e,f,a,h,g){return -h/2*(Math.cos(Math.PI*f/g)-1)+a},easeInExpo:function(e,f,a,h,g){return(f==0)?a:h*Math.pow(2,10*(f/g-1))+a},easeOutExpo:function(e,f,a,h,g){return(f==g)?a+h:h*(-Math.pow(2,-10*f/g)+1)+a},easeInOutExpo:function(e,f,a,h,g){if(f==0){return a}if(f==g){return a+h}if((f/=g/2)<1){return h/2*Math.pow(2,10*(f-1))+a}return h/2*(-Math.pow(2,-10*--f)+2)+a},easeInCirc:function(e,f,a,h,g){return -h*(Math.sqrt(1-(f/=g)*f)-1)+a},easeOutCirc:function(e,f,a,h,g){return h*Math.sqrt(1-(f=f/g-1)*f)+a},easeInOutCirc:function(e,f,a,h,g){if((f/=g/2)<1){return -h/2*(Math.sqrt(1-f*f)-1)+a}return h/2*(Math.sqrt(1-(f-=2)*f)+1)+a},easeInElastic:function(f,h,e,l,k){var i=1.70158;var j=0;var g=l;if(h==0){return e}if((h/=k)==1){return e+l}if(!j){j=k*0.3}if(g<Math.abs(l)){g=l;var i=j/4}else{var i=j/(2*Math.PI)*Math.asin(l/g)}return -(g*Math.pow(2,10*(h-=1))*Math.sin((h*k-i)*(2*Math.PI)/j))+e},easeOutElastic:function(f,h,e,l,k){var i=1.70158;var j=0;var g=l;if(h==0){return e}if((h/=k)==1){return e+l}if(!j){j=k*0.3}if(g<Math.abs(l)){g=l;var i=j/4}else{var i=j/(2*Math.PI)*Math.asin(l/g)}return g*Math.pow(2,-10*h)*Math.sin((h*k-i)*(2*Math.PI)/j)+l+e},easeInOutElastic:function(f,h,e,l,k){var i=1.70158;var j=0;var g=l;if(h==0){return e}if((h/=k/2)==2){return e+l}if(!j){j=k*(0.3*1.5)}if(g<Math.abs(l)){g=l;var i=j/4}else{var i=j/(2*Math.PI)*Math.asin(l/g)}if(h<1){return -0.5*(g*Math.pow(2,10*(h-=1))*Math.sin((h*k-i)*(2*Math.PI)/j))+e}return g*Math.pow(2,-10*(h-=1))*Math.sin((h*k-i)*(2*Math.PI)/j)*0.5+l+e},easeInBack:function(e,f,a,i,h,g){if(g==undefined){g=1.70158}return i*(f/=h)*f*((g+1)*f-g)+a},easeOutBack:function(e,f,a,i,h,g){if(g==undefined){g=1.70158}return i*((f=f/h-1)*f*((g+1)*f+g)+1)+a},easeInOutBack:function(e,f,a,i,h,g){if(g==undefined){g=1.70158}if((f/=h/2)<1){return i/2*(f*f*(((g*=(1.525))+1)*f-g))+a}return i/2*((f-=2)*f*(((g*=(1.525))+1)*f+g)+2)+a},easeInBounce:function(e,f,a,h,g){return h-jQuery.easing.easeOutBounce(e,g-f,0,h,g)+a},easeOutBounce:function(e,f,a,h,g){if((f/=g)<(1/2.75)){return h*(7.5625*f*f)+a}else{if(f<(2/2.75)){return h*(7.5625*(f-=(1.5/2.75))*f+0.75)+a}else{if(f<(2.5/2.75)){return h*(7.5625*(f-=(2.25/2.75))*f+0.9375)+a}else{return h*(7.5625*(f-=(2.625/2.75))*f+0.984375)+a}}}},easeInOutBounce:function(e,f,a,h,g){if(f<g/2){return jQuery.easing.easeInBounce(e,f*2,0,h,g)*0.5+a}return jQuery.easing.easeOutBounce(e,f*2-g,0,h,g)*0.5+h*0.5+a}});


window.jQuery.easing.def || document.write('<script src="./assets/js/libs/jquery.easing.min.js"><\/script>')

const cont = 'top';

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

const rt = $('body').data('rt');
const epUrl='https://www.news.cho-kaguyahime.com/wp-json/wp/v2/';
const getParam=(name,url)=>{
	if(!url)url=window.location.href;
	name=name.replace(/[\[\]]/g,"\\$&");
	var regex=new RegExp("[?&]"+name+"(=([^&#]*)|&|#|$)"),
	results=regex.exec(url);
	if(!results)return null;
	if(!results[2])return '';
	return decodeURIComponent(results[2].replace(/\+/g," "));
}
const getPosts=(_ep,_page,_limit=10,_args={})=>{
	_args.per_page=_limit;
	_args.page=_page;
	return $.ajax({
		url:epUrl+_ep+'?acf_format=standard&context=embed',
		type:'GET',
		dataType:'json',
		timeout:10000,
		cache:false,
		data:_args
	});
}
const getPost=(_ep,_id)=>{
	return $.ajax({
		url:epUrl+_ep+'/'+_id+'?acf_format=standard',
		type:'GET',
		dataType:'json',
		timeout:10000,
	});
}
const getYmdHis=(_date)=>{
	var dateobj=new Date(_date);
	return {
		Y:dateobj.getFullYear().toString(),
		m:(dateobj.getMonth()+1).toString().padStart(2,'0'),
		d:dateobj.getDate().toString().padStart(2,'0'),
		H:dateobj.getHours().toString().padStart(2,'0'),
		i:dateobj.getMinutes().toString().padStart(2,'0'),
		s:dateobj.getSeconds().toString().padStart(2,'0')
	};
}
// Anchor Smooth Scroll
$(document).on('click','.js-navCharacter',function(){
	const cid = $(this).data('cid');
	console.log(cid);
	if($("#character")[0]){
		characterSwiper.slideToLoop(cid);
		var speed = 1000;
		var target = $("#character");
		var position = target.offset().top;
		$('body,html').animate({scrollTop:position}, speed, 'easeOutQuart');
		$(".js-menu,.gnav").removeClass('is-active');
		$("#js-gnavMenuLabel").text('MENU');
		$("html,body").css({overflow:'visible'})
		}
})
$(".js-anchor").on('click', function(){
	var speed = 1000;
	var href= $(this).attr("href");
	var target = $(href == "#" || href == "" ? 'html' : href);
	var ofs = 0;
	if(href=="#movie"){
		ofs = 150;
	}
	var position = target.offset().top + ofs;
	$('body,html').animate({scrollTop:position}, speed, 'easeOutQuart');
	$(".js-menu,.gnav").removeClass('is-active');
	$("#js-gnavMenuLabel").text('MENU');
	$("html,body").css({overflow:'visible'})
	return false;
});
// Menu
$(".js-menu").on('click', function(){
	$(this).toggleClass('is-active');
	if($(this).hasClass('is-active')){
		$(".gnav").addClass('is-active');
		$("html,body").css({overflow:'hidden'});
		$("#js-gnavMenuLabel").text('CLOSE');
	} else {
		$(".gnav").removeClass('is-active');
		$("html,body").css({overflow:'visible'})
		$("#js-gnavMenuLabel").text('MENU');
	}
});

if($('.js-movieThumb')[0]){
	$('.js-movieThumb').each(function(i,v){
		let ytID = $(this).data('yt');
		if(ytID){
			$(this).css({'background-image':'url(https://img.youtube.com/vi/'+ytID+'/maxresdefault.jpg)'});
		}
	})
}
$(document).on('click','.js-moviePlay',function(){
	let ytID = $(this).data('yt');
	$("#movieModal").show();
	$(".modal__movieContent iframe").attr('src','https://www.youtube.com/embed/'+ytID+'?autoplay=1');
		$("html,body").css({'overflow':'hidden'});
		$('#movieModal .modal__inner').fadeIn(500);
});
$(".js-modalClose_movie").on('click',function(){
	$("#movieModal").fadeOut(500,'linear',function(){
		$("html,body").css({overflow:'visible'})
		$(".modal__movieContent iframe").attr('src','');
		$('#movieModal .modal__inner').hide();
	});
});
$(document).on('click','.js-commentOpen',function(){
	let commentName = $(this).data('comment');
	$("#commentModal").show();
	$("#js-modalCommentContent").load(rt+'comment/'+commentName+'.html',function(){
		$("html,body").css({'overflow':'hidden'});
		$('#commentModal .modal__inner').fadeIn(500);
	})
});
$(".js-modalClose_comment").on('click',function(){
	$("#commentModal").fadeOut(500,'linear',function(){
		$("html,body").css({overflow:'visible'})
		$("#js-modalCommentContent").html('');
		$('#commentModal .modal__inner').hide();
	});
});
$(function(){
	getPosts('posts',1,1).done(function(data,status,xhr){
		data.forEach((v)=>{
			var hndate=getYmdHis(v.date);
			$("#js-hotnews").append(
				'<a href="'+tPath+'news/detail.html?id='+v.id+'" class="gnav__hotTopicsLink">'+
					'<time class="gnav__hotTopicsItemTime" datetime="'+hndate.Y+'-'+hndate.m+'-'+hndate.d+'">'+hndate.Y+'<span><br></span>'+hndate.m+'.'+hndate.d+'</time>'+
					'<p class="gnav__hotTopicsItemTitle">'+v.title.rendered+'</p>'+
				'</a>'
			);
		})
	}).fail(function(){
		console.log('[ERROR]Failed to get news list');
	});
})
$(window).on('load',function(){
	let hs = location.hash;
	if(hs && $(hs)[0]){
		$("#loading").fadeOut(1000,'linear',function(){
			$("#loading").remove();
		});
		$("#fv").addClass('ani2');
	}else{
		$("html,body").animate({scrollTop:0},10);
		let delayTime = 500;
		if(!rt == './'){
			delayTime = 200;
		}
		setTimeout(()=>{
			$("#loading").addClass('ani1');
			setTimeout(()=>{
				$("#loading").fadeOut(1500,'linear',function(){
					$("#loading").remove();
				});
				setTimeout(()=>{
					$("#fv").addClass('ani2');
				},10);
			},1000)
		},delayTime)
	}
});


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