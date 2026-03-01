"use strict";var XTAL=(()=>{var _=class{constructor(e,a){this.controller=null;this.apiBase=e,this.shopId=a}abort(){this.controller&&(this.controller.abort(),this.controller=null)}async fetchConfig(){let e=new AbortController,a=setTimeout(()=>e.abort(),5e3);try{let t=await fetch(`${this.apiBase}/api/xtal/config?shopId=${encodeURIComponent(this.shopId)}`,{mode:"cors",signal:e.signal});if(!t.ok)throw new Error(`Config fetch failed: ${t.status}`);return t.json()}finally{clearTimeout(a)}}async searchFull(e,a=16,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let s=await fetch(`${this.apiBase}/api/xtal/search-full`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,limit:a,selected_aspects:t}),signal:this.controller.signal});if(!s.ok)throw new Error(`Search failed: ${s.status}`);return s.json()}async searchFiltered(e,a,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let s=t?.facetFilters&&Object.values(t.facetFilters).some(c=>c.length>0),i=t?.priceRange?{min:t.priceRange.min,max:t.priceRange.max}:void 0,u=await fetch(`${this.apiBase}/api/xtal/search`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,search_context:a,limit:t?.limit??24,...s?{facet_filters:t.facetFilters}:{},...i?{price_range:i}:{}}),signal:this.controller.signal});if(!u.ok)throw new Error(`Filter search failed: ${u.status}`);return u.json()}};var $=class{constructor(e){this.originalHTML=null;this.originalDisplay="";this.layoutEl=null;this.railSlot=null;this.gridSlot=null;this.loadingPhraseTimer=null;this.target=e}captureOriginal(){this.originalHTML===null&&(this.originalHTML=this.target.innerHTML,this.originalDisplay=this.target.style.display,this.target.style.display="block",this.target.style.width="100%")}initLayout(){return this.layoutEl?this.railSlot:(this.captureOriginal(),this.target.innerHTML="",this.layoutEl=document.createElement("div"),this.layoutEl.className="xtal-layout",this.railSlot=document.createElement("div"),this.railSlot.className="xtal-rail-slot",this.gridSlot=document.createElement("div"),this.gridSlot.className="xtal-grid-slot",this.layoutEl.appendChild(this.railSlot),this.layoutEl.appendChild(this.gridSlot),this.target.appendChild(this.layoutEl),this.railSlot)}showLoading(e){this.captureOriginal(),this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null);let a=this.gridSlot||this.target;if(a.innerHTML="",!document.getElementById("xtal-inline-keyframes")){let r=document.createElement("style");r.id="xtal-inline-keyframes",r.textContent=["@keyframes xtal-inline-spin{to{transform:rotate(360deg)}}","@keyframes xtal-pulse{0%,100%{opacity:1}50%{opacity:0.4}}"].join(""),document.head.appendChild(r)}let t=document.createElement("div");t.style.cssText="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;width:100%;";let s=document.createElement("div");s.style.cssText="position:relative;width:48px;height:48px;margin-bottom:12px;";let i=document.createElement("div");i.style.cssText="position:absolute;inset:0;border:3px solid #e5e5e5;border-radius:50%;";let u=document.createElement("div");u.style.cssText="position:absolute;inset:0;border:3px solid transparent;border-top-color:#1d1d1b;border-radius:50%;animation:xtal-inline-spin .8s linear infinite;";let c=document.createElement("div");if(c.style.cssText="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;",c.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:xtal-pulse 2s ease-in-out infinite"><path d="M12 3l1.91 5.49L19.4 10.4l-5.49 1.91L12 17.8l-1.91-5.49L4.6 10.4l5.49-1.91z"/><path d="M19 2l.5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5z"/><path d="M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5z"/></svg>',s.appendChild(i),s.appendChild(u),s.appendChild(c),t.appendChild(s),e){let r=e.length>80?e.slice(0,77)+"\u2026":e,o=document.createElement("p");o.style.cssText="margin:0 0 8px 0;font-size:14px;color:#555;font-style:italic;text-align:center;max-width:320px;",o.textContent=`\u201C${r}\u201D`,t.appendChild(o)}let d=["Analyzing search intent\u2026","Finding best matches\u2026","Ranking results\u2026","Almost there\u2026"],l=document.createElement("p");l.style.cssText="margin:0;font-size:13px;color:#999;text-align:center;transition:opacity 0.3s;",l.textContent=d[0],t.appendChild(l);let m=0;this.loadingPhraseTimer=setInterval(()=>{l.style.opacity="0",setTimeout(()=>{m=(m+1)%d.length,l.textContent=d[m],l.style.opacity="1"},300)},2500),a.appendChild(t)}clearPhraseTimer(){this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null)}renderCards(e){this.clearPhraseTimer();let a=this.gridSlot||this.target;a.innerHTML="";let t=document.createElement("div");t.className="xtal-grid";for(let s of e)t.appendChild(s);a.appendChild(t)}renderEmpty(e){this.clearPhraseTimer();let a=this.gridSlot||this.target;a.innerHTML="";let t=document.createElement("div");t.style.cssText="text-align:center;padding:60px 20px;color:#888;font-size:14px;",t.textContent=`No results found for "${e}"`,a.appendChild(t)}restore(){this.layoutEl=null,this.railSlot=null,this.gridSlot=null,this.originalHTML!==null&&(this.target.innerHTML=this.originalHTML,this.target.style.display=this.originalDisplay,this.target.style.width="",this.originalHTML=null)}destroy(){this.clearPhraseTimer(),this.restore();let e=document.getElementById("xtal-inline-keyframes");e&&e.remove()}};var G={"product-subcategory":"Category",brand:"Brand",vendor:"Vendor","product-age":"Age",proof:"Proof",region:"Region",size:"Size",terpene:"Terpene",effect:"Effect","strain-type":"Strain Type",format:"Format",material:"Material",shape:"Shape","use-case":"Use Case",feature:"Feature",design:"Design",style:"Style",color:"Color"},Q=["product-subcategory","brand","vendor","strain-type","terpene","effect","format","material","use-case","style"],N=5,Z=[{label:"Under $25",max:25},{label:"$25\u2013$50",min:25,max:50},{label:"$50\u2013$100",min:50,max:100},{label:"$100\u2013$200",min:100,max:200},{label:"$200+",min:200}];function B(n){return n.split(/[-_]/).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function Y(n){return G[n]||n.split("-").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function q(n,e){return n?n.min===e.min&&n.max===e.max:!1}var A=class{constructor(e,a,t,s,i){this.expandedSections=new Set(["price"].concat(Q));this.showMore={};this.drawerOpen=!1;this.savedBodyOverflow="";this.container=e,this.onFacetToggle=a,this.onPriceChange=t,this.onClearAll=s,this.pricePresets=i||Z,this.railEl=document.createElement("aside"),this.railEl.className="xtal-filter-rail",e.appendChild(this.railEl),this.fabEl=document.createElement("button"),this.fabEl.className="xtal-filter-fab",this.fabEl.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg><span class="xtal-fab-text">Filters</span>',this.fabEl.addEventListener("click",()=>this.openDrawer()),document.body.appendChild(this.fabEl),this.backdropEl=document.createElement("div"),this.backdropEl.className="xtal-backdrop",this.backdropEl.addEventListener("click",()=>this.closeDrawer()),document.body.appendChild(this.backdropEl),this.drawerEl=document.createElement("div"),this.drawerEl.className="xtal-filter-drawer";let u=document.createElement("div");u.className="xtal-drawer-header",u.innerHTML='<span class="xtal-drawer-title">Filters</span>';let c=document.createElement("button");c.className="xtal-drawer-close",c.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',c.setAttribute("aria-label","Close filters"),c.addEventListener("click",()=>this.closeDrawer()),u.appendChild(c),this.drawerEl.appendChild(u),this.drawerContentEl=document.createElement("div"),this.drawerContentEl.className="xtal-drawer-content",this.drawerEl.appendChild(this.drawerContentEl);let d=document.createElement("div");d.className="xtal-drawer-footer",this.drawerFooterBtn=document.createElement("button"),this.drawerFooterBtn.className="xtal-drawer-apply",this.drawerFooterBtn.textContent="Show results",this.drawerFooterBtn.addEventListener("click",()=>this.closeDrawer()),d.appendChild(this.drawerFooterBtn),this.drawerEl.appendChild(d),document.body.appendChild(this.drawerEl)}update(e,a,t,s){let i=e&&Object.keys(e).length>0,u=Object.values(a).some(r=>r.length>0)||t!==null;if(this.railEl.style.display=!i&&!u?"none":"",this.fabEl.style.display="",!i&&!u){this.fabEl.classList.add("xtal-fab-hidden");return}else this.fabEl.classList.remove("xtal-fab-hidden");this.railEl.innerHTML="",this.drawerContentEl.innerHTML="";let c=this.buildFilterSections(e,a,t,"desktop"),d=this.buildFilterSections(e,a,t,"mobile");this.railEl.appendChild(c),this.drawerContentEl.appendChild(d);let l=Object.values(a).reduce((r,o)=>r+o.length,0)+(t?1:0),m=this.fabEl.querySelector(".xtal-fab-badge");if(m&&m.remove(),l>0){let r=document.createElement("span");r.className="xtal-fab-badge",r.textContent=String(l),this.fabEl.appendChild(r)}this.drawerFooterBtn.textContent=`Show ${s} result${s!==1?"s":""}`}buildFilterSections(e,a,t,s){let i=document.createDocumentFragment();if(Object.values(a).some(l=>l.length>0)||t!==null){let l=document.createElement("div");l.className="xtal-applied-section";let m=document.createElement("div");m.className="xtal-clear-row";let r=document.createElement("button");r.className="xtal-clear-all",r.textContent="Clear all",r.addEventListener("click",()=>this.onClearAll()),m.appendChild(r),l.appendChild(m);let o=document.createElement("div");o.className="xtal-applied-chips";for(let[p,g]of Object.entries(a))for(let b of g){let x=document.createElement("button");x.className="xtal-chip",x.innerHTML=`${B(b)} <span class="xtal-chip-x">\xD7</span>`,x.addEventListener("click",()=>this.onFacetToggle(p,b)),o.appendChild(x)}if(t){let p=document.createElement("button");p.className="xtal-chip";let g=t.min&&t.max?`$${t.min}\u2013$${t.max}`:t.max?`Under $${t.max}`:`$${t.min}+`;p.innerHTML=`${g} <span class="xtal-chip-x">\xD7</span>`,p.addEventListener("click",()=>this.onPriceChange(null)),o.appendChild(p)}l.appendChild(o),i.appendChild(l)}let c=this.buildCollapsibleSection("price","Price",0,t!==null,s,()=>{let l=document.createElement("div");l.className="xtal-price-presets";for(let m of this.pricePresets){let r=document.createElement("button");r.className="xtal-price-btn",q(t,m)&&r.classList.add("xtal-price-btn-active"),r.textContent=m.label,r.addEventListener("click",()=>{q(t,m)?this.onPriceChange(null):this.onPriceChange({min:m.min,max:m.max})}),l.appendChild(r)}return l});i.appendChild(c);let d=Object.entries(e);for(let[l,m]of d){let r=a[l]||[],o=r.length,p=this.buildCollapsibleSection(l,Y(l),o,o>0,s,()=>{let g=document.createElement("div");g.className="xtal-facet-list";let b=Object.entries(m).sort((y,C)=>C[1]-y[1]),x=`${s}-${l}`,v=this.showMore[x],E=v||b.length<=N?b:b.slice(0,N),S=b.length-N;for(let[y,C]of E){let M=r.includes(y),P=C===0&&!M,T=document.createElement("label");T.className="xtal-facet-label",P&&T.classList.add("xtal-facet-disabled");let w=document.createElement("input");w.type="checkbox",w.className="xtal-facet-checkbox",w.checked=M,P&&(w.disabled=!0),w.addEventListener("change",()=>this.onFacetToggle(l,y));let H=document.createElement("span");H.className="xtal-facet-text",H.textContent=B(y);let L=document.createElement("span");L.className="xtal-facet-count",L.textContent=String(C),T.appendChild(w),T.appendChild(H),T.appendChild(L),g.appendChild(T)}if(S>0){let y=document.createElement("button");y.className="xtal-show-more",y.textContent=v?"Show less":`Show ${S} more`,y.addEventListener("click",()=>{this.showMore[x]=!this.showMore[x];let C=y.parentElement;if(!C)return;let M=this.buildFacetList(l,m,r,s);C.replaceWith(M)}),g.appendChild(y)}return g});i.appendChild(p)}return i}buildFacetList(e,a,t,s){let i=document.createElement("div");i.className="xtal-facet-list";let u=`${s}-${e}`,c=Object.entries(a).sort((r,o)=>o[1]-r[1]),d=this.showMore[u],l=d||c.length<=N?c:c.slice(0,N),m=c.length-N;for(let[r,o]of l){let p=t.includes(r),g=o===0&&!p,b=document.createElement("label");b.className="xtal-facet-label",g&&b.classList.add("xtal-facet-disabled");let x=document.createElement("input");x.type="checkbox",x.className="xtal-facet-checkbox",x.checked=p,g&&(x.disabled=!0),x.addEventListener("change",()=>this.onFacetToggle(e,r));let v=document.createElement("span");v.className="xtal-facet-text",v.textContent=B(r);let E=document.createElement("span");E.className="xtal-facet-count",E.textContent=String(o),b.appendChild(x),b.appendChild(v),b.appendChild(E),i.appendChild(b)}if(m>0){let r=document.createElement("button");r.className="xtal-show-more",r.textContent=d?"Show less":`Show ${m} more`,r.addEventListener("click",()=>{this.showMore[u]=!this.showMore[u];let o=this.buildFacetList(e,a,t,s);i.replaceWith(o)}),i.appendChild(r)}return i}buildCollapsibleSection(e,a,t,s,i,u){let c=document.createElement("div");c.className="xtal-filter-section";let d=s||this.expandedSections.has(e),l=document.createElement("button");l.className="xtal-section-header";let m=document.createElement("span");if(m.className="xtal-section-label",m.textContent=a,t>0){let p=document.createElement("span");p.className="xtal-section-badge",p.textContent=String(t),m.appendChild(p)}let r=document.createElement("span");r.className="xtal-section-chevron",r.textContent=d?"\u25BE":"\u25B8",l.appendChild(m),l.appendChild(r),l.addEventListener("click",()=>{this.expandedSections.has(e)?this.expandedSections.delete(e):this.expandedSections.add(e);let p=c.querySelector(".xtal-section-content");p&&(p.style.display=p.style.display==="none"?"":"none",r.textContent=p.style.display==="none"?"\u25B8":"\u25BE")}),c.appendChild(l);let o=document.createElement("div");return o.className="xtal-section-content",d||(o.style.display="none"),o.appendChild(u()),c.appendChild(o),c}resetState(){this.showMore={}}openDrawer(){this.drawerOpen=!0,this.savedBodyOverflow=document.body.style.overflow,document.body.style.overflow="hidden",this.backdropEl.classList.add("xtal-backdrop-open"),this.drawerEl.classList.add("xtal-drawer-open")}closeDrawer(){this.drawerOpen=!1,document.body.style.overflow=this.savedBodyOverflow,this.backdropEl.classList.remove("xtal-backdrop-open"),this.drawerEl.classList.remove("xtal-drawer-open")}destroy(){this.drawerOpen&&this.closeDrawer(),this.railEl.remove(),this.fabEl.remove(),this.backdropEl.remove(),this.drawerEl.remove()}};function k(n,e){try{let a=new URL(n);return a.searchParams.set("utm_source","xtal"),a.searchParams.set("utm_medium","search"),a.searchParams.set("utm_campaign",e.shopId),a.searchParams.set("utm_content",e.productId),a.searchParams.set("utm_term",e.query),a.toString()}catch{return n}}function ee(n,e){let a=Array.isArray(n.price)?n.price[0]??0:n.price,t=n.variants?.[0]?.compare_at_price,s={id:n.id??"",title:n.title??"",vendor:n.vendor??"",product_type:n.product_type??"",price:a.toFixed(2),image_url:n.image_url||n.featured_image||n.images?.[0]?.src||"",product_url:e||n.product_url||"",available:n.available?"true":"",description:n.description??""};t&&t>a&&(s.compare_at_price=t.toFixed(2));let i=n.variants?.[0];if(i&&(i.sku&&(s.sku=i.sku),i.title&&(s.variant_title=i.title)),n.tags?.length){s.tags=n.tags.join(", ");for(let u of n.tags){let c=u.indexOf(":");if(c>0){let d=u.slice(0,c).trim().toLowerCase().replace(/\s+/g,"_"),l=u.slice(c+1).trim();d&&l&&!(d in s)&&(s[d]=l)}}}return s}function te(n,e){let a=n.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,s,i)=>e[s]?i:"");return a=a.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,s,i)=>e[s]?"":i),a}function ne(n,e){return n.replace(/\{\{(\w+)\}\}/g,(a,t)=>e[t]??"")}function re(n){let e=document.createElement("div");return e.innerHTML=n.trim(),e.firstElementChild||e}function F(n,e,a,t,s,i,u){let c=ee(e,u),d=te(n,c);d=ne(d,c);let l=re(d),m=k(u||e.product_url||"#",{shopId:t,productId:e.id,query:a});return l.querySelectorAll('[data-xtal-action="view-product"]').forEach(r=>{r.tagName==="A"?(r.href=m,r.target="_blank",r.rel="noopener noreferrer"):(r.style.cursor="pointer",r.addEventListener("click",o=>{o.preventDefault(),s.onViewProduct(e)}))}),l.querySelectorAll('[data-xtal-action="add-to-cart"]').forEach(r=>{i==="fallback"&&(r.textContent="View Product"),r.addEventListener("click",async o=>{o.preventDefault(),o.stopPropagation();let p=r.textContent;r.textContent="Adding...",r.style.opacity="0.7",r.style.pointerEvents="none";try{await s.onAddToCart(e)}finally{r.textContent=p,r.style.opacity="",r.style.pointerEvents=""}})}),l}function ae(n){if(Array.isArray(n)){let e=[...n].sort((a,t)=>a-t);return e.length===0?"N/A":e.length===1||e[0]===e[e.length-1]?`$${e[0].toFixed(2)}`:`$${e[0].toFixed(2)} \u2013 $${e[e.length-1].toFixed(2)}`}return`$${n.toFixed(2)}`}function X(n,e,a,t,s,i){if(t&&s)return F(t.html,n,e,a,s);let u=n.image_url||n.featured_image||n.images&&n.images[0]?.src,c=document.createElement("a");c.className="xtal-card",c.href=k(i||n.product_url||"#",{shopId:a,productId:n.id,query:e}),c.target="_blank",c.rel="noopener noreferrer";let d=document.createElement("div");if(d.className="xtal-card-image",u){let o=document.createElement("img");o.src=u,o.alt=n.title,o.loading="lazy",d.appendChild(o)}else{let o=document.createElement("span");o.className="xtal-card-image-placeholder",o.textContent="No image",d.appendChild(o)}c.appendChild(d);let l=document.createElement("div");if(l.className="xtal-card-body",n.vendor){let o=document.createElement("div");o.className="xtal-card-vendor",o.textContent=n.vendor,l.appendChild(o)}let m=document.createElement("div");m.className="xtal-card-title",m.textContent=n.title,l.appendChild(m);let r=document.createElement("div");return r.className="xtal-card-price",r.textContent=ae(n.price),l.appendChild(r),c.appendChild(l),c}function V(n,e,a){let t=null,s=null,i=[];function u(l){let m=l.closest("form");if(m){let o=p=>{p.preventDefault(),p.stopImmediatePropagation();let g=l.value.trim();g.length>=1&&e(g)};m.addEventListener("submit",o,!0),i.push(()=>m.removeEventListener("submit",o,!0))}let r=o=>{if(o.key==="Enter"){o.preventDefault(),o.stopImmediatePropagation();let p=l.value.trim();p.length>=1&&e(p)}};l.addEventListener("keydown",r,!0),i.push(()=>l.removeEventListener("keydown",r,!0))}let c=document.querySelector(n);if(c)return u(c),()=>i.forEach(l=>l());t=new MutationObserver(l=>{for(let m of l)for(let r of Array.from(m.addedNodes)){if(!(r instanceof HTMLElement))continue;let o=r.matches(n)?r:r.querySelector(n);if(o){u(o),t?.disconnect(),t=null,s&&clearTimeout(s),s=null;return}}}),t.observe(document.body,{childList:!0,subtree:!0});let d=a??1e4;return s=setTimeout(()=>{t?.disconnect(),t=null,console.warn(`[xtal.js] Could not find input matching "${n}" after ${d/1e3}s`)},d),()=>{i.forEach(l=>l()),t?.disconnect(),t=null,s&&clearTimeout(s)}}function ie(n){return typeof n=="string"&&n.includes("/")?n.split("/").pop():n}var I=class{constructor(){this.name="shopify"}async addToCart(e,a=1){let t=e.variants?.[0]?.id;if(!t)return{success:!1,message:"No variant available"};if(!e.available)return{success:!1,message:"Product unavailable"};let s=ie(t);try{let i=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:s,quantity:a})});return i.ok?{success:!0,message:"Added to cart"}:i.status===422?{success:!1,message:(await i.json().catch(()=>({}))).description||"Could not add to cart"}:{success:!1,message:`Cart error (${i.status})`}}catch(i){return{success:!1,message:i instanceof Error?i.message:"Network error"}}}};var R=class{constructor(e,a,t){this.name="fallback";this.shopId=e,this.queryFn=a,this.resolveUrl=t}async addToCart(e){let a=this.resolveUrl?.(e)??e.product_url??"#",t=k(a,{shopId:this.shopId,productId:e.id,query:this.queryFn()});return window.open(t,"_blank","noopener,noreferrer"),{success:!0,message:"Opening product page..."}}};function W(n,e,a){return window.Shopify?new I:new R(n,e,a)}function O(n,e,a,t){try{let s=`${n}/api/xtal/events`,i=JSON.stringify({action:"error",collection:e,error:a,context:t,ts:Date.now()});navigator.sendBeacon?.(s,i)||fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:i,keepalive:!0}).catch(()=>{})}catch{}}function oe(){if(document.getElementById("xtal-filter-styles"))return;let n=document.createElement("style");n.id="xtal-filter-styles",n.textContent=`
/* \u2500\u2500 Layout \u2500\u2500 */
.xtal-layout { display: flex; gap: 40px; }
.xtal-rail-slot { flex-shrink: 0; }
.xtal-grid-slot { flex: 1; min-width: 0; }

/* \u2500\u2500 Desktop filter rail \u2500\u2500 */
.xtal-filter-rail {
  width: 260px;
  font-family: "Manrope", serif;
  font-size: 14px;
  color: #1d1d1b;
  position: sticky;
  top: 20px;
  align-self: flex-start;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding-right: 8px;
}
.xtal-filter-rail::-webkit-scrollbar { width: 4px; }
.xtal-filter-rail::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
.xtal-filter-rail::-webkit-scrollbar-track { background: transparent; }

/* \u2500\u2500 Responsive grid \u2500\u2500 */
.xtal-grid {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 20px !important;
  padding: 20px 0 40px 0 !important;
  flex-wrap: initial !important;
}
.xtal-grid .product-card { width: auto !important; }
@media (min-width: 640px) {
  .xtal-grid { grid-template-columns: repeat(3, 1fr) !important; }
}
@media (min-width: 1024px) {
  .xtal-grid { grid-template-columns: repeat(4, 1fr) !important; }
}

/* \u2500\u2500 Filter sections \u2500\u2500 */
.xtal-filter-section { border-bottom: 1px solid #e5e5e5; padding-bottom: 12px; margin-bottom: 12px; }
.xtal-filter-section:last-child { border-bottom: none; }
.xtal-section-header {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 6px 0; background: none; border: none;
  cursor: pointer; font-size: 14px; font-weight: 600; color: #1d1d1b;
  font-family: inherit;
}
.xtal-section-header:hover { color: #000; }
.xtal-section-label { display: flex; align-items: center; gap: 8px; }
.xtal-section-badge {
  font-size: 10px; padding: 1px 6px; border-radius: 9999px;
  background: #1d1d1b; color: #fff; font-weight: 600;
}
.xtal-section-chevron { font-size: 12px; color: #999; }
.xtal-section-content { margin-top: 6px; }

/* \u2500\u2500 Facet checkboxes \u2500\u2500 */
.xtal-facet-list { display: flex; flex-direction: column; gap: 4px; }
.xtal-facet-label {
  display: flex; align-items: center; gap: 8px; padding: 2px 0;
  cursor: pointer; font-size: 13px; color: #444 !important;
}
.xtal-facet-label:hover { color: #1d1d1b !important; }
.xtal-facet-disabled { opacity: 0.4; pointer-events: none; }
.xtal-facet-checkbox {
  width: 14px; height: 14px; border-radius: 3px;
  accent-color: #1d1d1b; cursor: pointer; flex-shrink: 0;
}
.xtal-facet-text { flex: 1; color: inherit !important; }
.xtal-facet-count { font-size: 11px; color: #999 !important; }
.xtal-show-more {
  background: none; border: none; cursor: pointer;
  font-size: 12px; color: #1d1d1b; padding: 4px 0;
  font-family: inherit; text-decoration: underline;
}
.xtal-show-more:hover { color: #000; }

/* \u2500\u2500 Price presets \u2500\u2500 */
.xtal-price-presets { display: flex; flex-wrap: wrap; gap: 6px; }
.xtal-price-btn {
  padding: 6px 12px; border: 1px solid #ddd; border-radius: 6px;
  background: #fff; cursor: pointer; font-size: 12px; color: #444;
  font-family: inherit; transition: all 0.15s;
}
.xtal-price-btn:hover { border-color: #1d1d1b; color: #1d1d1b; }
.xtal-price-btn-active {
  background: #1d1d1b; color: #fff; border-color: #1d1d1b;
}

/* \u2500\u2500 Applied filters \u2500\u2500 */
.xtal-applied-section { margin-bottom: 16px; }
.xtal-clear-row { display: flex; justify-content: flex-end; margin-bottom: 8px; }
.xtal-clear-all {
  background: none; border: none; cursor: pointer;
  font-size: 12px; color: #999; font-family: inherit;
}
.xtal-clear-all:hover { color: #1d1d1b; }
.xtal-applied-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.xtal-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 9999px;
  background: #f0eeea; border: none; cursor: pointer;
  font-size: 12px; color: #1d1d1b; font-family: inherit;
}
.xtal-chip:hover { background: #e0ddd8; }
.xtal-chip-x { font-size: 14px; line-height: 1; opacity: 0.6; }

/* \u2500\u2500 Mobile: hide rail, show FAB + drawer \u2500\u2500 */
.xtal-filter-fab {
  display: none; position: fixed;
  bottom: max(24px, env(safe-area-inset-bottom, 0px) + 16px);
  left: 50%; transform: translateX(-50%); z-index: 2147483647;
  align-items: center; justify-content: center; gap: 8px;
  padding: 14px 24px; border-radius: 9999px;
  background: #1d1d1b; color: #fff;
  border: 1px solid rgba(255,255,255,0.15); cursor: pointer;
  font-family: "Manrope", system-ui, -apple-system, sans-serif;
  font-size: 15px; font-weight: 600;
  line-height: 1; letter-spacing: 0.3px; text-transform: none;
  box-sizing: border-box;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 12px 28px rgba(0,0,0,0.3);
}
.xtal-filter-fab:active { transform: translateX(-50%) scale(0.96); transition: transform 0.1s ease; }
.xtal-fab-text { margin: 0; padding: 0; display: block; }
.xtal-fab-badge {
  display: flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%;
  background: #fff; color: #1d1d1b; font-size: 12px; font-weight: 700;
  line-height: 1; margin-left: 2px;
}
.xtal-fab-hidden { display: none !important; }
@keyframes xtalFabSlideUp {
  0% { opacity: 0; transform: translate(-50%, 150%); }
  100% { opacity: 1; transform: translate(-50%, 0); }
}

.xtal-backdrop {
  display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  z-index: 9998; opacity: 0; pointer-events: none; transition: opacity 0.2s;
}
.xtal-backdrop-open { opacity: 1; pointer-events: auto; }

.xtal-filter-drawer {
  display: none; position: fixed; top: 0; left: 0; height: 100%;
  width: 85vw; max-width: 360px; background: #fff; z-index: 9999;
  box-shadow: 4px 0 20px rgba(0,0,0,0.15);
  flex-direction: column;
  transform: translateX(-100%); transition: transform 0.25s ease;
}
.xtal-drawer-open { transform: translateX(0); }

.xtal-drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px; border-bottom: 1px solid #e5e5e5;
}
.xtal-drawer-title {
  font-family: "Manrope", serif; font-size: 14px; font-weight: 700; color: #1d1d1b;
}
.xtal-drawer-close {
  background: none; border: none; cursor: pointer; padding: 8px;
  color: #999; display: flex; align-items: center;
}
.xtal-drawer-close:hover { color: #1d1d1b; }
.xtal-drawer-content {
  flex: 1; overflow-y: auto; padding: 16px;
  font-family: "Manrope", serif; font-size: 14px; color: #1d1d1b;
}
.xtal-drawer-footer {
  padding: 16px; border-top: 1px solid #e5e5e5;
}
.xtal-drawer-apply {
  width: 100%; padding: 12px; background: #1d1d1b; color: #fff;
  border: none; border-radius: 8px; cursor: pointer;
  font-family: "Manrope", serif; font-size: 14px; font-weight: 600;
}
.xtal-drawer-apply:hover { background: #333; }

@media (max-width: 767px) {
  .xtal-filter-rail { display: none; }
  .xtal-layout { display: block !important; }
  .xtal-filter-fab {
    display: flex !important;
    animation: xtalFabSlideUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
  }
  .xtal-backdrop { display: block; }
  .xtal-filter-drawer { display: flex; }
}
`,document.head.appendChild(n)}function J(){try{let n=document.querySelector("script[data-shop-id]");if(!n){console.warn("[xtal.js] No <script data-shop-id> tag found");return}let e=n.getAttribute("data-shop-id")??"";if(!e){console.warn("[xtal.js] data-shop-id is empty");return}let a="",t=n.getAttribute("src");if(t)try{a=new URL(t,window.location.href).origin}catch{a=window.location.origin}else a=window.location.origin;let s=new _(a,e);s.fetchConfig().then(i=>{if(!i.enabled){console.log(`[xtal.js] Snippet disabled for ${e}`);return}let u=i.cardTemplate??null;if(u?.css){let o=document.getElementById("xtal-card-styles");o&&o.remove();let p=document.createElement("style");p.id="xtal-card-styles",p.textContent=u.css,document.head.appendChild(p)}function c(o){if(i.productUrlPattern){let g=o.variants?.[0]?.sku||"";if(g)return i.productUrlPattern.replace("{sku}",encodeURIComponent(g)).replace("{id}",o.id||"")}let p=o.product_url||"#";return!p||p==="#"?"#":p.startsWith("http://")||p.startsWith("https://")?p:i.siteUrl?i.siteUrl.replace(/\/$/,"")+p:p}let d="",l=W(e,()=>d,c);console.log(`[xtal.js] Cart adapter: ${l.name}`);let m=i.displayMode==="inline"&&!!i.resultsSelector,r=m?document.querySelector(i.resultsSelector):null;if(m&&!r){console.log(`[xtal.js] Inline mode: "${i.resultsSelector}" not found \u2014 standing by`);return}{let o=new $(r),p=null,g=i.features?.filters===!0,b=null,x={},v=null,E=null,S=0,y={},C=null;g&&(oe(),o.initLayout());let M=()=>{if(E||!g)return;let f=o.initLayout();E=new A(f,(h,U)=>{x[h]||(x[h]=[]);let D=x[h].indexOf(U);D>=0?(x[h].splice(D,1),x[h].length===0&&delete x[h]):x[h].push(U),w()},h=>{v=h,w()},()=>{x={},v=null,w()},i.pricePresets)},P={onViewProduct(f){let h=k(c(f),{shopId:e,productId:f.id,query:d});window.open(h,"_blank","noopener,noreferrer")},async onAddToCart(f){let h=await l.addToCart(f);console.log(`[xtal.js] Add to cart: ${h.success?"OK":"FAIL"} \u2014 ${h.message}`),h.success&&fetch(`${a}/api/xtal/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:f.id,action:"add_to_cart",collection:e,query:d})}).catch(()=>{})}},T=f=>f.map(h=>u?F(u.html,h,d,e,P,l.name,c(h)):X(h,d,e,null,P,c(h))),w=()=>{b&&(C&&clearTimeout(C),C=setTimeout(()=>{o.showLoading(d),s.searchFiltered(d,b,{facetFilters:x,priceRange:v,limit:24}).then(f=>{S=f.total,y=f.computed_facets||{},f.results.length===0?o.renderEmpty(d):o.renderCards(T(f.results)),E?.update(y,x,v,S)}).catch(f=>{f instanceof DOMException&&f.name==="AbortError"||(console.error("[xtal.js] Filter error:",f),O(a,e,String(f),"filter"))})},150))},H=f=>{d=f,b=null,x={},v=null,E?.closeDrawer(),E?.resetState(),o.showLoading(f),s.searchFull(f,24).then(h=>{if(S=h.total,y=h.computed_facets||{},b=h.search_context||null,M(),h.results.length===0){o.renderEmpty(f),E?.update({},{},null,0);return}o.renderCards(T(h.results)),E?.update(y,x,v,S)}).catch(h=>{h instanceof DOMException&&h.name==="AbortError"||(console.error("[xtal.js] Search error:",h),O(a,e,String(h),"search"),o.restore(),i.siteUrl&&d&&(window.location.href=`${i.siteUrl.replace(/\/$/,"")}/shop/?Search=${encodeURIComponent(d)}`))})},L=null,K=f=>{L&&clearTimeout(L),L=setTimeout(()=>H(f),200)},j=i.searchSelector||'input[type="search"]';p=V(j,K,i.observerTimeoutMs);let z=document.querySelector(j);z?.value?.trim()&&H(z.value.trim()),window.XTAL={destroy(){L&&clearTimeout(L),C&&clearTimeout(C),s.abort(),p?.(),E?.destroy(),o.destroy();let f=document.getElementById("xtal-card-styles");f&&f.remove();let h=document.getElementById("xtal-filter-styles");h&&h.remove(),window.XTAL=void 0}},console.log(`[xtal.js] Initialized INLINE for ${e}. Search: ${j}, Grid: ${i.resultsSelector}${g?", Filters: ON":""}`)}}).catch(i=>{console.error("[xtal.js] Failed to fetch config:",i),O(a,e,String(i),"config")})}catch(n){console.error("[xtal.js] Boot error:",n)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",J):J();})();
