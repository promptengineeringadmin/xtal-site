"use strict";var XTAL=(()=>{var $=class{constructor(e,r){this.controller=null;this.apiBase=e,this.shopId=r}abort(){this.controller&&(this.controller.abort(),this.controller=null)}async fetchConfig(){let e=new AbortController,r=setTimeout(()=>e.abort(),5e3);try{let t=await fetch(`${this.apiBase}/api/xtal/config?shopId=${encodeURIComponent(this.shopId)}`,{mode:"cors",signal:e.signal});if(!t.ok)throw new Error(`Config fetch failed: ${t.status}`);return t.json()}finally{clearTimeout(r)}}async searchFull(e,r=16,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=await fetch(`${this.apiBase}/api/xtal/search-full`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,limit:r,selected_aspects:t}),signal:this.controller.signal});if(!o.ok)throw new Error(`Search failed: ${o.status}`);return o.json()}async searchFiltered(e,r,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=t?.facetFilters&&Object.values(t.facetFilters).some(c=>c.length>0),a=t?.priceRange?{min:t.priceRange.min,max:t.priceRange.max}:void 0,p=await fetch(`${this.apiBase}/api/xtal/search`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,search_context:r,limit:t?.limit??24,...o?{facet_filters:t.facetFilters}:{},...a?{price_range:a}:{}}),signal:this.controller.signal});if(!p.ok)throw new Error(`Filter search failed: ${p.status}`);return p.json()}};var A=class{constructor(e){this.originalHTML=null;this.layoutEl=null;this.railSlot=null;this.gridSlot=null;this.target=e}captureOriginal(){this.originalHTML===null&&(this.originalHTML=this.target.innerHTML)}initLayout(){return this.layoutEl?this.railSlot:(this.captureOriginal(),this.target.innerHTML="",this.layoutEl=document.createElement("div"),this.layoutEl.className="xtal-layout",this.railSlot=document.createElement("div"),this.railSlot.className="xtal-rail-slot",this.gridSlot=document.createElement("div"),this.gridSlot.className="xtal-grid-slot",this.layoutEl.appendChild(this.railSlot),this.layoutEl.appendChild(this.gridSlot),this.target.appendChild(this.layoutEl),this.railSlot)}showLoading(){this.captureOriginal();let e=this.gridSlot||this.target;e.innerHTML="";let r=document.createElement("div");r.style.cssText="display:flex;align-items:center;justify-content:center;padding:60px 20px;gap:8px;color:#888;font-size:14px;";let t=document.createElement("div");t.style.cssText="width:16px;height:16px;border:2px solid #ccc;border-top-color:#555;border-radius:50%;animation:xtal-inline-spin .6s linear infinite;";let o=document.createElement("span");if(o.textContent="Searching...",r.appendChild(t),r.appendChild(o),!document.getElementById("xtal-inline-keyframes")){let a=document.createElement("style");a.id="xtal-inline-keyframes",a.textContent="@keyframes xtal-inline-spin{to{transform:rotate(360deg)}}",document.head.appendChild(a)}e.appendChild(r)}renderCards(e){let r=this.gridSlot||this.target;r.innerHTML="";let t=document.createElement("div");t.className="xtal-grid";for(let o of e)t.appendChild(o);r.appendChild(t)}renderEmpty(e){let r=this.gridSlot||this.target;r.innerHTML="";let t=document.createElement("div");t.style.cssText="text-align:center;padding:60px 20px;color:#888;font-size:14px;",t.textContent=`No results found for "${e}"`,r.appendChild(t)}restore(){this.layoutEl=null,this.railSlot=null,this.gridSlot=null,this.originalHTML!==null&&(this.target.innerHTML=this.originalHTML,this.originalHTML=null)}destroy(){this.restore();let e=document.getElementById("xtal-inline-keyframes");e&&e.remove()}};var G={"product-subcategory":"Category",brand:"Brand",vendor:"Vendor","product-age":"Age",proof:"Proof",region:"Region",size:"Size",terpene:"Terpene",effect:"Effect","strain-type":"Strain Type",format:"Format",material:"Material",shape:"Shape","use-case":"Use Case",feature:"Feature",design:"Design",style:"Style",color:"Color"},Z=["product-subcategory","brand","vendor","strain-type","terpene","effect","format","material","use-case","style"],H=5,Y=[{label:"Under $25",max:25},{label:"$25\u2013$50",min:25,max:50},{label:"$50\u2013$100",min:50,max:100},{label:"$100\u2013$200",min:100,max:200},{label:"$200+",min:200}];function B(n){return n.split(/[-_]/).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function Q(n){return G[n]||n.split("-").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function q(n,e){return n?n.min===e.min&&n.max===e.max:!1}var F=class{constructor(e,r,t,o,a){this.expandedSections=new Set(["price"].concat(Z));this.showMore={};this.drawerOpen=!1;this.savedBodyOverflow="";this.container=e,this.onFacetToggle=r,this.onPriceChange=t,this.onClearAll=o,this.pricePresets=a||Y,this.railEl=document.createElement("aside"),this.railEl.className="xtal-filter-rail",e.appendChild(this.railEl),this.fabEl=document.createElement("button"),this.fabEl.className="xtal-filter-fab",this.fabEl.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg><span class="xtal-fab-text">Filters</span>',this.fabEl.addEventListener("click",()=>this.openDrawer()),document.body.appendChild(this.fabEl),this.backdropEl=document.createElement("div"),this.backdropEl.className="xtal-backdrop",this.backdropEl.addEventListener("click",()=>this.closeDrawer()),document.body.appendChild(this.backdropEl),this.drawerEl=document.createElement("div"),this.drawerEl.className="xtal-filter-drawer";let p=document.createElement("div");p.className="xtal-drawer-header",p.innerHTML='<span class="xtal-drawer-title">Filters</span>';let c=document.createElement("button");c.className="xtal-drawer-close",c.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',c.setAttribute("aria-label","Close filters"),c.addEventListener("click",()=>this.closeDrawer()),p.appendChild(c),this.drawerEl.appendChild(p),this.drawerContentEl=document.createElement("div"),this.drawerContentEl.className="xtal-drawer-content",this.drawerEl.appendChild(this.drawerContentEl);let u=document.createElement("div");u.className="xtal-drawer-footer",this.drawerFooterBtn=document.createElement("button"),this.drawerFooterBtn.className="xtal-drawer-apply",this.drawerFooterBtn.textContent="Show results",this.drawerFooterBtn.addEventListener("click",()=>this.closeDrawer()),u.appendChild(this.drawerFooterBtn),this.drawerEl.appendChild(u),document.body.appendChild(this.drawerEl)}update(e,r,t,o){let a=e&&Object.keys(e).length>0,p=Object.values(r).some(i=>i.length>0)||t!==null;if(this.railEl.style.display=!a&&!p?"none":"",this.fabEl.style.display="",!a&&!p){this.fabEl.classList.add("xtal-fab-hidden");return}else this.fabEl.classList.remove("xtal-fab-hidden");this.railEl.innerHTML="",this.drawerContentEl.innerHTML="";let c=this.buildFilterSections(e,r,t,"desktop"),u=this.buildFilterSections(e,r,t,"mobile");this.railEl.appendChild(c),this.drawerContentEl.appendChild(u);let d=Object.values(r).reduce((i,s)=>i+s.length,0)+(t?1:0),l=this.fabEl.querySelector(".xtal-fab-badge");if(l&&l.remove(),d>0){let i=document.createElement("span");i.className="xtal-fab-badge",i.textContent=String(d),this.fabEl.appendChild(i)}this.drawerFooterBtn.textContent=`Show ${o} result${o!==1?"s":""}`}buildFilterSections(e,r,t,o){let a=document.createDocumentFragment();if(Object.values(r).some(d=>d.length>0)||t!==null){let d=document.createElement("div");d.className="xtal-applied-section";let l=document.createElement("div");l.className="xtal-clear-row";let i=document.createElement("button");i.className="xtal-clear-all",i.textContent="Clear all",i.addEventListener("click",()=>this.onClearAll()),l.appendChild(i),d.appendChild(l);let s=document.createElement("div");s.className="xtal-applied-chips";for(let[m,g]of Object.entries(r))for(let b of g){let f=document.createElement("button");f.className="xtal-chip",f.innerHTML=`${B(b)} <span class="xtal-chip-x">\xD7</span>`,f.addEventListener("click",()=>this.onFacetToggle(m,b)),s.appendChild(f)}if(t){let m=document.createElement("button");m.className="xtal-chip";let g=t.min&&t.max?`$${t.min}\u2013$${t.max}`:t.max?`Under $${t.max}`:`$${t.min}+`;m.innerHTML=`${g} <span class="xtal-chip-x">\xD7</span>`,m.addEventListener("click",()=>this.onPriceChange(null)),s.appendChild(m)}d.appendChild(s),a.appendChild(d)}let c=this.buildCollapsibleSection("price","Price",0,t!==null,o,()=>{let d=document.createElement("div");d.className="xtal-price-presets";for(let l of this.pricePresets){let i=document.createElement("button");i.className="xtal-price-btn",q(t,l)&&i.classList.add("xtal-price-btn-active"),i.textContent=l.label,i.addEventListener("click",()=>{q(t,l)?this.onPriceChange(null):this.onPriceChange({min:l.min,max:l.max})}),d.appendChild(i)}return d});a.appendChild(c);let u=Object.entries(e);for(let[d,l]of u){let i=r[d]||[],s=i.length,m=this.buildCollapsibleSection(d,Q(d),s,s>0,o,()=>{let g=document.createElement("div");g.className="xtal-facet-list";let b=Object.entries(l).sort((y,C)=>C[1]-y[1]),f=`${o}-${d}`,v=this.showMore[f],E=v||b.length<=H?b:b.slice(0,H),k=b.length-H;for(let[y,C]of E){let M=i.includes(y),_=C===0&&!M,T=document.createElement("label");T.className="xtal-facet-label",_&&T.classList.add("xtal-facet-disabled");let w=document.createElement("input");w.type="checkbox",w.className="xtal-facet-checkbox",w.checked=M,_&&(w.disabled=!0),w.addEventListener("change",()=>this.onFacetToggle(d,y));let N=document.createElement("span");N.className="xtal-facet-text",N.textContent=B(y);let L=document.createElement("span");L.className="xtal-facet-count",L.textContent=String(C),T.appendChild(w),T.appendChild(N),T.appendChild(L),g.appendChild(T)}if(k>0){let y=document.createElement("button");y.className="xtal-show-more",y.textContent=v?"Show less":`Show ${k} more`,y.addEventListener("click",()=>{this.showMore[f]=!this.showMore[f];let C=y.parentElement;if(!C)return;let M=this.buildFacetList(d,l,i,o);C.replaceWith(M)}),g.appendChild(y)}return g});a.appendChild(m)}return a}buildFacetList(e,r,t,o){let a=document.createElement("div");a.className="xtal-facet-list";let p=`${o}-${e}`,c=Object.entries(r).sort((i,s)=>s[1]-i[1]),u=this.showMore[p],d=u||c.length<=H?c:c.slice(0,H),l=c.length-H;for(let[i,s]of d){let m=t.includes(i),g=s===0&&!m,b=document.createElement("label");b.className="xtal-facet-label",g&&b.classList.add("xtal-facet-disabled");let f=document.createElement("input");f.type="checkbox",f.className="xtal-facet-checkbox",f.checked=m,g&&(f.disabled=!0),f.addEventListener("change",()=>this.onFacetToggle(e,i));let v=document.createElement("span");v.className="xtal-facet-text",v.textContent=B(i);let E=document.createElement("span");E.className="xtal-facet-count",E.textContent=String(s),b.appendChild(f),b.appendChild(v),b.appendChild(E),a.appendChild(b)}if(l>0){let i=document.createElement("button");i.className="xtal-show-more",i.textContent=u?"Show less":`Show ${l} more`,i.addEventListener("click",()=>{this.showMore[p]=!this.showMore[p];let s=this.buildFacetList(e,r,t,o);a.replaceWith(s)}),a.appendChild(i)}return a}buildCollapsibleSection(e,r,t,o,a,p){let c=document.createElement("div");c.className="xtal-filter-section";let u=o||this.expandedSections.has(e),d=document.createElement("button");d.className="xtal-section-header";let l=document.createElement("span");if(l.className="xtal-section-label",l.textContent=r,t>0){let m=document.createElement("span");m.className="xtal-section-badge",m.textContent=String(t),l.appendChild(m)}let i=document.createElement("span");i.className="xtal-section-chevron",i.textContent=u?"\u25BE":"\u25B8",d.appendChild(l),d.appendChild(i),d.addEventListener("click",()=>{this.expandedSections.has(e)?this.expandedSections.delete(e):this.expandedSections.add(e);let m=c.querySelector(".xtal-section-content");m&&(m.style.display=m.style.display==="none"?"":"none",i.textContent=m.style.display==="none"?"\u25B8":"\u25BE")}),c.appendChild(d);let s=document.createElement("div");return s.className="xtal-section-content",u||(s.style.display="none"),s.appendChild(p()),c.appendChild(s),c}resetState(){this.showMore={}}openDrawer(){this.drawerOpen=!0,this.savedBodyOverflow=document.body.style.overflow,document.body.style.overflow="hidden",this.backdropEl.classList.add("xtal-backdrop-open"),this.drawerEl.classList.add("xtal-drawer-open")}closeDrawer(){this.drawerOpen=!1,document.body.style.overflow=this.savedBodyOverflow,this.backdropEl.classList.remove("xtal-backdrop-open"),this.drawerEl.classList.remove("xtal-drawer-open")}destroy(){this.drawerOpen&&this.closeDrawer(),this.railEl.remove(),this.fabEl.remove(),this.backdropEl.remove(),this.drawerEl.remove()}};function S(n,e){try{let r=new URL(n);return r.searchParams.set("utm_source","xtal"),r.searchParams.set("utm_medium","search"),r.searchParams.set("utm_campaign",e.shopId),r.searchParams.set("utm_content",e.productId),r.searchParams.set("utm_term",e.query),r.toString()}catch{return n}}function ee(n){let e=Array.isArray(n.price)?n.price[0]??0:n.price,r=n.variants?.[0]?.compare_at_price,t={id:n.id??"",title:n.title??"",vendor:n.vendor??"",product_type:n.product_type??"",price:e.toFixed(2),image_url:n.image_url||n.featured_image||n.images?.[0]?.src||"",product_url:n.product_url??"",available:n.available?"true":"",description:n.description??""};r&&r>e&&(t.compare_at_price=r.toFixed(2));let o=n.variants?.[0];if(o&&(o.sku&&(t.sku=o.sku),o.title&&(t.variant_title=o.title)),n.tags?.length){t.tags=n.tags.join(", ");for(let a of n.tags){let p=a.indexOf(":");if(p>0){let c=a.slice(0,p).trim().toLowerCase().replace(/\s+/g,"_"),u=a.slice(p+1).trim();c&&u&&!(c in t)&&(t[c]=u)}}}return t}function te(n,e){let r=n.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,a)=>e[o]?a:"");return r=r.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,a)=>e[o]?"":a),r}function ne(n,e){return n.replace(/\{\{(\w+)\}\}/g,(r,t)=>e[t]??"")}function re(n){let e=document.createElement("div");return e.innerHTML=n.trim(),e.firstElementChild||e}function I(n,e,r,t,o,a){let p=ee(e),c=te(n,p);c=ne(c,p);let u=re(c),d=S(e.product_url||"#",{shopId:t,productId:e.id,query:r});return u.querySelectorAll('[data-xtal-action="view-product"]').forEach(l=>{l.tagName==="A"?(l.href=d,l.target="_blank",l.rel="noopener noreferrer"):(l.style.cursor="pointer",l.addEventListener("click",i=>{i.preventDefault(),o.onViewProduct(e)}))}),u.querySelectorAll('[data-xtal-action="add-to-cart"]').forEach(l=>{a==="fallback"&&(l.textContent="View Product"),l.addEventListener("click",async i=>{i.preventDefault(),i.stopPropagation();let s=l.textContent;l.textContent="Adding...",l.style.opacity="0.7",l.style.pointerEvents="none";try{await o.onAddToCart(e)}finally{l.textContent=s,l.style.opacity="",l.style.pointerEvents=""}})}),u}function ae(n){if(Array.isArray(n)){let e=[...n].sort((r,t)=>r-t);return e.length===0?"N/A":e.length===1||e[0]===e[e.length-1]?`$${e[0].toFixed(2)}`:`$${e[0].toFixed(2)} \u2013 $${e[e.length-1].toFixed(2)}`}return`$${n.toFixed(2)}`}function X(n,e,r,t,o){if(t&&o)return I(t.html,n,e,r,o);let a=n.image_url||n.featured_image||n.images&&n.images[0]?.src,p=document.createElement("a");p.className="xtal-card",p.href=S(n.product_url||"#",{shopId:r,productId:n.id,query:e}),p.target="_blank",p.rel="noopener noreferrer";let c=document.createElement("div");if(c.className="xtal-card-image",a){let i=document.createElement("img");i.src=a,i.alt=n.title,i.loading="lazy",c.appendChild(i)}else{let i=document.createElement("span");i.className="xtal-card-image-placeholder",i.textContent="No image",c.appendChild(i)}p.appendChild(c);let u=document.createElement("div");if(u.className="xtal-card-body",n.vendor){let i=document.createElement("div");i.className="xtal-card-vendor",i.textContent=n.vendor,u.appendChild(i)}let d=document.createElement("div");d.className="xtal-card-title",d.textContent=n.title,u.appendChild(d);let l=document.createElement("div");return l.className="xtal-card-price",l.textContent=ae(n.price),u.appendChild(l),p.appendChild(u),p}function V(n,e,r){let t=null,o=null,a=[];function p(d){let l=d.closest("form");if(l){let s=m=>{m.preventDefault(),m.stopImmediatePropagation();let g=d.value.trim();g.length>=1&&e(g)};l.addEventListener("submit",s,!0),a.push(()=>l.removeEventListener("submit",s,!0))}let i=s=>{if(s.key==="Enter"){s.preventDefault(),s.stopImmediatePropagation();let m=d.value.trim();m.length>=1&&e(m)}};d.addEventListener("keydown",i,!0),a.push(()=>d.removeEventListener("keydown",i,!0))}let c=document.querySelector(n);if(c)return p(c),()=>a.forEach(d=>d());t=new MutationObserver(d=>{for(let l of d)for(let i of Array.from(l.addedNodes)){if(!(i instanceof HTMLElement))continue;let s=i.matches(n)?i:i.querySelector(n);if(s){p(s),t?.disconnect(),t=null,o&&clearTimeout(o),o=null;return}}}),t.observe(document.body,{childList:!0,subtree:!0});let u=r??1e4;return o=setTimeout(()=>{t?.disconnect(),t=null,console.warn(`[xtal.js] Could not find input matching "${n}" after ${u/1e3}s`)},u),()=>{a.forEach(d=>d()),t?.disconnect(),t=null,o&&clearTimeout(o)}}function ie(n){return typeof n=="string"&&n.includes("/")?n.split("/").pop():n}var P=class{constructor(){this.name="shopify"}async addToCart(e,r=1){let t=e.variants?.[0]?.id;if(!t)return{success:!1,message:"No variant available"};if(!e.available)return{success:!1,message:"Product unavailable"};let o=ie(t);try{let a=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o,quantity:r})});return a.ok?{success:!0,message:"Added to cart"}:a.status===422?{success:!1,message:(await a.json().catch(()=>({}))).description||"Could not add to cart"}:{success:!1,message:`Cart error (${a.status})`}}catch(a){return{success:!1,message:a instanceof Error?a.message:"Network error"}}}};var R=class{constructor(e,r){this.name="fallback";this.shopId=e,this.queryFn=r}async addToCart(e){let r=S(e.product_url||"#",{shopId:this.shopId,productId:e.id,query:this.queryFn()});return window.open(r,"_blank","noopener,noreferrer"),{success:!0,message:"Opening product page..."}}};function W(n,e){return window.Shopify?new P:new R(n,e)}function O(n,e,r,t){try{let o=`${n}/api/xtal/events`,a=JSON.stringify({action:"error",collection:e,error:r,context:t,ts:Date.now()});navigator.sendBeacon?.(o,a)||fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:a,keepalive:!0}).catch(()=>{})}catch{}}function oe(){if(document.getElementById("xtal-filter-styles"))return;let n=document.createElement("style");n.id="xtal-filter-styles",n.textContent=`
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
  cursor: pointer; font-size: 13px; color: #444;
}
.xtal-facet-label:hover { color: #1d1d1b; }
.xtal-facet-disabled { opacity: 0.4; pointer-events: none; }
.xtal-facet-checkbox {
  width: 14px; height: 14px; border-radius: 3px;
  accent-color: #1d1d1b; cursor: pointer; flex-shrink: 0;
}
.xtal-facet-text { flex: 1; }
.xtal-facet-count { font-size: 11px; color: #999; }
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
  display: none; position: fixed; bottom: 24px; left: 50%;
  transform: translateX(-50%); z-index: 9990;
  align-items: center; gap: 8px; padding: 12px 20px; border-radius: 9999px;
  background: #1d1d1b; color: #fff; border: none; cursor: pointer;
  font-family: "Manrope", serif; font-size: 14px; font-weight: 600;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
}
.xtal-filter-fab:hover { transform: translateX(-50%) scale(1.05); }
.xtal-fab-text { margin: 0; }
.xtal-fab-badge {
  display: flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 50%;
  background: #fff; color: #1d1d1b; font-size: 11px; font-weight: 700;
}
.xtal-fab-hidden { display: none !important; }

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
  .xtal-filter-fab { display: flex; }
  .xtal-backdrop { display: block; }
  .xtal-filter-drawer { display: flex; }
}
`,document.head.appendChild(n)}function J(){try{let n=document.querySelector("script[data-shop-id]");if(!n){console.warn("[xtal.js] No <script data-shop-id> tag found");return}let e=n.getAttribute("data-shop-id")??"";if(!e){console.warn("[xtal.js] data-shop-id is empty");return}let r="",t=n.getAttribute("src");if(t)try{r=new URL(t,window.location.href).origin}catch{r=window.location.origin}else r=window.location.origin;let o=new $(r,e);o.fetchConfig().then(a=>{if(!a.enabled){console.log(`[xtal.js] Snippet disabled for ${e}`);return}let p=a.cardTemplate??null;if(p?.css){let s=document.getElementById("xtal-card-styles");s&&s.remove();let m=document.createElement("style");m.id="xtal-card-styles",m.textContent=p.css,document.head.appendChild(m)}let c="",u=W(e,()=>c);console.log(`[xtal.js] Cart adapter: ${u.name}`);function d(s){if(a.productUrlPattern){let g=s.variants?.[0]?.sku||"";if(g)return a.productUrlPattern.replace("{sku}",encodeURIComponent(g)).replace("{id}",s.id||"")}let m=s.product_url||"#";return!m||m==="#"?"#":m.startsWith("http://")||m.startsWith("https://")?m:a.siteUrl?a.siteUrl.replace(/\/$/,"")+m:m}let l=a.displayMode==="inline"&&!!a.resultsSelector,i=l?document.querySelector(a.resultsSelector):null;if(l&&!i){console.log(`[xtal.js] Inline mode: "${a.resultsSelector}" not found \u2014 standing by`);return}{let s=new A(i),m=null,g=a.features?.filters===!0,b=null,f={},v=null,E=null,k=0,y={},C=null;g&&(oe(),s.initLayout());let M=()=>{if(E||!g)return;let x=s.initLayout();E=new F(x,(h,z)=>{f[h]||(f[h]=[]);let D=f[h].indexOf(z);D>=0?(f[h].splice(D,1),f[h].length===0&&delete f[h]):f[h].push(z),w()},h=>{v=h,w()},()=>{f={},v=null,w()},a.pricePresets)},_={onViewProduct(x){let h=S(d(x),{shopId:e,productId:x.id,query:c});window.open(h,"_blank","noopener,noreferrer")},async onAddToCart(x){let h=await u.addToCart(x);console.log(`[xtal.js] Add to cart: ${h.success?"OK":"FAIL"} \u2014 ${h.message}`),h.success&&fetch(`${r}/api/xtal/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:x.id,action:"add_to_cart",collection:e,query:c})}).catch(()=>{})}},T=x=>x.map(h=>p?I(p.html,h,c,e,_,u.name):X(h,c,e,null,_)),w=()=>{b&&(C&&clearTimeout(C),C=setTimeout(()=>{s.showLoading(),o.searchFiltered(c,b,{facetFilters:f,priceRange:v,limit:24}).then(x=>{k=x.total,y=x.computed_facets||{},x.results.length===0?s.renderEmpty(c):s.renderCards(T(x.results)),E?.update(y,f,v,k)}).catch(x=>{x instanceof DOMException&&x.name==="AbortError"||(console.error("[xtal.js] Filter error:",x),O(r,e,String(x),"filter"))})},150))},N=x=>{c=x,b=null,f={},v=null,E?.closeDrawer(),E?.resetState(),s.showLoading(),o.searchFull(x,24).then(h=>{if(k=h.total,y=h.computed_facets||{},b=h.search_context||null,M(),h.results.length===0){s.renderEmpty(x),E?.update({},{},null,0);return}s.renderCards(T(h.results)),E?.update(y,f,v,k)}).catch(h=>{h instanceof DOMException&&h.name==="AbortError"||(console.error("[xtal.js] Search error:",h),O(r,e,String(h),"search"),s.restore(),a.siteUrl&&c&&(window.location.href=`${a.siteUrl.replace(/\/$/,"")}/shop/?Search=${encodeURIComponent(c)}`))})},L=null,K=x=>{L&&clearTimeout(L),L=setTimeout(()=>N(x),200)},j=a.searchSelector||'input[type="search"]';m=V(j,K,a.observerTimeoutMs);let U=document.querySelector(j);U?.value?.trim()&&N(U.value.trim()),window.XTAL={destroy(){L&&clearTimeout(L),C&&clearTimeout(C),o.abort(),m?.(),E?.destroy(),s.destroy();let x=document.getElementById("xtal-card-styles");x&&x.remove();let h=document.getElementById("xtal-filter-styles");h&&h.remove(),window.XTAL=void 0}},console.log(`[xtal.js] Initialized INLINE for ${e}. Search: ${j}, Grid: ${a.resultsSelector}${g?", Filters: ON":""}`)}}).catch(a=>{console.error("[xtal.js] Failed to fetch config:",a),O(r,e,String(a),"config")})}catch(n){console.error("[xtal.js] Boot error:",n)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",J):J();})();
