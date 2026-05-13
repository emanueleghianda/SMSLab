(function(){
  function initFeed(root){
    if(!root||root.getAttribute("data-smslab-ready")==="1")return;
    root.setAttribute("data-smslab-ready","1");
    var prefix=root.getAttribute("data-prefix")||"igfeed";
    var tracking=root.getAttribute("data-tracking")==="1";
    function setED(post,key,val){
      if(!tracking)return;
      var field=prefix+"_post"+post+"_"+key,v=String(val);
      if(window.Qualtrics&&Qualtrics.SurveyEngine){
        if(typeof Qualtrics.SurveyEngine.setJSEmbeddedData==="function")Qualtrics.SurveyEngine.setJSEmbeddedData(field,v);
        if(typeof Qualtrics.SurveyEngine.setEmbeddedData==="function")Qualtrics.SurveyEngine.setEmbeddedData(field,v);
      }
    }
    function addLiveComment(list,text){
      var row=document.createElement("div");
      row.className="igfeed-livecomment";
      row.innerHTML='<div class="igfeed-commentavatar igfeed-commentavatar-fallback">YOU</div><div class="igfeed-commentbody"><div class="igfeed-commenttext"><strong>You</strong> '+String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")+"</div></div>";
      list.appendChild(row);
    }
    function adjustCount(postEl,key,delta){
      var el=postEl.querySelector('[data-count="'+key+'"]');
      if(!el)return;
      var value=el.getAttribute("data-value");
      if(value==="")return;
      var next=Math.max(0,Number(value)+delta);
      el.setAttribute("data-value",String(next));
      el.textContent=next.toLocaleString("en-US");
    }
    root.querySelectorAll(".igfeed-post").forEach(function(postEl){
      var post=postEl.getAttribute("data-post");
      setED(post,"like",0);
      setED(post,"comment",0);
      setED(post,"comment_submitted",0);
      setED(post,"comment_text","");
      setED(post,"repost",0);
      setED(post,"direct",0);
      setED(post,"save",0);
      var btnLike=postEl.querySelector('[data-action="like"]'),btnComment=postEl.querySelector('[data-action="comment"]'),btnRepost=postEl.querySelector('[data-action="repost"]'),btnDirect=postEl.querySelector('[data-action="direct"]'),btnSave=postEl.querySelector('[data-action="save"]');
      if(btnLike){
        var sLike=0;
        btnLike.addEventListener("click",function(){
          sLike=sLike?0:1;
          btnLike.classList.toggle("is-liked",!!sLike);
          adjustCount(postEl,"likes",sLike?1:-1);
          setED(post,"like",sLike);
        });
      }
      if(btnComment){
        var sComment=0;
        btnComment.addEventListener("click",function(){
          sComment=sComment?0:1;
          btnComment.classList.toggle("is-commented",!!sComment);
          setED(post,"comment",sComment);
          var commentsArea=postEl.querySelector(".igfeed-commentsarea");
          if(commentsArea)commentsArea.classList.toggle("is-visible",!!sComment);
          var input=postEl.querySelector(".igfeed-commentinput");
          if(input&&sComment)input.focus();
        });
      }
      if(btnRepost){
        var sRepost=0;
        btnRepost.addEventListener("click",function(){
          sRepost=sRepost?0:1;
          btnRepost.classList.toggle("is-reposted",!!sRepost);
          adjustCount(postEl,"reposts",sRepost?1:-1);
          setED(post,"repost",sRepost);
        });
      }
      if(btnDirect){
        var sDirect=0;
        btnDirect.addEventListener("click",function(){
          sDirect=sDirect?0:1;
          btnDirect.classList.toggle("is-directed",!!sDirect);
          setED(post,"direct",sDirect);
        });
      }
      if(btnSave){
        var sSave=0;
        btnSave.addEventListener("click",function(){
          sSave=sSave?0:1;
          btnSave.classList.toggle("is-saved",!!sSave);
          setED(post,"save",sSave);
        });
      }
      var follow=postEl.querySelector('[data-action="follow"]');
      if(follow){
        setED(post,"follow",0);
        var f=0;
        follow.addEventListener("click",function(){
          f=f?0:1;
          follow.classList.toggle("is-following",!!f);
          follow.textContent=f?"Following":"Follow";
          setED(post,"follow",f);
        });
      }
      var cta=postEl.querySelector('[data-action="cta_click"]');
      if(cta){
        setED(post,"cta_click",0);
        cta.addEventListener("click",function(){setED(post,"cta_click",1)});
      }
      var aiBtn=postEl.querySelector('[data-action="ai_info_button"]'),aiBox=postEl.querySelector(".igfeed-aibox"),aiClose=postEl.querySelector('[data-action="ai_close"]');
      if(aiBtn&&aiBox){
        setED(post,"ai_info_opened",0);
        aiBtn.addEventListener("click",function(e){
          e.stopPropagation();
          aiBox.classList.toggle("is-visible");
          if(aiBox.classList.contains("is-visible"))setED(post,"ai_info_opened",1);
        });
        if(aiClose)aiClose.addEventListener("click",function(e){e.stopPropagation();aiBox.classList.remove("is-visible")});
        document.addEventListener("click",function(e){if(!aiBox.contains(e.target)&&!aiBtn.contains(e.target))aiBox.classList.remove("is-visible")});
      }
      var counter=postEl.querySelector(".igfeed-counter"),carousel=postEl.querySelector(".igfeed-carousel"),prev=postEl.querySelector(".igfeed-prev"),next=postEl.querySelector(".igfeed-next"),dots=postEl.querySelectorAll(".igfeed-dot");
      if(counter&&carousel){
        var total=dots.length||1,current=1;
        setED(post,"carousel_slide",1);
        setED(post,"carousel_second_seen",0);
        function upd(n){
          current=n;
          counter.textContent=n+"/"+total;
          dots.forEach(function(dot,i){dot.classList.toggle("on",i+1===n)});
          setED(post,"carousel_slide",n);
          if(n>1)setED(post,"carousel_second_seen",1);
        }
        function go(n){carousel.scrollTo({left:(n-1)*carousel.clientWidth,behavior:"smooth"});upd(n)}
        if(prev)prev.addEventListener("click",function(){go(current===1?total:current-1)});
        if(next)next.addEventListener("click",function(){go(current===total?1:current+1)});
        carousel.addEventListener("scroll",function(){
          window.clearTimeout(carousel._t);
          carousel._t=window.setTimeout(function(){
            var n=Math.round(carousel.scrollLeft/carousel.clientWidth)+1;
            n=Math.max(1,Math.min(total,n));
            upd(n);
          },80);
        });
      }
      var input=postEl.querySelector(".igfeed-commentinput"),submit=postEl.querySelector(".igfeed-commentsubmit"),list=postEl.querySelector(".igfeed-commentlist");
      if(input&&submit&&list){
        function submitComment(){
          var txt=(input.value||"").trim();
          if(!txt)return;
          var commentsArea=postEl.querySelector(".igfeed-commentsarea");
          if(commentsArea)commentsArea.classList.add("is-visible");
          addLiveComment(list,txt);
          adjustCount(postEl,"comments",1);
          setED(post,"comment_submitted",1);
          setED(post,"comment_text",txt);
          input.value="";
        }
        submit.addEventListener("click",submitComment);
        input.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();submitComment()}});
      }
    });
  }
  document.querySelectorAll("[data-smslab-igfeed]").forEach(initFeed);
})();
