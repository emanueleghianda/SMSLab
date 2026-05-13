(function(){
  function initRoot(root){
    if(!root||root.getAttribute("data-smslab-ready")==="1")return;
    root.setAttribute("data-smslab-ready","1");
    var prefix=root.getAttribute("data-prefix")||"feed";
    var tracking=root.getAttribute("data-tracking")==="1";
    var platform=root.getAttribute("data-platform")||"";
    function setED(post,key,val){
      if(!tracking)return;
      var v=String(val),field=prefix+"_post"+post+"_"+key;
      if(window.Qualtrics&&Qualtrics.SurveyEngine){
        if(typeof Qualtrics.SurveyEngine.setJSEmbeddedData==="function")Qualtrics.SurveyEngine.setJSEmbeddedData(field,v);
        if(typeof Qualtrics.SurveyEngine.setEmbeddedData==="function")Qualtrics.SurveyEngine.setEmbeddedData(field,v);
      }
    }
    function textEsc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
    function addComment(postEl,txt){
      var list=postEl.querySelector(".sg-comment-list");
      if(!list)return;
      var row=document.createElement("div");
      row.className="sg-comment";
      row.innerHTML='<div class="sg-comment-avatar sg-avatar-fallback">YOU</div><div class="sg-comment-bubble"><strong>You</strong><span>'+textEsc(txt)+"</span></div>";
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
    function toggleCounted(btn,postEl,post,key,countKey,cls){
      if(!btn)return;
      var on=0;
      btn.addEventListener("click",function(){
        on=on?0:1;
        btn.classList.toggle(cls,!!on);
        if(countKey)adjustCount(postEl,countKey,on?1:-1);
        setED(post,key,on);
      });
    }
    function activateOnce(btn,postEl,post,key,countKey,cls){
      if(!btn)return;
      var done=0;
      btn.addEventListener("click",function(){
        btn.classList.add(cls);
        if(!done&&countKey)adjustCount(postEl,countKey,1);
        done=1;
        setED(post,key,1);
      });
    }
    root.querySelectorAll(".sg-post").forEach(function(postEl){
      var post=postEl.getAttribute("data-post");
      ["reaction","reaction_value","comment_opened","comment_submitted","comment_text","reply_opened","reply_submitted","reply_text","share","send","repost","like","bookmark","cta_click","info_opened","follow"].forEach(function(k){
        setED(post,k,k.indexOf("text")>-1||k.indexOf("value")>-1?"":0);
      });
      var reactionBtn=postEl.querySelector('[data-action="reaction"]'),reactionLabel=postEl.querySelector("[data-reaction-label]"),reactionIcon=postEl.querySelector(".sg-reaction-main-icon"),tray=postEl.querySelector(".sg-reaction-tray"),reactionValue="";
      function setReaction(label,html,color){
        var was=!!reactionValue;
        reactionValue=label;
        if(!was)adjustCount(postEl,"reactions",1);
        if(reactionBtn){
          reactionBtn.classList.add("is-reacted");
          reactionBtn.style.color=color||"";
        }
        if(reactionLabel)reactionLabel.textContent=label;
        if(reactionIcon)reactionIcon.innerHTML=html;
        setED(post,"reaction",1);
        setED(post,"reaction_value",label);
      }
      if(reactionBtn){
        reactionBtn.addEventListener("click",function(e){
          e.stopPropagation();
          if(tray)tray.classList.toggle("is-open");
          else setReaction("Like",reactionBtn.getAttribute("data-default-icon")||"",platform==="linkedin"?"#0a66c2":"#1877f2");
        });
      }
      postEl.querySelectorAll("[data-reaction]").forEach(function(btn){
        btn.addEventListener("click",function(e){
          e.stopPropagation();
          setReaction(btn.getAttribute("data-reaction"),btn.getAttribute("data-icon"),btn.getAttribute("data-color"));
          if(tray)tray.classList.remove("is-open");
        });
      });
      var commentBtn=postEl.querySelector('[data-action="comment"],[data-action="reply"]'),comments=postEl.querySelector("[data-comments]");
      if(commentBtn&&comments){
        var open=0,field=commentBtn.getAttribute("data-action")==="reply"?"reply_opened":"comment_opened";
        commentBtn.addEventListener("click",function(){
          open=open?0:1;
          comments.classList.toggle("is-open",!!open);
          commentBtn.classList.toggle("is-commented",!!open);
          setED(post,field,open);
          var input=comments.querySelector("[data-comment-input]");
          if(input&&open)input.focus();
        });
      }
      var submit=postEl.querySelector("[data-comment-submit]"),input=postEl.querySelector("[data-comment-input]");
      if(submit&&input){
        function submitComment(){
          var txt=(input.value||"").trim();
          if(!txt)return;
          if(comments)comments.classList.add("is-open");
          addComment(postEl,txt);
          var reply=platform==="x";
          adjustCount(postEl,reply?"replies":"comments",1);
          setED(post,reply?"reply_submitted":"comment_submitted",1);
          setED(post,reply?"reply_text":"comment_text",txt);
          input.value="";
        }
        submit.addEventListener("click",submitComment);
        input.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();submitComment()}});
      }
      toggleCounted(postEl.querySelector('[data-action="like"]'),postEl,post,"like","likes","is-liked");
      toggleCounted(postEl.querySelector('[data-action="bookmark"]'),postEl,post,"bookmark","bookmarks","is-bookmarked");
      toggleCounted(postEl.querySelector('[data-action="repost"]'),postEl,post,"repost","reposts","is-reposted");
      activateOnce(postEl.querySelector('[data-action="share"]'),postEl,post,"share",platform==="facebook"?"shares":"", "is-shared");
      activateOnce(postEl.querySelector('[data-action="send"]'),postEl,post,"send","", "is-sent");
      var follow=postEl.querySelector('[data-action="follow"]');
      if(follow){
        var f=0,off=follow.getAttribute("data-off-label")||"Follow",on=follow.getAttribute("data-on-label")||"Following";
        follow.addEventListener("click",function(){
          f=f?0:1;
          follow.textContent=f?on:off;
          follow.classList.toggle("is-active",!!f);
          setED(post,"follow",f);
        });
      }
      var info=postEl.querySelector('[data-action="info"]'),infoPop=postEl.querySelector(".sg-info-popover");
      if(info&&infoPop){
        info.addEventListener("click",function(e){
          e.stopPropagation();
          infoPop.classList.toggle("is-open");
          if(infoPop.classList.contains("is-open"))setED(post,"info_opened",1);
        });
      }
      var cta=postEl.querySelector('[data-action="cta"]');
      if(cta)cta.addEventListener("click",function(){setED(post,"cta_click",1)});
      postEl.querySelectorAll("[data-close-popover]").forEach(function(btn){
        btn.addEventListener("click",function(e){
          e.stopPropagation();
          var pop=btn.closest(".sg-popover");
          if(pop)pop.classList.remove("is-open");
        });
      });
    });
    document.addEventListener("click",function(){
      root.querySelectorAll(".sg-popover.is-open,.sg-reaction-tray.is-open").forEach(function(p){p.classList.remove("is-open")});
    });
  }
  document.querySelectorAll("[data-smslab-social-feed]").forEach(initRoot);
})();
