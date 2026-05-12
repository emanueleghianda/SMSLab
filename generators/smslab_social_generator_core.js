(function(){
  const cfg=window.SMSLAB_PLATFORM;
  if(!cfg) return;
  const $=id=>document.getElementById(id);
  let postUid=0;

  function esc(s){return String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
  function attr(s){return esc(s)}
  function pref(){return String($("prefix").value||cfg.defaultPrefix).trim().replace(/[^a-zA-Z0-9_]/g,"_").replace(/^_+/,"")||cfg.defaultPrefix}
  function richText(s){return esc(s).replace(/(^|\s)([#@][a-zA-Z0-9_][a-zA-Z0-9_.-]*)/g,'$1<span class="sg-tag">$2</span>').replaceAll("\n","<br>")}
  function fmtCount(v){const raw=String(v||"").trim();if(!raw)return"";const n=Number(raw.replaceAll(",",""));return Number.isFinite(n)?n.toLocaleString("en-US"):raw}
  function numericValue(v){const raw=String(v||"").trim().replaceAll(",","");const n=Number(raw);return Number.isFinite(n)&&raw!==""?String(n):""}
  function feedSettings(){return{title:($("feedTitle").value.trim()||cfg.feedTitle),prefix:pref(),track:$("track").checked,jsprefix:$("jsprefix").checked}}
  function postValue(box,k){const x=box.querySelector(`[data-k="${k}"]`);if(!x)return"";return x.type==="checkbox"?x.checked:x.value}

  const reactionMap={
    Like:{icon:"&#128077;",color:"#1877f2"},
    Love:{icon:"&#10084;&#65039;",color:"#f3425f"},
    Care:{icon:"&#129392;",color:"#f7b125"},
    Haha:{icon:"&#128514;",color:"#f7b125"},
    Wow:{icon:"&#128558;",color:"#f7b125"},
    Sad:{icon:"&#128546;",color:"#f7b125"},
    Angry:{icon:"&#128545;",color:"#e9710f"},
    Celebrate:{icon:"&#127881;",color:"#915907"},
    Support:{icon:"&#128588;",color:"#6dae4f"},
    Insightful:{icon:"&#128161;",color:"#f5bb5c"},
    Funny:{icon:"&#128514;",color:"#8f5849"}
  };

  const uiIcons={
    comment:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.7 8.7 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5a8.5 8.5 0 0 1 17 0z"/></svg>',
    share:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/></svg>',
    send:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>',
    repost:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    reply:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.7 8.7 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5a8.5 8.5 0 0 1 17 0z"/></svg>',
    like:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6c-1.8-1.7-4.7-1.5-6.4.3L12 7.4 9.6 4.9C7.9 3.1 5 2.9 3.2 4.6c-2 1.9-2.1 5-.2 7l9 8.9 9-8.9c1.9-2 1.8-5.1-.2-7z"/></svg>',
    bookmark:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>',
    more:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>'
  };

  function setPageText(){
    document.title=cfg.pageTitle;
    $("pageTitle").textContent=cfg.pageTitle;
    $("pageIntro").textContent=cfg.pageIntro;
    $("feedTitle").placeholder=cfg.feedTitle;
    $("prefix").value=cfg.defaultPrefix;
    $("postHint").textContent=cfg.postHint;
    $("qualtricsLead").textContent=`The generated ${cfg.shortName}-style feed can be pasted into one Qualtrics Descriptive Text question.`;
  }

  function addSeedComment(box, defaults={}){
    const holder=box.querySelector(".seed-comments-holder");
    const row=document.createElement("div");
    row.className="seedcomment";
    row.innerHTML=`
      <div class="row-between"><strong>Prewritten comment</strong><button type="button" class="danger seed-remove">Remove comment</button></div>
      <div class="grid">
        <div class="field"><label>Comment author</label><input data-c="username" placeholder="${attr(cfg.commentAuthorPlaceholder)}" value="${attr(defaults.username||"")}"></div>
        <div class="field"><label>Comment profile image URL</label><input data-c="avatar" placeholder="Paste profile image URL" value="${attr(defaults.avatar||"")}"></div>
      </div>
      <div class="field"><label>Comment text</label><textarea data-c="text" placeholder="${attr(cfg.commentTextPlaceholder)}">${esc(defaults.text||"")}</textarea></div>`;
    holder.appendChild(row);
    row.querySelectorAll("input,textarea").forEach(x=>{x.addEventListener("input",update);x.addEventListener("change",update)});
    row.querySelector(".seed-remove").onclick=()=>{row.remove();update()};
    update();
  }

  function visibilityOptions(selected){
    return (cfg.visibilityOptions||[]).map(o=>`<option value="${attr(o.value)}"${o.value===selected?" selected":""}>${esc(o.label)}</option>`).join("");
  }

  function countFields(defaults){
    return cfg.counts.map(c=>`
      <div class="field"><label>${esc(c.label)}</label><input data-count="${attr(c.key)}" placeholder="${attr(c.placeholder||"")}" value="${attr(defaults.counts?.[c.key]||"")}"></div>`).join("");
  }

  function addPost(defaults={}, afterBox=null){
    postUid++;
    const box=document.createElement("div");
    box.className="postform";
    box.dataset.uid=postUid;
    box.innerHTML=`
      <div class="posthead">
        <h3>Post</h3>
        <button type="button" class="danger remove-post">Remove</button>
      </div>

      <div class="subcard">
        <h3>Post setup</h3>
        <div class="grid">
          <div class="field"><label>${esc(cfg.labels.name)}</label><input data-k="name" placeholder="${attr(cfg.placeholders.name)}" value="${attr(defaults.name||"")}"></div>
          ${cfg.showHandle===false?"":`<div class="field"><label>${esc(cfg.labels.handle)}</label><input data-k="handle" placeholder="${attr(cfg.placeholders.handle)}" value="${attr(defaults.handle||"")}"></div>`}
          <div class="field"><label>Timestamp</label><input data-k="time" placeholder="${attr(cfg.placeholders.time)}" value="${attr(defaults.time||"")}"></div>
          ${cfg.showVisibility===false?"":`<div class="field"><label>${esc(cfg.labels.visibility)}</label><select data-k="visibility">${visibilityOptions(defaults.visibility||((cfg.visibilityOptions&&cfg.visibilityOptions[0]&&cfg.visibilityOptions[0].value)||""))}</select></div>`}
          <div class="field" style="grid-column:1/-1"><label>Profile image URL</label><input data-k="avatar" placeholder="Paste profile image URL" value="${attr(defaults.avatar||"")}"></div>
        </div>
        <div class="field"><label>${esc(cfg.labels.body)}</label><textarea data-k="body" placeholder="${attr(cfg.placeholders.body)}">${esc(defaults.body||"")}</textarea></div>
        <div class="field"><label>Media URL(s)</label><textarea data-k="imgs" placeholder="Paste one image URL per line. Leave empty for a text-only post.">${esc(defaults.imgs||"")}</textarea></div>
      </div>

      <div class="subcard">
        <h3>Labels, buttons, and metrics</h3>
        <div class="toggle"><span>${esc(cfg.labels.followToggle)}</span><input data-k="follow" type="checkbox"></div>
        <div class="toggle"><span>Show verified badge</span><input data-k="verified" type="checkbox"></div>

        <div class="toggle"><span>${esc(cfg.labels.promoToggle)}</span><input data-k="spon" type="checkbox"></div>
        <div class="field" data-box="spon" style="display:none"><label>${esc(cfg.labels.promoLabel)}</label><input data-k="sponText" value="${attr(defaults.sponText||"")}"></div>

        <div class="toggle"><span>Show clickable information label</span><input data-k="info" type="checkbox"></div>
        <div data-box="info" style="display:none">
          <div class="field"><label>Information label</label><input data-k="infoLabel" value="${attr(defaults.infoLabel||"")}"></div>
          <div class="field"><label>Information pop-up text</label><input data-k="infoText" value="${attr(defaults.infoText||"")}"></div>
        </div>

        <div class="toggle"><span>Show call-to-action banner</span><input data-k="cta" type="checkbox"></div>
        <div data-box="cta" style="display:none">
          <div class="field"><label>CTA text</label><input data-k="ctaText" value="${attr(defaults.ctaText||"")}"></div>
          <div class="field"><label>CTA link</label><input data-k="ctaUrl" placeholder="https://example.com" value="${attr(defaults.ctaUrl||"")}"></div>
        </div>

        <div class="count-grid">${countFields(defaults)}</div>

        <div class="subcard" style="margin-top:12px">
          <div class="row-between"><h3 style="margin:0">Prewritten comments</h3><button type="button" class="secondary add-seed-comment">Add comment</button></div>
          <p class="small">These comments appear when the participant opens the comment/reply area.</p>
          <div class="seed-comments-holder"></div>
        </div>
      </div>

      <div class="btns" style="margin-top:12px">
        <button type="button" class="secondary add-post-below">Add post</button>
      </div>`;
    if(afterBox&&afterBox.parentNode) afterBox.parentNode.insertBefore(box,afterBox.nextSibling);
    else $("posts").appendChild(box);

    if(defaults.follow) box.querySelector('[data-k="follow"]').checked=true;
    if(defaults.verified) box.querySelector('[data-k="verified"]').checked=true;
    if(defaults.spon) box.querySelector('[data-k="spon"]').checked=true;
    if(defaults.info) box.querySelector('[data-k="info"]').checked=true;
    if(defaults.cta) box.querySelector('[data-k="cta"]').checked=true;

    box.querySelectorAll("input,textarea,select").forEach(x=>{x.addEventListener("input",()=>{togglePostBoxes(box);update()});x.addEventListener("change",()=>{togglePostBoxes(box);update()})});
    box.querySelector(".remove-post").onclick=()=>{box.remove();renumberPosts();update()};
    box.querySelector(".add-post-below").onclick=()=>addPost({},box);
    box.querySelector(".add-seed-comment").onclick=()=>addSeedComment(box);
    (defaults.seedComments||[]).forEach(c=>addSeedComment(box,c));
    togglePostBoxes(box);
    renumberPosts();
    update();
  }

  function togglePostBoxes(box){
    const show=(key,on)=>{const el=box.querySelector(`[data-box="${key}"]`);if(el)el.style.display=on?"block":"none"};
    show("spon",postValue(box,"spon"));
    show("info",postValue(box,"info"));
    show("cta",postValue(box,"cta"));
  }

  function renumberPosts(){[...document.querySelectorAll(".postform")].forEach((box,i)=>{box.querySelector(".posthead h3").textContent=`Post ${i+1}`})}
  function getSeedComments(box){
    return [...box.querySelectorAll(".seedcomment")].map(row=>({
      username:(row.querySelector('[data-c="username"]')?.value||"").trim(),
      avatar:(row.querySelector('[data-c="avatar"]')?.value||"").trim(),
      text:(row.querySelector('[data-c="text"]')?.value||"").trim()
    })).filter(c=>c.username||c.avatar||c.text);
  }
  function getCounts(box){
    const out={};
    box.querySelectorAll("[data-count]").forEach(input=>out[input.dataset.count]=(input.value||"").trim());
    return out;
  }
  function getPosts(){
    return [...document.querySelectorAll(".postform")].map((box,i)=>({
      idx:i+1,
      name:postValue(box,"name").trim(),
      handle:postValue(box,"handle").trim(),
      time:postValue(box,"time").trim(),
      visibility:postValue(box,"visibility").trim(),
      avatar:postValue(box,"avatar").trim(),
      body:postValue(box,"body"),
      imgs:postValue(box,"imgs").split("\n").map(x=>x.trim()).filter(Boolean),
      follow:postValue(box,"follow"),
      verified:postValue(box,"verified"),
      spon:postValue(box,"spon"),
      sponText:postValue(box,"sponText").trim()||cfg.defaults.promoText||"",
      info:postValue(box,"info"),
      infoLabel:postValue(box,"infoLabel").trim()||cfg.defaults.infoLabel||"",
      infoText:postValue(box,"infoText").trim()||cfg.defaults.infoText||"",
      cta:postValue(box,"cta"),
      ctaText:postValue(box,"ctaText").trim()||cfg.defaults.ctaText||"",
      ctaUrl:postValue(box,"ctaUrl").trim(),
      counts:getCounts(box),
      seedComments:getSeedComments(box)
    }));
  }

  function fieldNames(){
    const s=feedSettings();
    if(!s.track) return [];
    const out=[];
    getPosts().forEach(p=>{
      const base=`${s.jsprefix?"__js_":""}${s.prefix}_post${p.idx}_`;
      cfg.tracking.always.forEach(f=>out.push(base+f));
      if(p.follow) out.push(base+cfg.tracking.followField);
      if(p.cta) out.push(base+"cta_click");
      if(p.info) out.push(base+"info_opened");
    });
    return out;
  }

  function fallbackName(p){return p.name||cfg.defaults.name||"Name"}
  function avatar(p, cls){
    const name=fallbackName(p);
    return p.avatar?`<img class="${cls}" src="${attr(p.avatar)}" alt="Profile image">`:`<div class="${cls} sg-avatar-fallback">${esc(name.slice(0,2).toUpperCase())}</div>`;
  }
  function verified(p){return p.verified?`<span class="sg-verified" title="Verified account" aria-label="Verified account"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M7.8 12.4l2.7 2.7 5.8-6.2"></path></svg></span>`:""}
  function meta(parts){return parts.filter(Boolean).map(esc).join(" &#183; ")}
  function postText(p){return p.body?`<div class="sg-text">${richText(p.body)}</div>`:""}
  function mediaGrid(p){
    if(!p.imgs.length) return "";
    const many=p.imgs.length>1;
    return `<div class="sg-media ${many?"sg-media-many":""}">${p.imgs.slice(0,4).map((url,i)=>`<div class="sg-media-cell"><img src="${attr(url)}" alt="${esc(cfg.shortName)} feed post ${p.idx} media ${i+1}">${many&&i===3&&p.imgs.length>4?`<span class="sg-media-more">+${p.imgs.length-4}</span>`:""}</div>`).join("")}</div>`;
  }
  function countNode(key,value,label=""){
    if(!value) return "";
    return `<span class="sg-count-part"><span data-count="${attr(key)}" data-value="${attr(numericValue(value))}">${esc(fmtCount(value))}</span>${label?` ${esc(label)}`:""}</span>`;
  }
  function commentsMarkup(p, replyMode=false){
    const seed=(p.seedComments||[]).map(c=>`<div class="sg-comment"><div>${avatar({name:c.username,avatar:c.avatar},"sg-comment-avatar")}</div><div class="sg-comment-bubble"><strong>${esc(c.username||"User")}</strong><span>${richText(c.text||"")}</span></div></div>`).join("");
    return `<div class="sg-comments" data-comments>
      <div class="sg-comment-list">${seed}</div>
      <div class="sg-compose">${avatar({name:"You"},"sg-comment-avatar")}<input type="text" data-comment-input placeholder="${attr(replyMode?cfg.replyPlaceholder:cfg.commentPlaceholder)}"><button type="button" data-comment-submit>${esc(replyMode?cfg.replyButton:cfg.commentButton)}</button></div>
    </div>`;
  }
  function infoMarkup(p){
    return p.info?`<div class="sg-info-wrap"><button type="button" class="sg-info-link" data-action="info">${esc(p.infoLabel)}</button><div class="sg-popover sg-info-popover"><button type="button" class="sg-popover-close" data-close-popover>&times;</button><strong>${esc(p.infoLabel)}</strong><p>${esc(p.infoText)}</p></div></div>`:"";
  }
  function ctaMarkup(p){
    if(!p.cta) return "";
    const content=`<span>${esc(p.ctaText||"Learn more")}</span><span>&gt;</span>`;
    return p.ctaUrl?`<a class="sg-cta" data-action="cta" href="${attr(p.ctaUrl)}" target="_blank" rel="noopener noreferrer">${content}</a>`:`<button type="button" class="sg-cta" data-action="cta">${content}</button>`;
  }
  function iconSvg(name){return uiIcons[name]||""}
  function reactionItems(){
    return (cfg.reactions||[]).map(label=>({label,icon:(reactionMap[label]||reactionMap.Like).icon,color:(reactionMap[label]||reactionMap.Like).color}));
  }
  function reactionWrap(label){
    const first=reactionItems()[0]||reactionMap.Like;
    return `<div class="sg-reaction-wrap"><button type="button" class="sg-action sg-reaction-action" data-action="reaction" data-default-label="${attr(label)}" data-default-icon="${attr(first.icon)}"><span class="sg-action-icon sg-reaction-main-icon">${first.icon}</span><span data-reaction-label>${esc(label)}</span></button><div class="sg-reaction-tray">${reactionItems().map(r=>`<button type="button" data-reaction="${attr(r.label)}" data-icon="${attr(r.icon)}" data-color="${attr(r.color)}" title="${attr(r.label)}" aria-label="${attr(r.label)}"><span>${r.icon}</span></button>`).join("")}</div></div>`;
  }
  function menuButton(){
    return `<button type="button" class="sg-icon-menu" aria-label="More options">${iconSvg("more")}</button>`;
  }

  function renderFacebook(p){
    const countBits=[
      p.counts.reactions&&`<span class="sg-count-part sg-reactions-count"><span class="sg-reaction-icons">&#128077; &#10084;&#65039; &#128558;</span><span data-count="reactions" data-value="${attr(numericValue(p.counts.reactions))}">${esc(fmtCount(p.counts.reactions))}</span></span>`,
      countNode("comments",p.counts.comments,"comments"),
      countNode("shares",p.counts.shares,"shares")
    ].filter(Boolean).join("");
    const metaLine=meta([p.time,p.visibility,p.spon?p.sponText:""]);
    return `<article class="sg-post fb-post" data-post="${p.idx}">
      <header class="sg-post-head">
        ${avatar(p,"sg-avatar")}
        <div class="sg-author"><div><strong>${esc(fallbackName(p))}</strong>${verified(p)}${p.follow?`<button type="button" class="sg-inline-follow" data-action="follow" data-off-label="Follow" data-on-label="Following">Follow</button>`:""}</div>${metaLine?`<span>${metaLine}</span>`:""}${infoMarkup(p)}</div>
        ${menuButton()}
      </header>
      ${postText(p)}
      ${mediaGrid(p)}${ctaMarkup(p)}
      ${countBits?`<div class="sg-counts">${countBits}</div>`:""}
      <div class="sg-action-row">
        ${reactionWrap("Like")}
        <button type="button" class="sg-action" data-action="comment">${iconSvg("comment")}<span>Comment</span></button>
        <button type="button" class="sg-action" data-action="share">${iconSvg("share")}<span>Share</span></button>
      </div>
      ${commentsMarkup(p)}
    </article>`;
  }

  function renderLinkedIn(p){
    const countBits=[countNode("reactions",p.counts.reactions,"reactions"),countNode("comments",p.counts.comments,"comments"),countNode("reposts",p.counts.reposts,"reposts")].filter(Boolean).join(" <span class=\"sg-dot\">&#183;</span> ");
    const metaLine=meta([p.time,p.visibility,p.spon?p.sponText:""]);
    return `<article class="sg-post li-post" data-post="${p.idx}">
      <header class="sg-post-head">
        ${avatar(p,"sg-avatar")}
        <div class="sg-author"><div><strong>${esc(fallbackName(p))}</strong>${verified(p)}</div>${p.handle?`<span>${esc(p.handle)}</span>`:""}${metaLine?`<span>${metaLine}</span>`:""}${infoMarkup(p)}</div>
        ${p.follow?`<button type="button" class="sg-follow-main" data-action="follow" data-off-label="+ Follow" data-on-label="Following">+ Follow</button>`:""}
        ${menuButton()}
      </header>
      ${postText(p)}
      ${mediaGrid(p)}${ctaMarkup(p)}
      ${countBits?`<div class="sg-counts">${countBits}</div>`:""}
      <div class="sg-action-row">
        ${reactionWrap("Like")}
        <button type="button" class="sg-action" data-action="comment">${iconSvg("comment")}<span>Comment</span></button>
        <button type="button" class="sg-action" data-action="repost">${iconSvg("repost")}<span>Repost</span></button>
        <button type="button" class="sg-action" data-action="send">${iconSvg("send")}<span>Send</span></button>
      </div>
      ${commentsMarkup(p)}
    </article>`;
  }

  function renderX(p){
    return `<article class="sg-post x-post" data-post="${p.idx}">
      <header class="sg-post-head">
        ${avatar(p,"sg-avatar")}
        <div class="sg-author"><div><strong>${esc(fallbackName(p))}</strong>${verified(p)} ${p.handle?`<span>${esc(p.handle)}</span>`:""}${p.time?`<span>&#183; ${esc(p.time)}</span>`:""}</div>${p.spon?`<span>${esc(p.sponText)}</span>`:""}${infoMarkup(p)}</div>
        ${p.follow?`<button type="button" class="sg-follow-main" data-action="follow" data-off-label="Follow" data-on-label="Following">Follow</button>`:""}
        ${menuButton()}
      </header>
      ${postText(p)}
      ${mediaGrid(p)}${ctaMarkup(p)}
      ${p.counts.views?`<div class="sg-x-views"><span data-count="views" data-value="${attr(numericValue(p.counts.views))}">${esc(fmtCount(p.counts.views))}</span> views</div>`:""}
      <div class="sg-action-row x-actions">
        <button type="button" class="sg-action" data-action="reply">${iconSvg("reply")}<span data-count="replies" data-value="${attr(numericValue(p.counts.replies))}">${esc(fmtCount(p.counts.replies))}</span></button>
        <button type="button" class="sg-action" data-action="repost">${iconSvg("repost")}<span data-count="reposts" data-value="${attr(numericValue(p.counts.reposts))}">${esc(fmtCount(p.counts.reposts))}</span></button>
        <button type="button" class="sg-action" data-action="like">${iconSvg("like")}<span data-count="likes" data-value="${attr(numericValue(p.counts.likes))}">${esc(fmtCount(p.counts.likes))}</span></button>
        <button type="button" class="sg-action" data-action="bookmark">${iconSvg("bookmark")}<span data-count="bookmarks" data-value="${attr(numericValue(p.counts.bookmarks))}">${esc(fmtCount(p.counts.bookmarks))}</span></button>
        <button type="button" class="sg-action" data-action="share">${iconSvg("share")}</button>
      </div>
      ${commentsMarkup(p,true)}
    </article>`;
  }

  function renderPost(p){
    if(cfg.key==="facebook") return renderFacebook(p);
    if(cfg.key==="linkedin") return renderLinkedIn(p);
    return renderX(p);
  }
  function renderChrome(postsMarkup){
    return `<div class="sg-root sg-${attr(cfg.key)}"><main class="sg-feed">${postsMarkup}</main></div>`;
  }

  function generatedStyles(){
    return `<style>
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#050505}.sg-root{min-height:100vh;padding:20px 0}.sg-feed{max-width:680px;margin:0 auto}.sg-post{background:#fff;border:1px solid #ddd;margin:12px auto;overflow:visible}.sg-post-head{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;position:relative}.sg-avatar,.sg-comment-avatar{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#e4e6eb;border:1px solid #ddd;flex:0 0 auto}.sg-comment-avatar{width:32px;height:32px}.sg-avatar-fallback{display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#555}.sg-author{flex:1;min-width:0;line-height:1.22}.sg-author strong{font-size:15px}.sg-author span{display:inline;color:#65676b;font-size:12px;margin-top:2px}.sg-linkedin .sg-author span,.sg-facebook .sg-author span{display:block}.sg-verified{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;margin-left:5px;vertical-align:-2px}.sg-verified svg{display:block;width:16px;height:16px}.sg-verified circle{fill:#1877f2}.sg-verified path{fill:none;stroke:#fff;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}.sg-text{padding:0 14px 12px;font-size:15px;line-height:1.4;white-space:normal}.sg-tag{color:#0a66c2}.sg-media{display:grid;grid-template-columns:1fr;gap:2px;background:#ddd}.sg-media-many{grid-template-columns:1fr 1fr}.sg-media-cell{position:relative;min-height:190px;background:#f0f2f5;overflow:hidden}.sg-media-cell img{width:100%;height:100%;display:block;object-fit:cover}.sg-media-more{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);color:#fff;font-size:34px;font-weight:800}.sg-counts{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 14px;color:#65676b;font-size:13px;border-bottom:1px solid #eee}.sg-reaction-icons{letter-spacing:-5px;margin-right:8px}.sg-count-part{white-space:nowrap}.sg-dot{color:#65676b}.sg-action-row{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;padding:4px 10px;border-top:1px solid #eee;position:relative}.sg-action,.sg-inline-follow,.sg-follow-main,.sg-icon-menu,.sg-info-link{border:0;background:transparent;font:inherit;cursor:pointer}.sg-action{display:flex;justify-content:center;align-items:center;gap:7px;color:#65676b;font-weight:700;font-size:14px;border-radius:6px;padding:9px 8px;min-width:0}.sg-action svg,.sg-icon-menu svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}.sg-icon-menu svg{fill:currentColor;stroke:none}.sg-action:hover,.sg-icon-menu:hover,.sg-inline-follow:hover,.sg-follow-main:hover{background:#f0f2f5}.sg-action.is-reacted{color:#1877f2}.sg-action.is-liked{color:#f91880}.sg-action.is-liked svg{fill:currentColor}.sg-action.is-reposted{color:#00ba7c}.sg-action.is-bookmarked{color:#1d9bf0}.sg-action.is-bookmarked svg{fill:currentColor}.sg-action.is-commented,.sg-action.is-shared,.sg-action.is-sent{color:#1d9bf0}.sg-inline-follow{color:#1877f2;font-weight:700;margin-left:8px}.sg-follow-main{color:#0a66c2;font-weight:800;border-radius:999px;padding:6px 10px;white-space:nowrap}.sg-icon-menu{display:flex;align-items:center;justify-content:center;border-radius:50%;width:34px;height:34px;color:#65676b;flex:0 0 auto}.sg-info-wrap,.sg-reaction-wrap{position:relative}.sg-popover{display:none;position:absolute;left:0;top:24px;z-index:20;background:#fff;border:1px solid #d9d9d9;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.16);min-width:260px;padding:12px}.sg-popover.is-open{display:block}.sg-info-popover p{margin:6px 0 0;font-size:13px;color:#333;line-height:1.35}.sg-popover-close{position:absolute;right:6px;top:5px;width:28px;height:28px;text-align:center!important;padding:0!important}.sg-info-link{font-size:12px;color:#65676b;padding:0;margin-top:4px}.sg-info-link:hover{text-decoration:underline}.sg-cta{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#f7f8fa;color:#111;text-decoration:none;border:0;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;width:100%;font:inherit;font-weight:800;cursor:pointer}.sg-reaction-tray{display:none;position:absolute;left:0;bottom:calc(100% + 4px);z-index:21;background:#fff;border:1px solid #ddd;border-radius:999px;padding:5px;box-shadow:0 8px 24px rgba(0,0,0,.18);gap:3px}.sg-reaction-tray.is-open{display:flex}.sg-reaction-tray button{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border:0;background:#fff;border-radius:50%;font:inherit;font-size:22px;cursor:pointer;padding:0;transition:transform .12s ease}.sg-reaction-tray button:hover{transform:translateY(-4px) scale(1.08)}.sg-reaction-main-icon{font-size:18px;line-height:1}.sg-comments{display:none;padding:10px 14px 12px;border-top:1px solid #eee}.sg-comments.is-open{display:block}.sg-comment{display:flex;gap:8px;margin:8px 0}.sg-comment-bubble{background:#f0f2f5;border-radius:16px;padding:8px 10px;font-size:13px;line-height:1.35}.sg-comment-bubble strong{display:block;margin-bottom:2px}.sg-compose{display:flex;align-items:center;gap:8px;margin-top:10px}.sg-compose input{flex:1;border:0;background:#f0f2f5;border-radius:999px;padding:10px 12px;font:inherit;outline:none}.sg-compose button{border:0;background:transparent;color:#1877f2;font:inherit;font-weight:800;cursor:pointer}.sg-facebook{background:#f0f2f5}.sg-facebook .sg-post{border-radius:8px}.sg-linkedin{background:#f3f2ef}.sg-linkedin .sg-post{border-radius:8px}.sg-linkedin .sg-action-row{grid-template-columns:repeat(4,1fr)}.sg-linkedin .sg-action.is-reposted{color:#057642}.sg-linkedin .sg-follow-main{color:#0a66c2}.sg-x{background:#fff;padding:0}.sg-x .sg-feed{max-width:600px;border-left:1px solid #eff3f4;border-right:1px solid #eff3f4}.sg-x .sg-post{border:0;border-bottom:1px solid #eff3f4;margin:0;border-radius:0}.sg-x .sg-author span{display:inline;color:#536471;margin-left:4px}.sg-x .sg-action-row{grid-template-columns:repeat(5,1fr);border-top:0;padding:4px 54px 10px 64px}.sg-x .sg-action{justify-content:flex-start;font-weight:500;color:#536471}.sg-x .sg-action:hover{background:transparent;color:#1d9bf0}.sg-x .sg-text{padding-left:64px}.sg-x .sg-media{margin:0 14px 12px 64px;border:1px solid #cfd9de;border-radius:16px;overflow:hidden}.sg-x .sg-cta{margin-left:64px;width:calc(100% - 78px);border:1px solid #cfd9de;border-radius:0 0 16px 16px}.sg-x .sg-comments{margin-left:54px;border-top:1px solid #eff3f4}.sg-x .sg-follow-main{background:#0f1419;color:#fff}.sg-x .sg-follow-main:hover{background:#272c30}.sg-x-views{margin:0 14px 4px 64px;color:#536471;font-size:13px}@media(max-width:640px){.sg-feed{max-width:none}.sg-x .sg-feed{border-left:0;border-right:0}.sg-x .sg-action-row{padding-left:58px;padding-right:10px}.sg-x .sg-text{padding-left:62px}.sg-x .sg-media{margin-left:62px}.sg-x .sg-cta{margin-left:62px;width:calc(100% - 76px)}}
</style>`;
  }

  function generatedScript(s){
    return `<script>(function(){var prefix=${JSON.stringify(s.prefix)},tracking=${JSON.stringify(s.track)},platform=${JSON.stringify(cfg.key)};function setED(post,key,val){if(!tracking)return;var v=String(val);var field=prefix+"_post"+post+"_"+key;if(window.Qualtrics&&Qualtrics.SurveyEngine){if(typeof Qualtrics.SurveyEngine.setJSEmbeddedData==="function")Qualtrics.SurveyEngine.setJSEmbeddedData(field,v);if(typeof Qualtrics.SurveyEngine.setEmbeddedData==="function")Qualtrics.SurveyEngine.setEmbeddedData(field,v);}}function textEsc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function addComment(postEl,txt){var list=postEl.querySelector(".sg-comment-list");if(!list)return;var row=document.createElement("div");row.className="sg-comment";row.innerHTML='<div class="sg-comment-avatar sg-avatar-fallback">YOU</div><div class="sg-comment-bubble"><strong>You</strong><span>'+textEsc(txt)+'</span></div>';list.appendChild(row)}function adjustCount(postEl,key,delta){var el=postEl.querySelector('[data-count="'+key+'"]');if(!el)return;var value=el.getAttribute("data-value");if(value==="")return;var next=Math.max(0,Number(value)+delta);el.setAttribute("data-value",String(next));el.textContent=next.toLocaleString("en-US")}function toggleCounted(btn,postEl,post,key,countKey,cls){if(!btn)return;var on=0;btn.addEventListener("click",function(){on=on?0:1;btn.classList.toggle(cls,!!on);if(countKey)adjustCount(postEl,countKey,on?1:-1);setED(post,key,on)})}function activateOnce(btn,postEl,post,key,countKey,cls){if(!btn)return;var done=0;btn.addEventListener("click",function(){btn.classList.add(cls);if(!done&&countKey)adjustCount(postEl,countKey,1);done=1;setED(post,key,1)})}document.querySelectorAll(".sg-post").forEach(function(postEl){var post=postEl.getAttribute("data-post");["reaction","reaction_value","comment_opened","comment_submitted","comment_text","reply_opened","reply_submitted","reply_text","share","send","repost","like","bookmark","cta_click","info_opened","follow"].forEach(function(k){setED(post,k,k.indexOf("text")>-1||k.indexOf("value")>-1?"":0)});var reactionBtn=postEl.querySelector('[data-action="reaction"]'),reactionLabel=postEl.querySelector("[data-reaction-label]"),reactionIcon=postEl.querySelector(".sg-reaction-main-icon"),tray=postEl.querySelector(".sg-reaction-tray"),reactionValue="";function setReaction(label,html,color){var was=!!reactionValue;reactionValue=label;if(!was)adjustCount(postEl,"reactions",1);if(reactionBtn){reactionBtn.classList.add("is-reacted");reactionBtn.style.color=color||""}if(reactionLabel)reactionLabel.textContent=label;if(reactionIcon)reactionIcon.innerHTML=html;setED(post,"reaction",1);setED(post,"reaction_value",label)}if(reactionBtn){reactionBtn.addEventListener("click",function(e){e.stopPropagation();if(tray)tray.classList.toggle("is-open");else setReaction("Like",reactionBtn.getAttribute("data-default-icon")||"",platform==="linkedin"?"#0a66c2":"#1877f2")})}postEl.querySelectorAll("[data-reaction]").forEach(function(btn){btn.addEventListener("click",function(e){e.stopPropagation();setReaction(btn.getAttribute("data-reaction"),btn.getAttribute("data-icon"),btn.getAttribute("data-color"));if(tray)tray.classList.remove("is-open")})});var commentBtn=postEl.querySelector('[data-action="comment"],[data-action="reply"]'),comments=postEl.querySelector("[data-comments]");if(commentBtn&&comments){var open=0,field=commentBtn.getAttribute("data-action")==="reply"?"reply_opened":"comment_opened";commentBtn.addEventListener("click",function(){open=open?0:1;comments.classList.toggle("is-open",!!open);commentBtn.classList.toggle("is-commented",!!open);setED(post,field,open);var input=comments.querySelector("[data-comment-input]");if(input&&open)input.focus()})}var submit=postEl.querySelector("[data-comment-submit]"),input=postEl.querySelector("[data-comment-input]");if(submit&&input){function submitComment(){var txt=(input.value||"").trim();if(!txt)return;if(comments)comments.classList.add("is-open");addComment(postEl,txt);var reply=platform==="x";adjustCount(postEl,reply?"replies":"comments",1);setED(post,reply?"reply_submitted":"comment_submitted",1);setED(post,reply?"reply_text":"comment_text",txt);input.value=""}submit.addEventListener("click",submitComment);input.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();submitComment()}})}toggleCounted(postEl.querySelector('[data-action="like"]'),postEl,post,"like","likes","is-liked");toggleCounted(postEl.querySelector('[data-action="bookmark"]'),postEl,post,"bookmark","bookmarks","is-bookmarked");toggleCounted(postEl.querySelector('[data-action="repost"]'),postEl,post,"repost","reposts","is-reposted");activateOnce(postEl.querySelector('[data-action="share"]'),postEl,post,"share",platform==="facebook"?"shares":"", "is-shared");activateOnce(postEl.querySelector('[data-action="send"]'),postEl,post,"send","", "is-sent");var follow=postEl.querySelector('[data-action="follow"]');if(follow){var f=0,off=follow.getAttribute("data-off-label")||"Follow",on=follow.getAttribute("data-on-label")||"Following";follow.addEventListener("click",function(){f=f?0:1;follow.textContent=f?on:off;follow.classList.toggle("is-active",!!f);setED(post,"follow",f)})}var info=postEl.querySelector('[data-action="info"]'),infoPop=postEl.querySelector(".sg-info-popover");if(info&&infoPop){info.addEventListener("click",function(e){e.stopPropagation();infoPop.classList.toggle("is-open");if(infoPop.classList.contains("is-open"))setED(post,"info_opened",1)})}var cta=postEl.querySelector('[data-action="cta"]');if(cta)cta.addEventListener("click",function(){setED(post,"cta_click",1)});postEl.querySelectorAll("[data-close-popover]").forEach(function(btn){btn.addEventListener("click",function(e){e.stopPropagation();btn.closest(".sg-popover").classList.remove("is-open")})});document.addEventListener("click",function(){postEl.querySelectorAll(".sg-popover.is-open,.sg-reaction-tray.is-open").forEach(function(p){p.classList.remove("is-open")})})});})();<\/script>`;
  }

  function generated(){
    const s=feedSettings(),posts=getPosts();
    const postsMarkup=posts.length?posts.map(renderPost).join(""):`<p style="padding:16px;color:#666">Add at least one post.</p>`;
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(s.title)}</title>${generatedStyles()}</head><body>${renderChrome(postsMarkup)}${generatedScript(s)}</body></html>`;
  }

  function update(){
    const html=generated(),fs=fieldNames();
    $("out").textContent=html;
    $("fields").innerHTML=fs.length?fs.map(f=>`<div>${esc(f)}</div>`).join(""):"<div>No fields: tracking disabled.</div>";
    $("previewFrame").srcdoc=html;
  }
  function dl(name,text){const b=new Blob([text],{type:"text/html;charset=utf-8"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u)}
  function init(){
    setPageText();
    $("addPostTop").onclick=()=>addPost();
    ["feedTitle","prefix","track","jsprefix"].forEach(id=>{$(id).addEventListener("input",update);$(id).addEventListener("change",update)});
    $("copy").onclick=()=>navigator.clipboard.writeText($("out").textContent).then(()=>{const b=$("copy");b.textContent="Copied!";setTimeout(()=>b.textContent="Copy generated feed HTML",1200)});
    $("downStim").onclick=()=>dl(cfg.downloadName,$("out").textContent);
    addPost();
  }
  init();
})();
