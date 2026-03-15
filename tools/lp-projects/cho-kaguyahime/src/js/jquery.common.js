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
