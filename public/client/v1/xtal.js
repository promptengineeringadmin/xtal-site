"use strict";var XTAL=(()=>{var P=class{constructor(e,i){this.controller=null;this.apiBase=e,this.shopId=i}abort(){this.controller&&(this.controller.abort(),this.controller=null)}async fetchConfig(){let e=new AbortController,i=setTimeout(()=>e.abort(),5e3);try{let t=await fetch(`${this.apiBase}/api/xtal/config?shopId=${encodeURIComponent(this.shopId)}`,{mode:"cors",signal:e.signal});if(!t.ok)throw new Error(`Config fetch failed: ${t.status}`);return t.json()}finally{clearTimeout(i)}}async searchFull(e,i=16,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=await fetch(`${this.apiBase}/api/xtal/search-full`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,limit:i,selected_aspects:t}),signal:this.controller.signal});if(!o.ok)throw new Error(`Search failed: ${o.status}`);return o.json()}async searchFiltered(e,i,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=t?.facetFilters&&Object.values(t.facetFilters).some(c=>c.length>0),a=t?.priceRange?{min:t.priceRange.min,max:t.priceRange.max}:void 0,d=await fetch(`${this.apiBase}/api/xtal/search`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,search_context:i,limit:t?.limit??24,...o?{facet_filters:t.facetFilters}:{},...a?{price_range:a}:{}}),signal:this.controller.signal});if(!d.ok)throw new Error(`Filter search failed: ${d.status}`);return d.json()}};var $=class{constructor(e){this.originalHTML=null;this.originalDisplay="";this.layoutEl=null;this.railSlot=null;this.gridSlot=null;this.loadingPhraseTimer=null;this.target=e}captureOriginal(){this.originalHTML===null&&(this.originalHTML=this.target.innerHTML,this.originalDisplay=this.target.style.display,this.target.style.display="block",this.target.style.width="100%")}initLayout(){return this.layoutEl?this.railSlot:(this.captureOriginal(),this.target.innerHTML="",this.layoutEl=document.createElement("div"),this.layoutEl.className="xtal-layout",this.railSlot=document.createElement("div"),this.railSlot.className="xtal-rail-slot",this.gridSlot=document.createElement("div"),this.gridSlot.className="xtal-grid-slot",this.layoutEl.appendChild(this.railSlot),this.layoutEl.appendChild(this.gridSlot),this.target.appendChild(this.layoutEl),this.railSlot)}showLoading(e){this.captureOriginal(),this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null);let i=this.gridSlot||this.target;if(i.innerHTML="",!document.getElementById("xtal-inline-keyframes")){let n=document.createElement("style");n.id="xtal-inline-keyframes",n.textContent=["@keyframes xtal-inline-spin{to{transform:rotate(360deg)}}","@keyframes xtal-pulse{0%,100%{opacity:1}50%{opacity:0.4}}"].join(""),document.head.appendChild(n)}let t=document.createElement("div");t.style.cssText="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;width:100%;";let o=document.createElement("div");o.style.cssText="position:relative;width:48px;height:48px;margin-bottom:12px;";let a=document.createElement("div");a.style.cssText="position:absolute;inset:0;border:3px solid #e5e5e5;border-radius:50%;";let d=document.createElement("div");d.style.cssText="position:absolute;inset:0;border:3px solid transparent;border-top-color:#1d1d1b;border-radius:50%;animation:xtal-inline-spin .8s linear infinite;";let c=document.createElement("div");if(c.style.cssText="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;",c.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:xtal-pulse 2s ease-in-out infinite"><path d="M12 3l1.91 5.49L19.4 10.4l-5.49 1.91L12 17.8l-1.91-5.49L4.6 10.4l5.49-1.91z"/><path d="M19 2l.5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5z"/><path d="M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5z"/></svg>',o.appendChild(a),o.appendChild(d),o.appendChild(c),t.appendChild(o),e){let n=e.length>80?e.slice(0,77)+"\u2026":e,s=document.createElement("p");s.style.cssText="margin:0 0 8px 0;font-size:14px;color:#555;font-style:italic;text-align:center;max-width:320px;",s.textContent=`\u201C${n}\u201D`,t.appendChild(s)}let u=["Analyzing search intent\u2026","Finding best matches\u2026","Ranking results\u2026","Almost there\u2026"],l=document.createElement("p");l.style.cssText="margin:0;font-size:13px;color:#999;text-align:center;transition:opacity 0.3s;",l.textContent=u[0],t.appendChild(l);let m=0;this.loadingPhraseTimer=setInterval(()=>{l.style.opacity="0",setTimeout(()=>{m=(m+1)%u.length,l.textContent=u[m],l.style.opacity="1"},300)},2500),i.appendChild(t)}clearPhraseTimer(){this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null)}renderCards(e){this.clearPhraseTimer();let i=this.gridSlot||this.target;i.innerHTML="";let t=document.createElement("div");t.className="xtal-grid";for(let o of e)t.appendChild(o);i.appendChild(t)}renderEmpty(e){this.clearPhraseTimer();let i=this.gridSlot||this.target;i.innerHTML="";let t=document.createElement("div");t.style.cssText="text-align:center;padding:60px 20px;color:#888;font-size:14px;",t.textContent=`No results found for "${e}"`,i.appendChild(t)}restore(){this.layoutEl=null,this.railSlot=null,this.gridSlot=null,this.originalHTML!==null&&(this.target.innerHTML=this.originalHTML,this.target.style.display=this.originalDisplay,this.target.style.width="",this.originalHTML=null)}destroy(){this.clearPhraseTimer(),this.restore();let e=document.getElementById("xtal-inline-keyframes");e&&e.remove()}};var G={"product-subcategory":"Category",brand:"Brand",vendor:"Vendor","product-age":"Age",proof:"Proof",region:"Region",size:"Size",terpene:"Terpene",effect:"Effect","strain-type":"Strain Type",format:"Format",material:"Material",shape:"Shape","use-case":"Use Case",feature:"Feature",design:"Design",style:"Style",color:"Color"},Q=["product-subcategory","brand","vendor","strain-type","terpene","effect","format","material","use-case","style"],N=5,Z=[{label:"Under $25",max:25},{label:"$25\u2013$50",min:25,max:50},{label:"$50\u2013$100",min:50,max:100},{label:"$100\u2013$200",min:100,max:200},{label:"$200+",min:200}];function B(r){return r.split(/[-_]/).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function Y(r){return G[r]||r.split("-").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function q(r,e){return r?r.min===e.min&&r.max===e.max:!1}var A=class{constructor(e,i,t,o,a){this.expandedSections=new Set(["price"].concat(Q));this.showMore={};this.drawerOpen=!1;this.savedBodyOverflow="";this.container=e,this.onFacetToggle=i,this.onPriceChange=t,this.onClearAll=o,this.pricePresets=a||Z,this.railEl=document.createElement("aside"),this.railEl.className="xtal-filter-rail",e.appendChild(this.railEl),this.fabEl=document.createElement("button"),this.fabEl.className="xtal-filter-fab",this.fabEl.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg><span class="xtal-fab-text">Filters</span>',this.fabEl.addEventListener("click",()=>this.openDrawer()),document.body.appendChild(this.fabEl),this.backdropEl=document.createElement("div"),this.backdropEl.className="xtal-backdrop",this.backdropEl.addEventListener("click",()=>this.closeDrawer()),document.body.appendChild(this.backdropEl),this.drawerEl=document.createElement("div"),this.drawerEl.className="xtal-filter-drawer";let d=document.createElement("div");d.className="xtal-drawer-header",d.innerHTML='<span class="xtal-drawer-title">Filters</span>';let c=document.createElement("button");c.className="xtal-drawer-close",c.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',c.setAttribute("aria-label","Close filters"),c.addEventListener("click",()=>this.closeDrawer()),d.appendChild(c),this.drawerEl.appendChild(d),this.drawerContentEl=document.createElement("div"),this.drawerContentEl.className="xtal-drawer-content",this.drawerEl.appendChild(this.drawerContentEl);let u=document.createElement("div");u.className="xtal-drawer-footer",this.drawerFooterBtn=document.createElement("button"),this.drawerFooterBtn.className="xtal-drawer-apply",this.drawerFooterBtn.textContent="Show results",this.drawerFooterBtn.addEventListener("click",()=>this.closeDrawer()),u.appendChild(this.drawerFooterBtn),this.drawerEl.appendChild(u),document.body.appendChild(this.drawerEl)}update(e,i,t,o){let a=e&&Object.keys(e).length>0,d=Object.values(i).some(n=>n.length>0)||t!==null;if(this.railEl.style.display=!a&&!d?"none":"",this.fabEl.style.display="",!a&&!d){this.fabEl.classList.add("xtal-fab-hidden");return}else this.fabEl.classList.remove("xtal-fab-hidden");this.railEl.innerHTML="",this.drawerContentEl.innerHTML="";let c=this.buildFilterSections(e,i,t,"desktop"),u=this.buildFilterSections(e,i,t,"mobile");this.railEl.appendChild(c),this.drawerContentEl.appendChild(u);let l=Object.values(i).reduce((n,s)=>n+s.length,0)+(t?1:0),m=this.fabEl.querySelector(".xtal-fab-badge");if(m&&m.remove(),l>0){let n=document.createElement("span");n.className="xtal-fab-badge",n.textContent=String(l),this.fabEl.appendChild(n)}this.drawerFooterBtn.textContent=`Show ${o} result${o!==1?"s":""}`}buildFilterSections(e,i,t,o){let a=document.createDocumentFragment();if(Object.values(i).some(l=>l.length>0)||t!==null){let l=document.createElement("div");l.className="xtal-applied-section";let m=document.createElement("div");m.className="xtal-clear-row";let n=document.createElement("button");n.className="xtal-clear-all",n.textContent="Clear all",n.addEventListener("click",()=>this.onClearAll()),m.appendChild(n),l.appendChild(m);let s=document.createElement("div");s.className="xtal-applied-chips";for(let[p,g]of Object.entries(i))for(let b of g){let f=document.createElement("button");f.className="xtal-chip",f.innerHTML=`${B(b)} <span class="xtal-chip-x">\xD7</span>`,f.addEventListener("click",()=>this.onFacetToggle(p,b)),s.appendChild(f)}if(t){let p=document.createElement("button");p.className="xtal-chip";let g=t.min&&t.max?`$${t.min}\u2013$${t.max}`:t.max?`Under $${t.max}`:`$${t.min}+`;p.innerHTML=`${g} <span class="xtal-chip-x">\xD7</span>`,p.addEventListener("click",()=>this.onPriceChange(null)),s.appendChild(p)}l.appendChild(s),a.appendChild(l)}let c=this.buildCollapsibleSection("price","Price",0,t!==null,o,()=>{let l=document.createElement("div");l.className="xtal-price-presets";for(let m of this.pricePresets){let n=document.createElement("button");n.className="xtal-price-btn",q(t,m)&&n.classList.add("xtal-price-btn-active"),n.textContent=m.label,n.addEventListener("click",()=>{q(t,m)?this.onPriceChange(null):this.onPriceChange({min:m.min,max:m.max})}),l.appendChild(n)}return l});a.appendChild(c);let u=Object.entries(e);for(let[l,m]of u){let n=i[l]||[],s=n.length,p=this.buildCollapsibleSection(l,Y(l),s,s>0,o,()=>{let g=document.createElement("div");g.className="xtal-facet-list";let b=Object.entries(m).sort((y,C)=>C[1]-y[1]),f=`${o}-${l}`,v=this.showMore[f],E=v||b.length<=N?b:b.slice(0,N),S=b.length-N;for(let[y,C]of E){let M=n.includes(y),_=C===0&&!M,T=document.createElement("label");T.className="xtal-facet-label",_&&T.classList.add("xtal-facet-disabled");let w=document.createElement("input");w.type="checkbox",w.className="xtal-facet-checkbox",w.checked=M,_&&(w.disabled=!0),w.addEventListener("change",()=>this.onFacetToggle(l,y));let H=document.createElement("span");H.className="xtal-facet-text",H.textContent=B(y);let L=document.createElement("span");L.className="xtal-facet-count",L.textContent=String(C),T.appendChild(w),T.appendChild(H),T.appendChild(L),g.appendChild(T)}if(S>0){let y=document.createElement("button");y.className="xtal-show-more",y.textContent=v?"Show less":`Show ${S} more`,y.addEventListener("click",()=>{this.showMore[f]=!this.showMore[f];let C=y.parentElement;if(!C)return;let M=this.buildFacetList(l,m,n,o);C.replaceWith(M)}),g.appendChild(y)}return g});a.appendChild(p)}return a}buildFacetList(e,i,t,o){let a=document.createElement("div");a.className="xtal-facet-list";let d=`${o}-${e}`,c=Object.entries(i).sort((n,s)=>s[1]-n[1]),u=this.showMore[d],l=u||c.length<=N?c:c.slice(0,N),m=c.length-N;for(let[n,s]of l){let p=t.includes(n),g=s===0&&!p,b=document.createElement("label");b.className="xtal-facet-label",g&&b.classList.add("xtal-facet-disabled");let f=document.createElement("input");f.type="checkbox",f.className="xtal-facet-checkbox",f.checked=p,g&&(f.disabled=!0),f.addEventListener("change",()=>this.onFacetToggle(e,n));let v=document.createElement("span");v.className="xtal-facet-text",v.textContent=B(n);let E=document.createElement("span");E.className="xtal-facet-count",E.textContent=String(s),b.appendChild(f),b.appendChild(v),b.appendChild(E),a.appendChild(b)}if(m>0){let n=document.createElement("button");n.className="xtal-show-more",n.textContent=u?"Show less":`Show ${m} more`,n.addEventListener("click",()=>{this.showMore[d]=!this.showMore[d];let s=this.buildFacetList(e,i,t,o);a.replaceWith(s)}),a.appendChild(n)}return a}buildCollapsibleSection(e,i,t,o,a,d){let c=document.createElement("div");c.className="xtal-filter-section";let u=o||this.expandedSections.has(e),l=document.createElement("button");l.className="xtal-section-header";let m=document.createElement("span");if(m.className="xtal-section-label",m.textContent=i,t>0){let p=document.createElement("span");p.className="xtal-section-badge",p.textContent=String(t),m.appendChild(p)}let n=document.createElement("span");n.className="xtal-section-chevron",n.textContent=u?"\u25BE":"\u25B8",l.appendChild(m),l.appendChild(n),l.addEventListener("click",()=>{this.expandedSections.has(e)?this.expandedSections.delete(e):this.expandedSections.add(e);let p=c.querySelector(".xtal-section-content");p&&(p.style.display=p.style.display==="none"?"":"none",n.textContent=p.style.display==="none"?"\u25B8":"\u25BE")}),c.appendChild(l);let s=document.createElement("div");return s.className="xtal-section-content",u||(s.style.display="none"),s.appendChild(d()),c.appendChild(s),c}resetState(){this.showMore={}}openDrawer(){this.drawerOpen=!0,this.savedBodyOverflow=document.body.style.overflow,document.body.style.overflow="hidden",this.backdropEl.classList.add("xtal-backdrop-open"),this.drawerEl.classList.add("xtal-drawer-open")}closeDrawer(){this.drawerOpen=!1,document.body.style.overflow=this.savedBodyOverflow,this.backdropEl.classList.remove("xtal-backdrop-open"),this.drawerEl.classList.remove("xtal-drawer-open")}destroy(){this.drawerOpen&&this.closeDrawer(),this.railEl.remove(),this.fabEl.remove(),this.backdropEl.remove(),this.drawerEl.remove()}};function k(r,e){try{let i=new URL(r);return i.searchParams.set("utm_source","xtal"),i.searchParams.set("utm_medium","search"),i.searchParams.set("utm_campaign",e.shopId),i.searchParams.set("utm_content",e.productId),i.searchParams.set("utm_term",e.query),i.toString()}catch{return r}}function ee(r,e){let i=Array.isArray(r.price)?r.price[0]??0:r.price,t=r.variants?.[0]?.compare_at_price,o={id:r.id??"",title:r.title??"",vendor:r.vendor??"",product_type:r.product_type??"",price:i.toFixed(2),image_url:r.image_url||r.featured_image||r.images?.[0]?.src||"",product_url:e||r.product_url||"",available:r.available?"true":"",description:r.description??""};t&&t>i&&(o.compare_at_price=t.toFixed(2));let a=r.variants?.[0];if(a&&(a.sku&&(o.sku=a.sku),a.title&&(o.variant_title=a.title)),r.tags?.length){o.tags=r.tags.join(", ");for(let d of r.tags){let c=d.indexOf(":");if(c>0){let u=d.slice(0,c).trim().toLowerCase().replace(/\s+/g,"_"),l=d.slice(c+1).trim();u&&l&&!(u in o)&&(o[u]=l)}}}return o}function te(r,e){let i=r.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,a)=>e[o]?a:"");return i=i.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,a)=>e[o]?"":a),i}function ne(r,e){return r.replace(/\{\{(\w+)\}\}/g,(i,t)=>e[t]??"")}function re(r){let e=document.createElement("div");return e.innerHTML=r.trim(),e.firstElementChild||e}function F(r,e,i,t,o,a,d){let c=ee(e,d),u=te(r,c);u=ne(u,c);let l=re(u),m=k(d||e.product_url||"#",{shopId:t,productId:e.id,query:i});return l.querySelectorAll('[data-xtal-action="view-product"]').forEach(n=>{n.tagName==="A"?(n.href=m,n.target="_blank",n.rel="noopener noreferrer"):(n.style.cursor="pointer",n.addEventListener("click",s=>{s.preventDefault(),o.onViewProduct(e)}))}),l.querySelectorAll('[data-xtal-action="add-to-cart"]').forEach(n=>{a==="fallback"&&(n.textContent="View Product"),n.addEventListener("click",async s=>{s.preventDefault(),s.stopPropagation();let p=n.textContent;n.textContent="Adding...",n.style.opacity="0.7",n.style.pointerEvents="none";try{await o.onAddToCart(e)}finally{n.textContent=p,n.style.opacity="",n.style.pointerEvents=""}})}),l}function ae(r){if(Array.isArray(r)){let e=[...r].sort((i,t)=>i-t);return e.length===0?"N/A":e.length===1||e[0]===e[e.length-1]?`$${e[0].toFixed(2)}`:`$${e[0].toFixed(2)} \u2013 $${e[e.length-1].toFixed(2)}`}return`$${r.toFixed(2)}`}function X(r,e,i,t,o){if(t&&o)return F(t.html,r,e,i,o);let a=r.image_url||r.featured_image||r.images&&r.images[0]?.src,d=document.createElement("a");d.className="xtal-card",d.href=k(r.product_url||"#",{shopId:i,productId:r.id,query:e}),d.target="_blank",d.rel="noopener noreferrer";let c=document.createElement("div");if(c.className="xtal-card-image",a){let n=document.createElement("img");n.src=a,n.alt=r.title,n.loading="lazy",c.appendChild(n)}else{let n=document.createElement("span");n.className="xtal-card-image-placeholder",n.textContent="No image",c.appendChild(n)}d.appendChild(c);let u=document.createElement("div");if(u.className="xtal-card-body",r.vendor){let n=document.createElement("div");n.className="xtal-card-vendor",n.textContent=r.vendor,u.appendChild(n)}let l=document.createElement("div");l.className="xtal-card-title",l.textContent=r.title,u.appendChild(l);let m=document.createElement("div");return m.className="xtal-card-price",m.textContent=ae(r.price),u.appendChild(m),d.appendChild(u),d}function V(r,e,i){let t=null,o=null,a=[];function d(l){let m=l.closest("form");if(m){let s=p=>{p.preventDefault(),p.stopImmediatePropagation();let g=l.value.trim();g.length>=1&&e(g)};m.addEventListener("submit",s,!0),a.push(()=>m.removeEventListener("submit",s,!0))}let n=s=>{if(s.key==="Enter"){s.preventDefault(),s.stopImmediatePropagation();let p=l.value.trim();p.length>=1&&e(p)}};l.addEventListener("keydown",n,!0),a.push(()=>l.removeEventListener("keydown",n,!0))}let c=document.querySelector(r);if(c)return d(c),()=>a.forEach(l=>l());t=new MutationObserver(l=>{for(let m of l)for(let n of Array.from(m.addedNodes)){if(!(n instanceof HTMLElement))continue;let s=n.matches(r)?n:n.querySelector(r);if(s){d(s),t?.disconnect(),t=null,o&&clearTimeout(o),o=null;return}}}),t.observe(document.body,{childList:!0,subtree:!0});let u=i??1e4;return o=setTimeout(()=>{t?.disconnect(),t=null,console.warn(`[xtal.js] Could not find input matching "${r}" after ${u/1e3}s`)},u),()=>{a.forEach(l=>l()),t?.disconnect(),t=null,o&&clearTimeout(o)}}function ie(r){return typeof r=="string"&&r.includes("/")?r.split("/").pop():r}var I=class{constructor(){this.name="shopify"}async addToCart(e,i=1){let t=e.variants?.[0]?.id;if(!t)return{success:!1,message:"No variant available"};if(!e.available)return{success:!1,message:"Product unavailable"};let o=ie(t);try{let a=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o,quantity:i})});return a.ok?{success:!0,message:"Added to cart"}:a.status===422?{success:!1,message:(await a.json().catch(()=>({}))).description||"Could not add to cart"}:{success:!1,message:`Cart error (${a.status})`}}catch(a){return{success:!1,message:a instanceof Error?a.message:"Network error"}}}};var R=class{constructor(e,i){this.name="fallback";this.shopId=e,this.queryFn=i}async addToCart(e){let i=k(e.product_url||"#",{shopId:this.shopId,productId:e.id,query:this.queryFn()});return window.open(i,"_blank","noopener,noreferrer"),{success:!0,message:"Opening product page..."}}};function W(r,e){return window.Shopify?new I:new R(r,e)}function O(r,e,i,t){try{let o=`${r}/api/xtal/events`,a=JSON.stringify({action:"error",collection:e,error:i,context:t,ts:Date.now()});navigator.sendBeacon?.(o,a)||fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:a,keepalive:!0}).catch(()=>{})}catch{}}function oe(){if(document.getElementById("xtal-filter-styles"))return;let r=document.createElement("style");r.id="xtal-filter-styles",r.textContent=`
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
`,document.head.appendChild(r)}function J(){try{let r=document.querySelector("script[data-shop-id]");if(!r){console.warn("[xtal.js] No <script data-shop-id> tag found");return}let e=r.getAttribute("data-shop-id")??"";if(!e){console.warn("[xtal.js] data-shop-id is empty");return}let i="",t=r.getAttribute("src");if(t)try{i=new URL(t,window.location.href).origin}catch{i=window.location.origin}else i=window.location.origin;let o=new P(i,e);o.fetchConfig().then(a=>{if(!a.enabled){console.log(`[xtal.js] Snippet disabled for ${e}`);return}let d=a.cardTemplate??null;if(d?.css){let s=document.getElementById("xtal-card-styles");s&&s.remove();let p=document.createElement("style");p.id="xtal-card-styles",p.textContent=d.css,document.head.appendChild(p)}let c="",u=W(e,()=>c);console.log(`[xtal.js] Cart adapter: ${u.name}`);function l(s){if(a.productUrlPattern){let g=s.variants?.[0]?.sku||"";if(g)return a.productUrlPattern.replace("{sku}",encodeURIComponent(g)).replace("{id}",s.id||"")}let p=s.product_url||"#";return!p||p==="#"?"#":p.startsWith("http://")||p.startsWith("https://")?p:a.siteUrl?a.siteUrl.replace(/\/$/,"")+p:p}let m=a.displayMode==="inline"&&!!a.resultsSelector,n=m?document.querySelector(a.resultsSelector):null;if(m&&!n){console.log(`[xtal.js] Inline mode: "${a.resultsSelector}" not found \u2014 standing by`);return}{let s=new $(n),p=null,g=a.features?.filters===!0,b=null,f={},v=null,E=null,S=0,y={},C=null;g&&(oe(),s.initLayout());let M=()=>{if(E||!g)return;let x=s.initLayout();E=new A(x,(h,D)=>{f[h]||(f[h]=[]);let U=f[h].indexOf(D);U>=0?(f[h].splice(U,1),f[h].length===0&&delete f[h]):f[h].push(D),w()},h=>{v=h,w()},()=>{f={},v=null,w()},a.pricePresets)},_={onViewProduct(x){let h=k(l(x),{shopId:e,productId:x.id,query:c});window.open(h,"_blank","noopener,noreferrer")},async onAddToCart(x){let h=await u.addToCart(x);console.log(`[xtal.js] Add to cart: ${h.success?"OK":"FAIL"} \u2014 ${h.message}`),h.success&&fetch(`${i}/api/xtal/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:x.id,action:"add_to_cart",collection:e,query:c})}).catch(()=>{})}},T=x=>x.map(h=>d?F(d.html,h,c,e,_,u.name,l(h)):X(h,c,e,null,_)),w=()=>{b&&(C&&clearTimeout(C),C=setTimeout(()=>{s.showLoading(c),o.searchFiltered(c,b,{facetFilters:f,priceRange:v,limit:24}).then(x=>{S=x.total,y=x.computed_facets||{},x.results.length===0?s.renderEmpty(c):s.renderCards(T(x.results)),E?.update(y,f,v,S)}).catch(x=>{x instanceof DOMException&&x.name==="AbortError"||(console.error("[xtal.js] Filter error:",x),O(i,e,String(x),"filter"))})},150))},H=x=>{c=x,b=null,f={},v=null,E?.closeDrawer(),E?.resetState(),s.showLoading(x),o.searchFull(x,24).then(h=>{if(S=h.total,y=h.computed_facets||{},b=h.search_context||null,M(),h.results.length===0){s.renderEmpty(x),E?.update({},{},null,0);return}s.renderCards(T(h.results)),E?.update(y,f,v,S)}).catch(h=>{h instanceof DOMException&&h.name==="AbortError"||(console.error("[xtal.js] Search error:",h),O(i,e,String(h),"search"),s.restore(),a.siteUrl&&c&&(window.location.href=`${a.siteUrl.replace(/\/$/,"")}/shop/?Search=${encodeURIComponent(c)}`))})},L=null,K=x=>{L&&clearTimeout(L),L=setTimeout(()=>H(x),200)},j=a.searchSelector||'input[type="search"]';p=V(j,K,a.observerTimeoutMs);let z=document.querySelector(j);z?.value?.trim()&&H(z.value.trim()),window.XTAL={destroy(){L&&clearTimeout(L),C&&clearTimeout(C),o.abort(),p?.(),E?.destroy(),s.destroy();let x=document.getElementById("xtal-card-styles");x&&x.remove();let h=document.getElementById("xtal-filter-styles");h&&h.remove(),window.XTAL=void 0}},console.log(`[xtal.js] Initialized INLINE for ${e}. Search: ${j}, Grid: ${a.resultsSelector}${g?", Filters: ON":""}`)}}).catch(a=>{console.error("[xtal.js] Failed to fetch config:",a),O(i,e,String(a),"config")})}catch(r){console.error("[xtal.js] Boot error:",r)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",J):J();})();
