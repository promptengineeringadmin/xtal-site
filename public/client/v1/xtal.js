"use strict";var XTAL=(()=>{var F=class{constructor(e,n){this.controller=null;this.apiBase=e,this.shopId=n}async fetchConfig(){let e=await fetch(`${this.apiBase}/api/xtal/config?shopId=${encodeURIComponent(this.shopId)}`,{mode:"cors"});if(!e.ok)throw new Error(`Config fetch failed: ${e.status}`);return e.json()}async searchFull(e,n=16,r){this.controller&&this.controller.abort(),this.controller=new AbortController;let s=await fetch(`${this.apiBase}/api/xtal/search-full`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,limit:n,selected_aspects:r}),signal:this.controller.signal});if(!s.ok)throw new Error(`Search failed: ${s.status}`);return s.json()}async searchFiltered(e,n,r){this.controller&&this.controller.abort(),this.controller=new AbortController;let s=r?.facetFilters&&Object.values(r.facetFilters).some(l=>l.length>0),a=r?.priceRange?{min:r.priceRange.min,max:r.priceRange.max}:void 0,p=await fetch(`${this.apiBase}/api/xtal/search`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,search_context:n,limit:r?.limit??24,...s?{facet_filters:r.facetFilters}:{},...a?{price_range:a}:{}}),signal:this.controller.signal});if(!p.ok)throw new Error(`Filter search failed: ${p.status}`);return p.json()}};var R=class{constructor(e){this.layoutEl=null;this.railSlot=null;this.gridSlot=null;this.target=e,this.originalHTML=e.innerHTML}initLayout(){return this.layoutEl?this.railSlot:(this.target.innerHTML="",this.layoutEl=document.createElement("div"),this.layoutEl.className="xtal-layout",this.railSlot=document.createElement("div"),this.railSlot.className="xtal-rail-slot",this.gridSlot=document.createElement("div"),this.gridSlot.className="xtal-grid-slot",this.layoutEl.appendChild(this.railSlot),this.layoutEl.appendChild(this.gridSlot),this.target.appendChild(this.layoutEl),this.railSlot)}showLoading(){let e=this.gridSlot||this.target;e.innerHTML="";let n=document.createElement("div");n.style.cssText="display:flex;align-items:center;justify-content:center;padding:60px 20px;gap:8px;color:#888;font-size:14px;";let r=document.createElement("div");r.style.cssText="width:16px;height:16px;border:2px solid #ccc;border-top-color:#555;border-radius:50%;animation:xtal-inline-spin .6s linear infinite;";let s=document.createElement("span");if(s.textContent="Searching...",n.appendChild(r),n.appendChild(s),!document.getElementById("xtal-inline-keyframes")){let a=document.createElement("style");a.id="xtal-inline-keyframes",a.textContent="@keyframes xtal-inline-spin{to{transform:rotate(360deg)}}",document.head.appendChild(a)}e.appendChild(n)}renderCards(e){let n=this.gridSlot||this.target;n.innerHTML="";let r=document.createElement("div");r.className="xtal-grid";for(let s of e)r.appendChild(s);n.appendChild(r)}renderEmpty(e){let n=this.gridSlot||this.target;n.innerHTML="";let r=document.createElement("div");r.style.cssText="text-align:center;padding:60px 20px;color:#888;font-size:14px;",r.textContent=`No results found for "${e}"`,n.appendChild(r)}restore(){this.layoutEl=null,this.railSlot=null,this.gridSlot=null,this.target.innerHTML=this.originalHTML}destroy(){this.restore();let e=document.getElementById("xtal-inline-keyframes");e&&e.remove()}};var Z={"product-subcategory":"Category",brand:"Brand",vendor:"Vendor","product-age":"Age",proof:"Proof",region:"Region",size:"Size",terpene:"Terpene",effect:"Effect","strain-type":"Strain Type",format:"Format",material:"Material",shape:"Shape","use-case":"Use Case",feature:"Feature",design:"Design",style:"Style",color:"Color"},Y=["product-subcategory","brand","vendor","strain-type","terpene","effect","format","material","use-case","style"],H=5,Q=[{label:"Under $25",max:25},{label:"$25\u2013$50",min:25,max:50},{label:"$50\u2013$100",min:50,max:100},{label:"$100\u2013$200",min:100,max:200},{label:"$200+",min:200}];function U(t){return t.split(/[-_]/).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function ee(t){return Z[t]||t.split("-").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function X(t,e){return t?t.min===e.min&&t.max===e.max:!1}var A=class{constructor(e,n,r,s){this.expandedSections=new Set(["price"].concat(Y));this.showMore={};this.drawerOpen=!1;this.savedBodyOverflow="";this.container=e,this.onFacetToggle=n,this.onPriceChange=r,this.onClearAll=s,this.railEl=document.createElement("aside"),this.railEl.className="xtal-filter-rail",e.appendChild(this.railEl),this.fabEl=document.createElement("button"),this.fabEl.className="xtal-filter-fab",this.fabEl.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg><span class="xtal-fab-text">Filters</span>',this.fabEl.addEventListener("click",()=>this.openDrawer()),document.body.appendChild(this.fabEl),this.backdropEl=document.createElement("div"),this.backdropEl.className="xtal-backdrop",this.backdropEl.addEventListener("click",()=>this.closeDrawer()),document.body.appendChild(this.backdropEl),this.drawerEl=document.createElement("div"),this.drawerEl.className="xtal-filter-drawer";let a=document.createElement("div");a.className="xtal-drawer-header",a.innerHTML='<span class="xtal-drawer-title">Filters</span>';let p=document.createElement("button");p.className="xtal-drawer-close",p.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',p.setAttribute("aria-label","Close filters"),p.addEventListener("click",()=>this.closeDrawer()),a.appendChild(p),this.drawerEl.appendChild(a),this.drawerContentEl=document.createElement("div"),this.drawerContentEl.className="xtal-drawer-content",this.drawerEl.appendChild(this.drawerContentEl);let l=document.createElement("div");l.className="xtal-drawer-footer",this.drawerFooterBtn=document.createElement("button"),this.drawerFooterBtn.className="xtal-drawer-apply",this.drawerFooterBtn.textContent="See results",this.drawerFooterBtn.addEventListener("click",()=>this.closeDrawer()),l.appendChild(this.drawerFooterBtn),this.drawerEl.appendChild(l),document.body.appendChild(this.drawerEl)}update(e,n,r,s){let a=e&&Object.keys(e).length>0,p=Object.values(n).some(o=>o.length>0)||r!==null;if(this.railEl.style.display=!a&&!p?"none":"",this.fabEl.style.display="",!a&&!p){this.fabEl.classList.add("xtal-fab-hidden");return}else this.fabEl.classList.remove("xtal-fab-hidden");this.railEl.innerHTML="",this.drawerContentEl.innerHTML="";let l=this.buildFilterSections(e,n,r,"desktop"),f=this.buildFilterSections(e,n,r,"mobile");this.railEl.appendChild(l),this.drawerContentEl.appendChild(f);let c=Object.values(n).reduce((o,d)=>o+d.length,0)+(r?1:0),i=this.fabEl.querySelector(".xtal-fab-badge");if(i&&i.remove(),c>0){let o=document.createElement("span");o.className="xtal-fab-badge",o.textContent=String(c),this.fabEl.appendChild(o)}this.drawerFooterBtn.textContent=`See ${s} result${s!==1?"s":""}`}buildFilterSections(e,n,r,s){let a=document.createDocumentFragment();if(Object.values(n).some(c=>c.length>0)||r!==null){let c=document.createElement("div");c.className="xtal-applied-section";let i=document.createElement("div");i.className="xtal-clear-row";let o=document.createElement("button");o.className="xtal-clear-all",o.textContent="Clear all",o.addEventListener("click",()=>this.onClearAll()),i.appendChild(o),c.appendChild(i);let d=document.createElement("div");d.className="xtal-applied-chips";for(let[m,b]of Object.entries(n))for(let g of b){let u=document.createElement("button");u.className="xtal-chip",u.innerHTML=`${U(g)} <span class="xtal-chip-x">\xD7</span>`,u.addEventListener("click",()=>this.onFacetToggle(m,g)),d.appendChild(u)}if(r){let m=document.createElement("button");m.className="xtal-chip";let b=r.min&&r.max?`$${r.min}\u2013$${r.max}`:r.max?`Under $${r.max}`:`$${r.min}+`;m.innerHTML=`${b} <span class="xtal-chip-x">\xD7</span>`,m.addEventListener("click",()=>this.onPriceChange(null)),d.appendChild(m)}c.appendChild(d),a.appendChild(c)}let l=this.buildCollapsibleSection("price","Price",0,r!==null,s,()=>{let c=document.createElement("div");c.className="xtal-price-presets";for(let i of Q){let o=document.createElement("button");o.className="xtal-price-btn",X(r,i)&&o.classList.add("xtal-price-btn-active"),o.textContent=i.label,o.addEventListener("click",()=>{X(r,i)?this.onPriceChange(null):this.onPriceChange({min:i.min,max:i.max})}),c.appendChild(o)}return c});a.appendChild(l);let f=Object.entries(e);for(let[c,i]of f){let o=n[c]||[],d=o.length,m=this.buildCollapsibleSection(c,ee(c),d,d>0,s,()=>{let b=document.createElement("div");b.className="xtal-facet-list";let g=Object.entries(i).sort((y,T)=>T[1]-y[1]),u=`${s}-${c}`,E=this.showMore[u],C=E||g.length<=H?g:g.slice(0,H),k=g.length-H;for(let[y,T]of C){let M=o.includes(y),I=T===0&&!M,v=document.createElement("label");v.className="xtal-facet-label",I&&v.classList.add("xtal-facet-disabled");let L=document.createElement("input");L.type="checkbox",L.className="xtal-facet-checkbox",L.checked=M,L.addEventListener("change",()=>this.onFacetToggle(c,y));let N=document.createElement("span");N.className="xtal-facet-text",N.textContent=U(y);let _=document.createElement("span");_.className="xtal-facet-count",_.textContent=String(T),v.appendChild(L),v.appendChild(N),v.appendChild(_),b.appendChild(v)}if(k>0){let y=document.createElement("button");y.className="xtal-show-more",y.textContent=E?"Show less":`Show ${k} more`,y.addEventListener("click",()=>{this.showMore[u]=!this.showMore[u];let T=y.parentElement;if(!T)return;let M=this.buildFacetList(c,i,o,s);T.replaceWith(M)}),b.appendChild(y)}return b});a.appendChild(m)}return a}buildFacetList(e,n,r,s){let a=document.createElement("div");a.className="xtal-facet-list";let p=`${s}-${e}`,l=Object.entries(n).sort((o,d)=>d[1]-o[1]),f=this.showMore[p],c=f||l.length<=H?l:l.slice(0,H),i=l.length-H;for(let[o,d]of c){let m=r.includes(o),b=d===0&&!m,g=document.createElement("label");g.className="xtal-facet-label",b&&g.classList.add("xtal-facet-disabled");let u=document.createElement("input");u.type="checkbox",u.className="xtal-facet-checkbox",u.checked=m,u.addEventListener("change",()=>this.onFacetToggle(e,o));let E=document.createElement("span");E.className="xtal-facet-text",E.textContent=U(o);let C=document.createElement("span");C.className="xtal-facet-count",C.textContent=String(d),g.appendChild(u),g.appendChild(E),g.appendChild(C),a.appendChild(g)}if(i>0){let o=document.createElement("button");o.className="xtal-show-more",o.textContent=f?"Show less":`Show ${i} more`,o.addEventListener("click",()=>{this.showMore[p]=!this.showMore[p];let d=this.buildFacetList(e,n,r,s);a.replaceWith(d)}),a.appendChild(o)}return a}buildCollapsibleSection(e,n,r,s,a,p){let l=document.createElement("div");l.className="xtal-filter-section";let f=s||this.expandedSections.has(e),c=document.createElement("button");c.className="xtal-section-header";let i=document.createElement("span");if(i.className="xtal-section-label",i.textContent=n,r>0){let m=document.createElement("span");m.className="xtal-section-badge",m.textContent=String(r),i.appendChild(m)}let o=document.createElement("span");o.className="xtal-section-chevron",o.textContent=f?"\u25BE":"\u25B8",c.appendChild(i),c.appendChild(o),c.addEventListener("click",()=>{this.expandedSections.has(e)?this.expandedSections.delete(e):this.expandedSections.add(e);let m=l.querySelector(".xtal-section-content");m&&(m.style.display=m.style.display==="none"?"":"none",o.textContent=m.style.display==="none"?"\u25B8":"\u25BE")}),l.appendChild(c);let d=document.createElement("div");return d.className="xtal-section-content",f||(d.style.display="none"),d.appendChild(p()),l.appendChild(d),l}openDrawer(){this.drawerOpen=!0,this.savedBodyOverflow=document.body.style.overflow,document.body.style.overflow="hidden",this.backdropEl.classList.add("xtal-backdrop-open"),this.drawerEl.classList.add("xtal-drawer-open")}closeDrawer(){this.drawerOpen=!1,document.body.style.overflow=this.savedBodyOverflow,this.backdropEl.classList.remove("xtal-backdrop-open"),this.drawerEl.classList.remove("xtal-drawer-open")}destroy(){this.drawerOpen&&this.closeDrawer(),this.railEl.remove(),this.fabEl.remove(),this.backdropEl.remove(),this.drawerEl.remove()}};function S(t,e){try{let n=new URL(t);return n.searchParams.set("utm_source","xtal"),n.searchParams.set("utm_medium","search"),n.searchParams.set("utm_campaign",e.shopId),n.searchParams.set("utm_content",e.productId),n.searchParams.set("utm_term",e.query),n.toString()}catch{return t}}function te(t){let e=Array.isArray(t.price)?t.price[0]??0:t.price,n=t.variants?.[0]?.compare_at_price,r={id:t.id??"",title:t.title??"",vendor:t.vendor??"",product_type:t.product_type??"",price:e.toFixed(2),image_url:t.image_url||t.featured_image||t.images?.[0]?.src||"",product_url:t.product_url??"",available:t.available?"true":"",description:t.description??""};n&&n>e&&(r.compare_at_price=n.toFixed(2));let s=t.variants?.[0];if(s&&(s.sku&&(r.sku=s.sku),s.title&&(r.variant_title=s.title)),t.tags?.length){r.tags=t.tags.join(", ");for(let a of t.tags){let p=a.indexOf(":");if(p>0){let l=a.slice(0,p).trim().toLowerCase().replace(/\s+/g,"_"),f=a.slice(p+1).trim();l&&f&&!(l in r)&&(r[l]=f)}}}return r}function ne(t,e){let n=t.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(r,s,a)=>e[s]?a:"");return n=n.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(r,s,a)=>e[s]?"":a),n}function re(t,e){return t.replace(/\{\{(\w+)\}\}/g,(n,r)=>e[r]??"")}function ae(t){let e=document.createElement("div");return e.innerHTML=t.trim(),e.firstElementChild||e}function P(t,e,n,r,s,a){let p=te(e),l=ne(t,p);l=re(l,p);let f=ae(l),c=S(e.product_url||"#",{shopId:r,productId:e.id,query:n});return f.querySelectorAll('[data-xtal-action="view-product"]').forEach(i=>{i.tagName==="A"?(i.href=c,i.target="_blank",i.rel="noopener noreferrer"):(i.style.cursor="pointer",i.addEventListener("click",o=>{o.preventDefault(),s.onViewProduct(e)}))}),f.querySelectorAll('[data-xtal-action="add-to-cart"]').forEach(i=>{a==="fallback"&&(i.textContent="View Product"),i.addEventListener("click",async o=>{o.preventDefault(),o.stopPropagation();let d=i.textContent;i.textContent="Adding...",i.style.opacity="0.7",i.style.pointerEvents="none";try{await s.onAddToCart(e)}finally{i.textContent=d,i.style.opacity="",i.style.pointerEvents=""}})}),f}function oe(t){if(Array.isArray(t)){let e=[...t].sort((n,r)=>n-r);return e.length===0?"N/A":e.length===1||e[0]===e[e.length-1]?`$${e[0].toFixed(2)}`:`$${e[0].toFixed(2)} \u2013 $${e[e.length-1].toFixed(2)}`}return`$${t.toFixed(2)}`}function V(t,e,n,r,s){if(r&&s)return P(r.html,t,e,n,s);let a=t.image_url||t.featured_image||t.images&&t.images[0]?.src,p=document.createElement("a");p.className="xtal-card",p.href=S(t.product_url||"#",{shopId:n,productId:t.id,query:e}),p.target="_blank",p.rel="noopener noreferrer";let l=document.createElement("div");if(l.className="xtal-card-image",a){let o=document.createElement("img");o.src=a,o.alt=t.title,o.loading="lazy",l.appendChild(o)}else{let o=document.createElement("span");o.className="xtal-card-image-placeholder",o.textContent="No image",l.appendChild(o)}p.appendChild(l);let f=document.createElement("div");if(f.className="xtal-card-body",t.vendor){let o=document.createElement("div");o.className="xtal-card-vendor",o.textContent=t.vendor,f.appendChild(o)}let c=document.createElement("div");c.className="xtal-card-title",c.textContent=t.title,f.appendChild(c);let i=document.createElement("div");return i.className="xtal-card-price",i.textContent=oe(t.price),f.appendChild(i),p.appendChild(f),p}function W(t,e){let n=null,r=null,s=[];function a(l){let f=l.closest("form");if(f){let i=o=>{o.preventDefault(),o.stopImmediatePropagation();let d=l.value.trim();d.length>=1&&e(d)};f.addEventListener("submit",i,!0),s.push(()=>f.removeEventListener("submit",i,!0))}let c=i=>{if(i.key==="Enter"){i.preventDefault(),i.stopImmediatePropagation();let o=l.value.trim();o.length>=1&&e(o)}};l.addEventListener("keydown",c,!0),s.push(()=>l.removeEventListener("keydown",c,!0))}let p=document.querySelector(t);return p?(a(p),()=>s.forEach(l=>l())):(n=new MutationObserver(l=>{for(let f of l)for(let c of Array.from(f.addedNodes)){if(!(c instanceof HTMLElement))continue;let i=c.matches(t)?c:c.querySelector(t);if(i){a(i),n?.disconnect(),n=null,r&&clearTimeout(r),r=null;return}}}),n.observe(document.body,{childList:!0,subtree:!0}),r=setTimeout(()=>{n?.disconnect(),n=null,console.warn(`[xtal.js] Could not find input matching "${t}" after 10s`)},1e4),()=>{s.forEach(l=>l()),n?.disconnect(),n=null,r&&clearTimeout(r)})}function ie(t){return typeof t=="string"&&t.includes("/")?t.split("/").pop():t}var j=class{constructor(){this.name="shopify"}async addToCart(e,n=1){let r=e.variants?.[0]?.id;if(!r)return{success:!1,message:"No variant available"};if(!e.available)return{success:!1,message:"Product unavailable"};let s=ie(r);try{let a=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:s,quantity:n})});return a.ok?{success:!0,message:"Added to cart"}:a.status===422?{success:!1,message:(await a.json().catch(()=>({}))).description||"Could not add to cart"}:{success:!1,message:`Cart error (${a.status})`}}catch(a){return{success:!1,message:a instanceof Error?a.message:"Network error"}}}};var B=class{constructor(e,n){this.name="fallback";this.shopId=e,this.queryFn=n}async addToCart(e){let n=S(e.product_url||"#",{shopId:this.shopId,productId:e.id,query:this.queryFn()});return window.open(n,"_blank","noopener,noreferrer"),{success:!0,message:"Opening product page..."}}};function J(t,e){return window.Shopify?new j:new B(t,e)}function z(t,e,n,r){try{let s=JSON.stringify({action:"error",collection:e,error:n,context:r,ts:Date.now()});navigator.sendBeacon&&navigator.sendBeacon(`${t}/api/xtal/events`,s)}catch{}}function K(){if(document.getElementById("xtal-filter-styles"))return;let t=document.createElement("style");t.id="xtal-filter-styles",t.textContent=`
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
`,document.head.appendChild(t)}function G(){try{let t=document.querySelector("script[data-shop-id]");if(!t){console.warn("[xtal.js] No <script data-shop-id> tag found");return}let e=t.getAttribute("data-shop-id")??"";if(!e){console.warn("[xtal.js] data-shop-id is empty");return}let n="",r=t.getAttribute("src");if(r)try{n=new URL(r,window.location.href).origin}catch{n=window.location.origin}else n=window.location.origin;let s=new F(n,e);s.fetchConfig().then(a=>{if(!a.enabled){console.log(`[xtal.js] Snippet disabled for ${e}`);return}let p=a.cardTemplate??null;if(p?.css){let d=document.getElementById("xtal-card-styles");d&&d.remove();let m=document.createElement("style");m.id="xtal-card-styles",m.textContent=p.css,document.head.appendChild(m)}let l="",f=J(e,()=>l);console.log(`[xtal.js] Cart adapter: ${f.name}`);function c(d){if(a.productUrlPattern){let b=d.variants?.[0]?.sku||"";if(b)return a.productUrlPattern.replace("{sku}",encodeURIComponent(b)).replace("{id}",d.id||"")}let m=d.product_url||"#";return!m||m==="#"?"#":m.startsWith("http://")||m.startsWith("https://")?m:a.siteUrl?a.siteUrl.replace(/\/$/,"")+m:m}let i=a.displayMode==="inline"&&!!a.resultsSelector,o=i?document.querySelector(a.resultsSelector):null;if(i&&!o){console.log(`[xtal.js] Inline mode: "${a.resultsSelector}" not found \u2014 standing by`);return}{let d=new R(o),m=null,b=a.features?.filters===!0,g=null,u={},E=null,C=null,k=0,y={},T=null;if(b){K();let x=d.initLayout();C=new A(x,(h,w)=>{u[h]||(u[h]=[]);let $=u[h].indexOf(w);$>=0?(u[h].splice($,1),u[h].length===0&&delete u[h]):u[h].push(w),v()},h=>{E=h,v()},()=>{u={},E=null,v()})}let M={onViewProduct(x){let h=S(c(x),{shopId:e,productId:x.id,query:l});window.open(h,"_blank","noopener,noreferrer")},async onAddToCart(x){let h=await f.addToCart(x);console.log(`[xtal.js] Add to cart: ${h.success?"OK":"FAIL"} \u2014 ${h.message}`),h.success&&fetch(`${n}/api/xtal/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:x.id,action:"add_to_cart",collection:e,query:l})}).catch(()=>{})}},I=x=>x.map(h=>p?P(p.html,h,l,e,M,f.name):V(h,l,e,null,M)),v=()=>{g&&(T&&clearTimeout(T),T=setTimeout(()=>{d.showLoading(),s.searchFiltered(l,g,{facetFilters:u,priceRange:E,limit:24}).then(x=>{k=x.total,y=x.computed_facets||{},x.results.length===0?d.renderEmpty(l):d.renderCards(I(x.results)),C?.update(y,u,E,k)}).catch(x=>{x instanceof DOMException&&x.name==="AbortError"||(console.error("[xtal.js] Filter error:",x),z(n,e,String(x),"filter"))})},150))},L=x=>{if(l=x,g=null,u={},E=null,b&&!C){K();let h=d.initLayout();C=new A(h,(w,$)=>{u[w]||(u[w]=[]);let q=u[w].indexOf($);q>=0?(u[w].splice(q,1),u[w].length===0&&delete u[w]):u[w].push($),v()},w=>{E=w,v()},()=>{u={},E=null,v()})}d.showLoading(),s.searchFull(x,24).then(h=>{if(k=h.total,y=h.computed_facets||{},g=h.search_context||null,h.results.length===0){d.renderEmpty(x),C?.update({},{},null,0);return}d.renderCards(I(h.results)),C?.update(y,u,E,k)}).catch(h=>{h instanceof DOMException&&h.name==="AbortError"||(console.error("[xtal.js] Search error:",h),z(n,e,String(h),"search"),d.restore(),a.siteUrl&&l&&(window.location.href=`${a.siteUrl.replace(/\/$/,"")}/shop/?Search=${encodeURIComponent(l)}`))})},N=null,_=x=>{N&&clearTimeout(N),N=setTimeout(()=>L(x),200)},O=a.searchSelector||'input[type="search"]';m=W(O,_);let D=document.querySelector(O);D?.value?.trim()&&L(D.value.trim()),window.XTAL={destroy(){m?.(),C?.destroy(),d.destroy();let x=document.getElementById("xtal-card-styles");x&&x.remove();let h=document.getElementById("xtal-filter-styles");h&&h.remove(),delete window.XTAL}},console.log(`[xtal.js] Initialized INLINE for ${e}. Search: ${O}, Grid: ${a.resultsSelector}${b?", Filters: ON":""}`)}}).catch(a=>{console.error("[xtal.js] Failed to fetch config:",a),z(n,e,String(a),"config")})}catch(t){console.error("[xtal.js] Boot error:",t)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",G):G();})();
