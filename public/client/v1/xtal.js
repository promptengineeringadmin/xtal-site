"use strict";var XTAL=(()=>{var L=class{constructor(t,r){this.controller=null;this.apiBase=t,this.shopId=r}async fetchConfig(){let t=await fetch(`${this.apiBase}/api/xtal/config?shopId=${encodeURIComponent(this.shopId)}`,{mode:"cors"});if(!t.ok)throw new Error(`Config fetch failed: ${t.status}`);return t.json()}async searchFull(t,r=16,a){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=await fetch(`${this.apiBase}/api/xtal/search-full`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:t,collection:this.shopId,limit:r,selected_aspects:a}),signal:this.controller.signal});if(!o.ok)throw new Error(`Search failed: ${o.status}`);return o.json()}};function z(e){return`
    :host {
      --xtal-bg: #ffffff;
      --xtal-text: #1a1a1a;
      --xtal-text-muted: #64748b;
      --xtal-border: #e2e8f0;
      --xtal-accent: #4f46e5;
      --xtal-accent-hover: #4338ca;
      --xtal-card-bg: #ffffff;
      --xtal-card-shadow: 0 1px 3px rgba(0,0,0,0.1);
      --xtal-overlay-bg: rgba(0,0,0,0.5);
      --xtal-radius: 12px;
      --xtal-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .xtal-backdrop {
      position: fixed;
      inset: 0;
      background: var(--xtal-overlay-bg);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 80px;
      font-family: var(--xtal-font);
      overflow-y: auto;
    }

    .xtal-container {
      background: var(--xtal-bg);
      border-radius: var(--xtal-radius);
      width: 90%;
      max-width: 900px;
      max-height: calc(100vh - 120px);
      overflow-y: auto;
      box-shadow: 0 25px 50px rgba(0,0,0,0.25);
      display: flex;
      flex-direction: column;
    }

    .xtal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--xtal-border);
      position: sticky;
      top: 0;
      background: var(--xtal-bg);
      z-index: 1;
    }

    .xtal-header-query {
      font-size: 14px;
      font-weight: 600;
      color: var(--xtal-text);
    }

    .xtal-header-meta {
      font-size: 12px;
      color: var(--xtal-text-muted);
    }

    .xtal-close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 20px;
      color: var(--xtal-text-muted);
      padding: 4px 8px;
      border-radius: 6px;
      line-height: 1;
    }
    .xtal-close:hover {
      background: #f1f5f9;
      color: var(--xtal-text);
    }

    .xtal-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 12px 20px;
      border-bottom: 1px solid var(--xtal-border);
    }

    .xtal-chip {
      background: #f1f5f9;
      border: 1px solid var(--xtal-border);
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 12px;
      color: var(--xtal-text);
      cursor: pointer;
      transition: all 0.15s;
      font-family: var(--xtal-font);
    }
    .xtal-chip:hover {
      border-color: var(--xtal-accent);
      color: var(--xtal-accent);
    }
    .xtal-chip-selected {
      background: var(--xtal-accent);
      border-color: var(--xtal-accent);
      color: #ffffff;
    }
    .xtal-chip-selected:hover {
      background: var(--xtal-accent-hover);
      color: #ffffff;
    }

    .xtal-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      padding: 20px;
    }

    .xtal-card {
      display: flex;
      flex-direction: column;
      text-decoration: none;
      color: inherit;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--xtal-border);
      background: var(--xtal-card-bg);
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .xtal-card:hover {
      box-shadow: var(--xtal-card-shadow);
      transform: translateY(-2px);
    }

    .xtal-card-image {
      aspect-ratio: 1;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .xtal-card-image img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 8px;
    }
    .xtal-card-image-placeholder {
      color: var(--xtal-text-muted);
      font-size: 12px;
    }

    .xtal-card-body {
      padding: 10px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .xtal-card-vendor {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--xtal-text-muted);
      font-weight: 500;
    }

    .xtal-card-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--xtal-text);
      margin-top: 2px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
    }

    .xtal-card-price {
      font-size: 13px;
      font-weight: 600;
      color: var(--xtal-text);
      margin-top: auto;
      padding-top: 8px;
    }

    .xtal-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: var(--xtal-text-muted);
      font-size: 14px;
      gap: 8px;
    }

    .xtal-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid var(--xtal-border);
      border-top-color: var(--xtal-accent);
      border-radius: 50%;
      animation: xtal-spin 0.6s linear infinite;
    }

    @keyframes xtal-spin {
      to { transform: rotate(360deg); }
    }

    .xtal-empty {
      text-align: center;
      padding: 60px 20px;
      color: var(--xtal-text-muted);
      font-size: 14px;
    }

    .xtal-powered {
      text-align: center;
      padding: 12px;
      font-size: 10px;
      color: var(--xtal-text-muted);
      border-top: 1px solid var(--xtal-border);
    }

    /* Toast notifications */
    .xtal-toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      opacity: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-family: var(--xtal-font);
      color: #ffffff;
      z-index: 10;
      transition: opacity 0.3s, transform 0.3s;
      pointer-events: none;
    }
    .xtal-toast-show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    .xtal-toast-success { background: #16a34a; }
    .xtal-toast-error { background: #dc2626; }
    .xtal-toast-loading { background: #475569; }
    .xtal-toast-icon {
      font-size: 14px;
      font-weight: bold;
    }
    .xtal-toast-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: xtal-spin 0.6s linear infinite;
    }

    @media (max-width: 768px) {
      .xtal-backdrop {
        padding-top: 0;
        align-items: stretch;
      }
      .xtal-container {
        width: 100%;
        max-width: 100%;
        max-height: 100vh;
        border-radius: 0;
      }
      .xtal-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding: 12px;
      }
    }
  `+(e?`
${e}`:"")}var k=class{constructor(t){this.visible=!1;this.onHideCallback=null;this.host=document.createElement("div"),this.host.setAttribute("data-xtal-host","true"),this.host.style.position="fixed",this.host.style.inset="0",this.host.style.zIndex="2147483647",this.host.style.display="none",this.shadow=this.host.attachShadow({mode:"open"});let r=document.createElement("style");r.textContent=z(t),this.shadow.appendChild(r),this.contentRoot=document.createElement("div"),this.shadow.appendChild(this.contentRoot),document.body.appendChild(this.host),this.handleKeydown=this.handleKeydown.bind(this),this.handlePopstate=this.handlePopstate.bind(this)}handleKeydown(t){t.key==="Escape"&&this.hide()}handlePopstate(){this.visible&&this.hide()}onHide(t){this.onHideCallback=t}show(){this.visible=!0,this.host.style.display="block",document.addEventListener("keydown",this.handleKeydown),window.addEventListener("popstate",this.handlePopstate)}hide(){this.visible=!1,this.host.style.display="none",document.removeEventListener("keydown",this.handleKeydown),window.removeEventListener("popstate",this.handlePopstate),this.onHideCallback&&this.onHideCallback()}isVisible(){return this.visible}getShadowRoot(){return this.shadow}setContent(t){this.contentRoot.innerHTML="",this.contentRoot.appendChild(t)}destroy(){this.hide(),this.host.remove()}};var S=class{constructor(t){this.target=t,this.originalHTML=t.innerHTML}showLoading(){this.target.innerHTML="";let t=document.createElement("div");t.style.cssText="display:flex;align-items:center;justify-content:center;padding:60px 20px;gap:8px;color:#888;font-size:14px;";let r=document.createElement("div");r.style.cssText="width:16px;height:16px;border:2px solid #ccc;border-top-color:#555;border-radius:50%;animation:xtal-inline-spin .6s linear infinite;";let a=document.createElement("span");if(a.textContent="Searching...",t.appendChild(r),t.appendChild(a),!document.getElementById("xtal-inline-keyframes")){let o=document.createElement("style");o.id="xtal-inline-keyframes",o.textContent="@keyframes xtal-inline-spin{to{transform:rotate(360deg)}}",document.head.appendChild(o)}this.target.appendChild(t)}renderCards(t){this.target.innerHTML="";for(let r of t)this.target.appendChild(r)}renderEmpty(t){this.target.innerHTML="";let r=document.createElement("div");r.style.cssText="text-align:center;padding:60px 20px;color:#888;font-size:14px;",r.textContent=`No results found for "${t}"`,this.target.appendChild(r)}restore(){this.target.innerHTML=this.originalHTML}destroy(){this.restore();let t=document.getElementById("xtal-inline-keyframes");t&&t.remove()}};function v(e,t){try{let r=new URL(e);return r.searchParams.set("utm_source","xtal"),r.searchParams.set("utm_medium","search"),r.searchParams.set("utm_campaign",t.shopId),r.searchParams.set("utm_content",t.productId),r.searchParams.set("utm_term",t.query),r.toString()}catch{return e}}function G(e){let t=Array.isArray(e.price)?e.price[0]??0:e.price,r=e.variants?.[0]?.compare_at_price,a={id:e.id??"",title:e.title??"",vendor:e.vendor??"",product_type:e.product_type??"",price:t.toFixed(2),image_url:e.image_url||e.featured_image||e.images?.[0]?.src||"",product_url:e.product_url??"",available:e.available?"true":"",description:e.description??""};r&&r>t&&(a.compare_at_price=r.toFixed(2));let o=e.variants?.[0];if(o&&(o.sku&&(a.sku=o.sku),o.title&&(a.variant_title=o.title)),e.tags?.length){a.tags=e.tags.join(", ");for(let n of e.tags){let l=n.indexOf(":");if(l>0){let s=n.slice(0,l).trim().toLowerCase().replace(/\s+/g,"_"),p=n.slice(l+1).trim();s&&p&&!(s in a)&&(a[s]=p)}}}return a}function W(e,t){let r=e.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(a,o,n)=>t[o]?n:"");return r=r.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(a,o,n)=>t[o]?"":n),r}function Q(e,t){return e.replace(/\{\{(\w+)\}\}/g,(r,a)=>t[a]??"")}function Z(e){let t=document.createElement("div");return t.innerHTML=e.trim(),t.firstElementChild||t}function _(e,t,r,a,o){let n=G(t),l=W(e,n);l=Q(l,n);let s=Z(l),p=v(t.product_url||"#",{shopId:a,productId:t.id,query:r});return s.querySelectorAll('[data-xtal-action="view-product"]').forEach(d=>{d.tagName==="A"?(d.href=p,d.target="_blank",d.rel="noopener noreferrer"):(d.style.cursor="pointer",d.addEventListener("click",u=>{u.preventDefault(),o.onViewProduct(t)}))}),s.querySelectorAll('[data-xtal-action="add-to-cart"]').forEach(d=>{d.addEventListener("click",async u=>{u.preventDefault(),u.stopPropagation();let m=d.textContent;d.textContent="Adding...",d.style.opacity="0.7",d.style.pointerEvents="none";try{await o.onAddToCart(t)}finally{d.textContent=m,d.style.opacity="",d.style.pointerEvents=""}})}),s}function tt(e){if(Array.isArray(e)){let t=[...e].sort((r,a)=>r-a);return t.length===0?"N/A":t.length===1||t[0]===t[t.length-1]?`$${t[0].toFixed(2)}`:`$${t[0].toFixed(2)} \u2013 $${t[t.length-1].toFixed(2)}`}return`$${e.toFixed(2)}`}function M(e,t,r,a,o){if(a&&o)return _(a.html,e,t,r,o);let n=e.image_url||e.featured_image||e.images&&e.images[0]?.src,l=document.createElement("a");l.className="xtal-card",l.href=v(e.product_url||"#",{shopId:r,productId:e.id,query:t}),l.target="_blank",l.rel="noopener noreferrer";let s=document.createElement("div");if(s.className="xtal-card-image",n){let m=document.createElement("img");m.src=n,m.alt=e.title,m.loading="lazy",s.appendChild(m)}else{let m=document.createElement("span");m.className="xtal-card-image-placeholder",m.textContent="No image",s.appendChild(m)}l.appendChild(s);let p=document.createElement("div");if(p.className="xtal-card-body",e.vendor){let m=document.createElement("div");m.className="xtal-card-vendor",m.textContent=e.vendor,p.appendChild(m)}let d=document.createElement("div");d.className="xtal-card-title",d.textContent=e.title,p.appendChild(d);let u=document.createElement("div");return u.className="xtal-card-price",u.textContent=tt(e.price),p.appendChild(u),l.appendChild(p),l}function q(e,t,r,a,o){let n=document.createElement("div");n.className="xtal-grid";for(let l of e)n.appendChild(M(l,t,r,a,o));return n}function U(){let e=document.createElement("div");e.className="xtal-loading";let t=document.createElement("div");t.className="xtal-spinner",e.appendChild(t);let r=document.createElement("span");return r.textContent="Searching...",e.appendChild(r),e}function O(e){let t=document.createElement("div");t.className="xtal-empty";let r=document.createElement("p");return r.textContent=`No results found for "${e}"`,t.appendChild(r),t}function B(e,t,r){let a=document.createElement("div");a.className="xtal-chips";for(let o of e){let n=document.createElement("button");n.className=t.has(o)?"xtal-chip xtal-chip-selected":"xtal-chip",n.textContent=o,n.addEventListener("click",()=>r(o)),a.appendChild(n)}return a}function N(e,t){let r=null,a=null,o=[];function n(s){let p=s.closest("form");if(p){let u=m=>{m.preventDefault();let P=s.value.trim();P.length>=1&&t(P)};p.addEventListener("submit",u),o.push(()=>p.removeEventListener("submit",u))}let d=u=>{if(u.key==="Enter"){u.preventDefault();let m=s.value.trim();m.length>=1&&t(m)}};s.addEventListener("keydown",d),o.push(()=>s.removeEventListener("keydown",d))}let l=document.querySelector(e);return l?(n(l),()=>o.forEach(s=>s())):(r=new MutationObserver(s=>{for(let p of s)for(let d of Array.from(p.addedNodes)){if(!(d instanceof HTMLElement))continue;let u=d.matches(e)?d:d.querySelector(e);if(u){n(u),r?.disconnect(),r=null,a&&clearTimeout(a),a=null;return}}}),r.observe(document.body,{childList:!0,subtree:!0}),a=setTimeout(()=>{r?.disconnect(),r=null,console.warn(`[xtal.js] Could not find input matching "${e}" after 10s`)},1e4),()=>{o.forEach(s=>s()),r?.disconnect(),r=null,a&&clearTimeout(a)})}function et(e){return typeof e=="string"&&e.includes("/")?e.split("/").pop():e}var H=class{constructor(){this.name="shopify"}async addToCart(t,r=1){let a=t.variants?.[0]?.id;if(!a)return{success:!1,message:"No variant available"};if(!t.available)return{success:!1,message:"Product unavailable"};let o=et(a);try{let n=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o,quantity:r})});return n.ok?{success:!0,message:"Added to cart"}:n.status===422?{success:!1,message:(await n.json().catch(()=>({}))).description||"Could not add to cart"}:{success:!1,message:`Cart error (${n.status})`}}catch(n){return{success:!1,message:n instanceof Error?n.message:"Network error"}}}};var A=class{constructor(t,r){this.name="fallback";this.shopId=t,this.queryFn=r}async addToCart(t){let r=v(t.product_url||"#",{shopId:this.shopId,productId:t.id,query:this.queryFn()});return window.open(r,"_blank","noopener,noreferrer"),{success:!0,message:"Opening product page..."}}};function D(e,t){return window.Shopify?new H:new A(e,t)}function $(e,t,r,a=3e3){let o=e.querySelector(".xtal-toast");o&&o.remove();let n=document.createElement("div");n.className=`xtal-toast xtal-toast-${r}`;let l=document.createElement("span");if(l.className="xtal-toast-icon",r==="loading"){let p=document.createElement("span");p.className="xtal-toast-spinner",l.appendChild(p)}else l.textContent=r==="success"?"\u2713":"\u2717";n.appendChild(l);let s=document.createElement("span");return s.textContent=t,n.appendChild(s),e.appendChild(n),requestAnimationFrame(()=>n.classList.add("xtal-toast-show")),r!=="loading"&&setTimeout(()=>{n.classList.remove("xtal-toast-show"),setTimeout(()=>n.remove(),300)},a),n}function K(e){e.classList.remove("xtal-toast-show"),setTimeout(()=>e.remove(),300)}function X(){try{let e=document.querySelector("script[data-shop-id]");if(!e){console.warn("[xtal.js] No <script data-shop-id> tag found");return}let t=e.getAttribute("data-shop-id")??"";if(!t){console.warn("[xtal.js] data-shop-id is empty");return}let r="",a=e.getAttribute("src");if(a)try{r=new URL(a,window.location.href).origin}catch{r=window.location.origin}else r=window.location.origin;let o=new L(r,t);o.fetchConfig().then(n=>{if(!n.enabled){console.log(`[xtal.js] Snippet disabled for ${t}`);return}let l=n.cardTemplate??null,s="",p=D(t,()=>s);console.log(`[xtal.js] Cart adapter: ${p.name}`);function d(c){if(n.productUrlPattern){let x=c.variants?.[0]?.sku||"";if(x)return n.productUrlPattern.replace("{sku}",encodeURIComponent(x)).replace("{id}",c.id||"")}let i=c.product_url||"#";return!i||i==="#"?"#":i.startsWith("http://")||i.startsWith("https://")?i:n.siteUrl?n.siteUrl.replace(/\/$/,"")+i:i}let u=n.displayMode==="inline"&&!!n.resultsSelector,m=u?document.querySelector(n.resultsSelector):null;if(u&&!m&&console.warn(`[xtal.js] Inline mode requested but resultsSelector "${n.resultsSelector}" not found \u2014 falling back to overlay`),u&&!!m){let c=new S(m),i=null,x={onViewProduct(f){let h=v(d(f),{shopId:t,productId:f.id,query:s});window.open(h,"_blank","noopener,noreferrer")},async onAddToCart(f){let h=await p.addToCart(f);console.log(`[xtal.js] Add to cart: ${h.success?"OK":"FAIL"} \u2014 ${h.message}`),h.success&&fetch(`${r}/api/xtal/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:f.id,action:"add_to_cart",collection:t,query:s})}).catch(()=>{})}},E=f=>{s=f,c.showLoading(),o.searchFull(f,16).then(h=>{if(h.results.length===0){c.renderEmpty(f);return}let T=h.results.map(C=>l?_(l.html,C,f,t,x):M(C,f,t,null,x));c.renderCards(T)}).catch(h=>{h instanceof DOMException&&h.name==="AbortError"||(console.error("[xtal.js] Search error:",h),c.restore())})},b=n.searchSelector||'input[type="search"]';i=N(b,E),window.XTAL={destroy(){i?.(),c.destroy(),delete window.XTAL}},console.log(`[xtal.js] Initialized INLINE for ${t}. Search: ${b}, Grid: ${n.resultsSelector}`);return}let g=new k(l?.css),V={onViewProduct(c){let i=v(d(c),{shopId:t,productId:c.id,query:s});window.open(i,"_blank","noopener,noreferrer")},async onAddToCart(c){let i=$(g.getShadowRoot(),"Adding to cart...","loading"),x=await p.addToCart(c);K(i),$(g.getShadowRoot(),x.message,x.success?"success":"error"),x.success&&fetch(`${r}/api/xtal/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:c.id,action:"add_to_cart",collection:t,query:s})}).catch(()=>{})}},w=new Set,y=null,R=null;g.onHide(()=>{});function J(){if(!y)return;let c=document.createElement("div");c.className="xtal-backdrop",c.addEventListener("click",C=>{C.target===c&&g.hide()});let i=document.createElement("div");i.className="xtal-container";let x=document.createElement("div");x.className="xtal-header";let E=document.createElement("div"),b=document.createElement("div");b.className="xtal-header-query",b.textContent=`Results for "${s}"`,E.appendChild(b);let f=document.createElement("div");f.className="xtal-header-meta",f.textContent=`${y.total} products \xB7 ${y.query_time.toFixed(0)}ms`,E.appendChild(f),x.appendChild(E);let h=document.createElement("button");if(h.className="xtal-close",h.textContent="\xD7",h.addEventListener("click",()=>g.hide()),x.appendChild(h),i.appendChild(x),y.aspects_enabled&&y.aspects.length>0){let C=B(y.aspects,w,I=>{w.has(I)?w.delete(I):w.add(I),j(s)});i.appendChild(C)}y.results.length>0?i.appendChild(q(y.results,s,t,l,V)):i.appendChild(O(s));let T=document.createElement("div");T.className="xtal-powered",T.textContent="Powered by XTAL Search",i.appendChild(T),c.appendChild(i),g.setContent(c)}function Y(){let c=document.createElement("div");c.className="xtal-backdrop",c.addEventListener("click",x=>{x.target===c&&g.hide()});let i=document.createElement("div");i.className="xtal-container",i.appendChild(U()),c.appendChild(i),g.setContent(c),g.show()}function j(c){s=c,Y(),o.searchFull(c,16,Array.from(w)).then(i=>{y=i,J(),g.isVisible()||g.show()}).catch(i=>{i instanceof DOMException&&i.name==="AbortError"||console.error("[xtal.js] Search error:",i)})}let F=n.searchSelector||'input[type="search"]';R=N(F,j),window.XTAL={destroy(){R?.(),g.destroy(),delete window.XTAL}},console.log(`[xtal.js] Initialized OVERLAY for ${t}. Selector: ${F}`)}).catch(n=>{console.error("[xtal.js] Failed to fetch config:",n)})}catch(e){console.error("[xtal.js] Boot error:",e)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",X):X();})();
