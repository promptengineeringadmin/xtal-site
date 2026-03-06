"use strict";var XTAL=(()=>{var D=class{constructor(e,n){this.controller=null;this.apiBase=e,this.shopId=n}abort(){this.controller&&(this.controller.abort(),this.controller=null)}async fetchConfig(){let e=new AbortController,n=setTimeout(()=>e.abort(),5e3);try{let t=await fetch(`${this.apiBase}/api/xtal/config?shopId=${encodeURIComponent(this.shopId)}`,{mode:"cors",signal:e.signal});if(!t.ok)throw new Error(`Config fetch failed: ${t.status}`);return t.json()}finally{clearTimeout(n)}}async searchFull(e,n=16,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=await fetch(`${this.apiBase}/api/xtal/search-full`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,limit:n,selected_aspects:t}),signal:this.controller.signal});if(!o.ok)throw new Error(`Search failed: ${o.status}`);return o.json()}async searchFiltered(e,n,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=t?.facetFilters&&Object.values(t.facetFilters).some(d=>d.length>0),s=t?.priceRange?{min:t.priceRange.min,max:t.priceRange.max}:void 0,p=await fetch(`${this.apiBase}/api/xtal/search`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,search_context:n,limit:t?.limit??24,...o?{facet_filters:t.facetFilters}:{},...s?{price_range:s}:{}}),signal:this.controller.signal});if(!p.ok)throw new Error(`Filter search failed: ${p.status}`);return p.json()}};var B=class{constructor(e){this.originalHTML=null;this.originalDisplay="";this.layoutEl=null;this.railSlot=null;this.gridSlot=null;this.loadingPhraseTimer=null;this.target=e}captureOriginal(){if(this.originalHTML===null){this.originalHTML=this.target.innerHTML,this.originalDisplay=this.target.style.display,this.target.style.display="block",this.target.style.width="100%";let e=document.getElementById("xtal-early-hide");e&&e.remove();let n=document.getElementById("xtal-sdk-early-hide");n&&n.remove();let t=document.getElementById("xtal-search-loading");t&&t.remove()}}initLayout(){return this.layoutEl?this.railSlot:(this.captureOriginal(),this.target.innerHTML="",this.layoutEl=document.createElement("div"),this.layoutEl.className="xtal-layout",this.railSlot=document.createElement("div"),this.railSlot.className="xtal-rail-slot",this.gridSlot=document.createElement("div"),this.gridSlot.className="xtal-grid-slot",this.layoutEl.appendChild(this.railSlot),this.layoutEl.appendChild(this.gridSlot),this.target.appendChild(this.layoutEl),this.railSlot)}showLoading(e){this.captureOriginal(),this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null);let n=this.gridSlot||this.target;if(n.innerHTML="",!document.getElementById("xtal-inline-keyframes")){let h=document.createElement("style");h.id="xtal-inline-keyframes",h.textContent=["@keyframes xtal-inline-spin{to{transform:rotate(360deg)}}","@keyframes xtal-pulse{0%,100%{opacity:1}50%{opacity:0.4}}"].join(""),document.head.appendChild(h)}let t=this.target.getBoundingClientRect(),o=Math.max(200,window.innerHeight-t.top),s=document.createElement("div");s.style.cssText=`display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;width:100%;min-height:${o}px;`;let p=document.createElement("div");p.style.cssText="position:relative;width:48px;height:48px;margin-bottom:12px;";let d=document.createElement("div");d.style.cssText="position:absolute;inset:0;border:3px solid #e5e5e5;border-radius:50%;";let u=document.createElement("div");u.style.cssText="position:absolute;inset:0;border:3px solid transparent;border-top-color:#1d1d1b;border-radius:50%;animation:xtal-inline-spin .8s linear infinite;";let a=document.createElement("div");if(a.style.cssText="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;",a.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:xtal-pulse 2s ease-in-out infinite"><path d="M12 3l1.91 5.49L19.4 10.4l-5.49 1.91L12 17.8l-1.91-5.49L4.6 10.4l5.49-1.91z"/><path d="M19 2l.5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5z"/><path d="M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5z"/></svg>',p.appendChild(d),p.appendChild(u),p.appendChild(a),s.appendChild(p),e){let h=e.length>80?e.slice(0,77)+"\u2026":e,c=document.createElement("p");c.style.cssText="margin:0 0 8px 0;font-size:14px;color:#555;font-style:italic;text-align:center;max-width:320px;",c.textContent=`\u201C${h}\u201D`,s.appendChild(c)}let m=["This isn\u2019t just keyword search \u2014 it\u2019s smarter","Describe what it\u2019s for, not just what it is","Add a color, size, or use case to sharpen results","Full phrases beat single keywords","Know a SKU or name? Great. If not, just type what you need","The more you describe, the better the match","Try searching the way you\u2019d ask a friend","Pulling your results together\u2026"],i=document.createElement("p");i.style.cssText="margin:0;font-size:13px;color:#999;text-align:center;transition:opacity 0.3s;",i.textContent=m[0],s.appendChild(i);let l=0;this.loadingPhraseTimer=setInterval(()=>{i.style.opacity="0",setTimeout(()=>{l=(l+1)%m.length,i.textContent=m[l],i.style.opacity="1"},300)},2500),n.appendChild(s)}clearPhraseTimer(){this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null)}showFilterLoading(){let e=this.gridSlot||this.target,n=e.querySelector(".xtal-grid");if(n&&(n.style.opacity="0.5",n.style.pointerEvents="none",n.style.transition="opacity 0.15s"),!e.querySelector(".xtal-filter-spinner")){let t=document.createElement("div");t.className="xtal-filter-spinner",t.style.cssText="position:absolute;top:20px;left:50%;transform:translateX(-50%);z-index:10;width:32px;height:32px;border:3px solid #e5e5e5;border-top-color:#1d1d1b;border-radius:50%;animation:xtal-inline-spin .8s linear infinite;",getComputedStyle(e).position==="static"&&(e.style.position="relative"),e.appendChild(t)}}clearFilterLoading(){let e=this.gridSlot||this.target,n=e.querySelector(".xtal-grid");n&&(n.style.opacity="",n.style.pointerEvents="",n.style.transition="");let t=e.querySelector(".xtal-filter-spinner");t&&t.remove()}renderCards(e){this.clearPhraseTimer(),this.clearFilterLoading();let n=this.gridSlot||this.target;n.innerHTML="";let t=document.createElement("div");t.className="xtal-grid";for(let o of e)t.appendChild(o);n.appendChild(t)}renderEmpty(e){this.clearPhraseTimer(),this.clearFilterLoading();let n=this.gridSlot||this.target;n.innerHTML="";let t=document.createElement("div");t.style.cssText="text-align:center;padding:60px 20px;color:#888;font-size:14px;",t.textContent=`No results found for "${e}"`,n.appendChild(t)}restore(){this.layoutEl=null,this.railSlot=null,this.gridSlot=null;let e=document.getElementById("xtal-early-hide");e&&e.remove();let n=document.getElementById("xtal-sdk-early-hide");n&&n.remove();let t=document.getElementById("xtal-search-loading");t&&t.remove(),this.originalHTML!==null&&(this.target.innerHTML=this.originalHTML,this.target.style.display=this.originalDisplay,this.target.style.width="",this.originalHTML=null)}destroy(){this.clearPhraseTimer(),this.restore();let e=document.getElementById("xtal-inline-keyframes");e&&e.remove()}};var me={"product-subcategory":"Category",brand:"Brand",vendor:"Vendor","product-age":"Age",proof:"Proof",region:"Region",size:"Size",terpene:"Terpene",effect:"Effect","strain-type":"Strain Type",format:"Format",material:"Material",shape:"Shape","use-case":"Use Case",feature:"Feature",design:"Design",style:"Style",color:"Color"},ue=["product-subcategory","brand","vendor","strain-type","terpene","effect","format","material","use-case","style"],F=5,he=[{label:"Under $25",max:25},{label:"$25\u2013$50",min:25,max:50},{label:"$50\u2013$100",min:50,max:100},{label:"$100\u2013$200",min:100,max:200},{label:"$200+",min:200}];function Q(r){return r.split(/[-_]/).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function fe(r){return me[r]||r.split("-").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function ae(r,e){return r?r.min===e.min&&r.max===e.max:!1}var X=class{constructor(e,n,t,o,s,p){this.expandedSections=new Set(["price"].concat(ue));this.showMore={};this.drawerOpen=!1;this.savedBodyOverflow="";this.container=e,this.onFacetToggle=n,this.onPriceChange=t,this.onClearAll=o,this.pricePresets=s||he,this.hiddenFacets=new Set(p||[]),this.railEl=document.createElement("aside"),this.railEl.className="xtal-filter-rail",e.appendChild(this.railEl),this.fabEl=document.createElement("button"),this.fabEl.className="xtal-filter-fab",this.fabEl.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg><span class="xtal-fab-text">Filters</span>',this.fabEl.addEventListener("click",()=>this.openDrawer()),document.body.appendChild(this.fabEl),this.backdropEl=document.createElement("div"),this.backdropEl.className="xtal-backdrop",this.backdropEl.addEventListener("click",()=>this.closeDrawer()),document.body.appendChild(this.backdropEl),this.drawerEl=document.createElement("div"),this.drawerEl.className="xtal-filter-drawer";let d=document.createElement("div");d.className="xtal-drawer-header",d.innerHTML='<span class="xtal-drawer-title">Filters</span>';let u=document.createElement("button");u.className="xtal-drawer-close",u.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',u.setAttribute("aria-label","Close filters"),u.addEventListener("click",()=>this.closeDrawer()),d.appendChild(u),this.drawerEl.appendChild(d),this.drawerContentEl=document.createElement("div"),this.drawerContentEl.className="xtal-drawer-content",this.drawerEl.appendChild(this.drawerContentEl);let a=document.createElement("div");a.className="xtal-drawer-footer",this.drawerFooterBtn=document.createElement("button"),this.drawerFooterBtn.className="xtal-drawer-apply",this.drawerFooterBtn.textContent="Show results",this.drawerFooterBtn.addEventListener("click",()=>this.closeDrawer()),a.appendChild(this.drawerFooterBtn),this.drawerEl.appendChild(a),document.body.appendChild(this.drawerEl)}update(e,n,t,o){let s=e&&Object.keys(e).length>0,p=Object.values(n).some(i=>i.length>0)||t!==null;if(this.railEl.style.display=!s&&!p?"none":"",this.fabEl.style.display="",!s&&!p){this.fabEl.classList.add("xtal-fab-hidden");return}else this.fabEl.classList.remove("xtal-fab-hidden");this.railEl.innerHTML="",this.drawerContentEl.innerHTML="";let d=this.buildFilterSections(e,n,t,"desktop"),u=this.buildFilterSections(e,n,t,"mobile");this.railEl.appendChild(d),this.drawerContentEl.appendChild(u);let a=Object.values(n).reduce((i,l)=>i+l.length,0)+(t?1:0),m=this.fabEl.querySelector(".xtal-fab-badge");if(m&&m.remove(),a>0){let i=document.createElement("span");i.className="xtal-fab-badge",i.textContent=String(a),this.fabEl.appendChild(i)}this.drawerFooterBtn.textContent=`Show ${o} result${o!==1?"s":""}`}buildFilterSections(e,n,t,o){let s=document.createDocumentFragment();if(Object.values(n).some(a=>a.length>0)||t!==null){let a=document.createElement("div");a.className="xtal-applied-section";let m=document.createElement("div");m.className="xtal-clear-row";let i=document.createElement("button");i.className="xtal-clear-all",i.textContent="Clear all",i.addEventListener("click",()=>this.onClearAll()),m.appendChild(i),a.appendChild(m);let l=document.createElement("div");l.className="xtal-applied-chips";for(let[h,c]of Object.entries(n))for(let b of c){let y=document.createElement("button");y.className="xtal-chip",y.innerHTML=`${Q(b)} <span class="xtal-chip-x">\xD7</span>`,y.addEventListener("click",()=>this.onFacetToggle(h,b)),l.appendChild(y)}if(t){let h=document.createElement("button");h.className="xtal-chip";let c=t.min&&t.max?`$${t.min}\u2013$${t.max}`:t.max?`Under $${t.max}`:`$${t.min}+`;h.innerHTML=`${c} <span class="xtal-chip-x">\xD7</span>`,h.addEventListener("click",()=>this.onPriceChange(null)),l.appendChild(h)}a.appendChild(l),s.appendChild(a)}let d=this.buildCollapsibleSection("price","Price",0,t!==null,o,()=>{let a=document.createElement("div");a.className="xtal-price-presets";for(let m of this.pricePresets){let i=document.createElement("button");i.className="xtal-price-btn",ae(t,m)&&i.classList.add("xtal-price-btn-active"),i.textContent=m.label,i.addEventListener("click",()=>{ae(t,m)?this.onPriceChange(null):this.onPriceChange({min:m.min,max:m.max})}),a.appendChild(i)}return a});s.appendChild(d);let u=Object.entries(e).filter(([a])=>!this.hiddenFacets.has(a));for(let[a,m]of u){let i=n[a]||[],l=i.length,h=this.buildCollapsibleSection(a,fe(a),l,l>0,o,()=>{let c=document.createElement("div");c.className="xtal-facet-list";let b=Object.entries(m).sort((w,I)=>I[1]-w[1]),y=`${o}-${a}`,v=this.showMore[y],k=v||b.length<=F?b:b.slice(0,F),S=b.length-F;for(let[w,I]of k){let E=i.includes(w),x=I===0&&!E,T=document.createElement("label");T.className="xtal-facet-label",x&&T.classList.add("xtal-facet-disabled");let C=document.createElement("input");C.type="checkbox",C.className="xtal-facet-checkbox",C.checked=E,x&&(C.disabled=!0),C.addEventListener("change",()=>this.onFacetToggle(a,w));let _=document.createElement("span");_.className="xtal-facet-text",_.textContent=Q(w);let M=document.createElement("span");M.className="xtal-facet-count",M.textContent=String(I),T.appendChild(C),T.appendChild(_),T.appendChild(M),c.appendChild(T)}if(S>0){let w=document.createElement("button");w.className="xtal-show-more",w.textContent=v?"Show less":`Show ${S} more`,w.addEventListener("click",()=>{this.showMore[y]=!this.showMore[y];let I=w.parentElement;if(!I)return;let E=this.buildFacetList(a,m,i,o);I.replaceWith(E)}),c.appendChild(w)}return c});s.appendChild(h)}return s}buildFacetList(e,n,t,o){let s=document.createElement("div");s.className="xtal-facet-list";let p=`${o}-${e}`,d=Object.entries(n).sort((i,l)=>l[1]-i[1]),u=this.showMore[p],a=u||d.length<=F?d:d.slice(0,F),m=d.length-F;for(let[i,l]of a){let h=t.includes(i),c=l===0&&!h,b=document.createElement("label");b.className="xtal-facet-label",c&&b.classList.add("xtal-facet-disabled");let y=document.createElement("input");y.type="checkbox",y.className="xtal-facet-checkbox",y.checked=h,c&&(y.disabled=!0),y.addEventListener("change",()=>this.onFacetToggle(e,i));let v=document.createElement("span");v.className="xtal-facet-text",v.textContent=Q(i);let k=document.createElement("span");k.className="xtal-facet-count",k.textContent=String(l),b.appendChild(y),b.appendChild(v),b.appendChild(k),s.appendChild(b)}if(m>0){let i=document.createElement("button");i.className="xtal-show-more",i.textContent=u?"Show less":`Show ${m} more`,i.addEventListener("click",()=>{this.showMore[p]=!this.showMore[p];let l=this.buildFacetList(e,n,t,o);s.replaceWith(l)}),s.appendChild(i)}return s}buildCollapsibleSection(e,n,t,o,s,p){let d=document.createElement("div");d.className="xtal-filter-section";let u=o||this.expandedSections.has(e),a=document.createElement("button");a.className="xtal-section-header";let m=document.createElement("span");if(m.className="xtal-section-label",m.textContent=n,t>0){let h=document.createElement("span");h.className="xtal-section-badge",h.textContent=String(t),m.appendChild(h)}let i=document.createElement("span");i.className="xtal-section-chevron",i.textContent=u?"\u25BE":"\u25B8",a.appendChild(m),a.appendChild(i),a.addEventListener("click",()=>{this.expandedSections.has(e)?this.expandedSections.delete(e):this.expandedSections.add(e);let h=d.querySelector(".xtal-section-content");h&&(h.style.display=h.style.display==="none"?"":"none",i.textContent=h.style.display==="none"?"\u25B8":"\u25BE")}),d.appendChild(a);let l=document.createElement("div");return l.className="xtal-section-content",u||(l.style.display="none"),l.appendChild(p()),d.appendChild(l),d}resetState(){this.showMore={}}openDrawer(){this.drawerOpen=!0,this.savedBodyOverflow=document.body.style.overflow,document.body.style.overflow="hidden",this.backdropEl.classList.add("xtal-backdrop-open"),this.drawerEl.classList.add("xtal-drawer-open")}closeDrawer(){this.drawerOpen=!1,document.body.style.overflow=this.savedBodyOverflow,this.backdropEl.classList.remove("xtal-backdrop-open"),this.drawerEl.classList.remove("xtal-drawer-open")}destroy(){this.drawerOpen&&this.closeDrawer(),this.railEl.remove(),this.fabEl.remove(),this.backdropEl.remove(),this.drawerEl.remove()}};function N(r,e){try{let n=new URL(r);return n.searchParams.set("utm_source","xtal"),n.searchParams.set("utm_medium","search"),n.searchParams.set("utm_campaign",e.shopId),n.searchParams.set("utm_content",e.productId),n.searchParams.set("utm_term",e.query),n.toString()}catch{return r}}function ge(r,e){let n=Array.isArray(r.price)?r.price[0]??0:r.price,t=r.variants?.[0]?.compare_at_price,o={id:r.id??"",title:r.title??"",vendor:r.vendor??"",product_type:r.product_type??"",price:n.toFixed(2),image_url:r.image_url||r.featured_image||r.images?.[0]?.src||"",product_url:e||r.product_url||"",available:r.available?"true":"",description:r.description??""};t&&t>n&&(o.compare_at_price=t.toFixed(2));let s=r.variants?.[0];if(s&&(s.sku&&(o.sku=s.sku),s.title&&(o.variant_title=s.title)),r.tags?.length){o.tags=r.tags.join(", ");for(let p of r.tags){let d=p.indexOf(":");if(d>0){let u=p.slice(0,d).trim().toLowerCase().replace(/\s+/g,"_"),a=p.slice(d+1).trim();u&&a&&!(u in o)&&(o[u]=a)}}}return o}function xe(r,e){let n=r.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,s)=>e[o]?s:"");return n=n.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,s)=>e[o]?"":s),n}function be(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function ye(r){let e=r.replace(/<script\b[\s\S]*?<\/script>/gi,"");return e=e.replace(/<iframe\b[\s\S]*?<\/iframe>/gi,""),e=e.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,""),e=e.replace(/(href|src|action)\s*=\s*"(?:javascript|data):[^"]*"/gi,'$1=""'),e=e.replace(/(href|src|action)\s*=\s*'(?:javascript|data):[^']*'/gi,"$1=''"),e=e.replace(/(href|src|action)\s*=\s*(?:javascript|data):[^\s>]*/gi,'$1=""'),e}function Ee(r,e){return r.replace(/\{\{(\w+)\}\}/g,(n,t)=>be(e[t]??""))}function ve(r){let e=document.createElement("div");return e.innerHTML=ye(r.trim()),e.firstElementChild||e}function q(r,e,n,t,o,s,p){let d=ge(e,p),u=xe(r,d);u=Ee(u,d);let a=ve(u),m=N(p||e.product_url||"#",{shopId:t,productId:e.id,query:n});return a.querySelectorAll('[data-xtal-action="view-product"]').forEach(i=>{i.tagName==="A"?(i.href=m,i.target="_blank",i.rel="noopener noreferrer"):(i.style.cursor="pointer",i.addEventListener("click",l=>{l.preventDefault(),o.onViewProduct(e)}))}),a.querySelectorAll('[data-xtal-action="add-to-cart"]').forEach(i=>{s==="fallback"&&(i.textContent="View Product"),i.addEventListener("click",async l=>{l.preventDefault(),l.stopPropagation();let h=i.textContent;i.textContent="Adding...",i.style.opacity="0.7",i.style.pointerEvents="none";try{await o.onAddToCart(e)}finally{i.textContent=h,i.style.opacity="",i.style.pointerEvents=""}})}),a}function we(r){if(Array.isArray(r)){let e=[...r].sort((n,t)=>n-t);return e.length===0?"N/A":e.length===1||e[0]===e[e.length-1]?`$${e[0].toFixed(2)}`:`$${e[0].toFixed(2)} \u2013 $${e[e.length-1].toFixed(2)}`}return`$${r.toFixed(2)}`}function se(r,e,n,t,o,s){if(t&&o)return q(t.html,r,e,n,o);let p=r.image_url||r.featured_image||r.images&&r.images[0]?.src,d=document.createElement("a");d.className="xtal-card",d.href=N(s||r.product_url||"#",{shopId:n,productId:r.id,query:e}),d.target="_blank",d.rel="noopener noreferrer";let u=document.createElement("div");if(u.className="xtal-card-image",p){let l=document.createElement("img");l.src=p,l.alt=r.title,l.loading="lazy",u.appendChild(l)}else{let l=document.createElement("span");l.className="xtal-card-image-placeholder",l.textContent="No image",u.appendChild(l)}d.appendChild(u);let a=document.createElement("div");if(a.className="xtal-card-body",r.vendor){let l=document.createElement("div");l.className="xtal-card-vendor",l.textContent=r.vendor,a.appendChild(l)}let m=document.createElement("div");m.className="xtal-card-title",m.textContent=r.title,a.appendChild(m);let i=document.createElement("div");return i.className="xtal-card-price",i.textContent=we(r.price),a.appendChild(i),d.appendChild(a),d}function oe(r,e,n){let t=null,o=null,s=[];function p(a){let m=a.closest("form");if(m){let l=h=>{h.preventDefault(),h.stopImmediatePropagation();let c=a.value.trim();c.length>=1&&e(c)};m.addEventListener("submit",l,!0),s.push(()=>m.removeEventListener("submit",l,!0))}let i=l=>{if(l.key==="Enter"){l.preventDefault(),l.stopImmediatePropagation();let h=a.value.trim();h.length>=1&&e(h)}};a.addEventListener("keydown",i,!0),s.push(()=>a.removeEventListener("keydown",i,!0))}let d=document.querySelector(r);if(d)return p(d),()=>s.forEach(a=>a());t=new MutationObserver(a=>{for(let m of a)for(let i of Array.from(m.addedNodes)){if(!(i instanceof HTMLElement))continue;let l=i.matches(r)?i:i.querySelector(r);if(l){p(l),t?.disconnect(),t=null,o&&clearTimeout(o),o=null;return}}}),t.observe(document.body,{childList:!0,subtree:!0});let u=n??1e4;return o=setTimeout(()=>{t?.disconnect(),t=null,console.warn(`[xtal.js] Could not find input matching "${r}" after ${u/1e3}s`)},u),()=>{s.forEach(a=>a()),t?.disconnect(),t=null,o&&clearTimeout(o)}}function Ce(r){return typeof r=="string"&&r.includes("/")?r.split("/").pop():r}var W=class{constructor(){this.name="shopify"}async addToCart(e,n=1){let t=e.variants?.[0]?.id;if(!t)return{success:!1,message:"No variant available"};if(!e.available)return{success:!1,message:"Product unavailable"};let o=Ce(t);try{let s=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o,quantity:n})});return s.ok?{success:!0,message:"Added to cart"}:s.status===422?{success:!1,message:(await s.json().catch(()=>({}))).description||"Could not add to cart"}:{success:!1,message:`Cart error (${s.status})`}}catch(s){return{success:!1,message:s instanceof Error?s.message:"Network error"}}}};var G=class{constructor(e,n,t){this.name="fallback";this.shopId=e,this.queryFn=n,this.resolveUrl=t}async addToCart(e){let n=this.resolveUrl?.(e)??e.product_url??"#",t=N(n,{shopId:this.shopId,productId:e.id,query:this.queryFn()});return window.open(t,"_blank","noopener,noreferrer"),{success:!0,message:"Opening product page..."}}};function le(r,e,n){return window.Shopify?new W:new G(r,e,n)}var ce=new Set(["body","html","head","*"]);function Te(r,e){return r.replace(/\/\*[\s\S]*?\*\//g,"").replace(/([^{}@][^{}]*)\{([^{}]*)\}/g,(t,o,s)=>{let p=o.trim();if(!p||/^(from|to|\d[\d.]*%)/.test(p))return t;let d=p.split(",").map(u=>{let a=u.trim();return a?`${e} ${a}`:""}).filter(Boolean).join(", ");return d?`${d} { ${s} }`:t})}function Z(r,e,n,t){try{let o=`${r}/api/xtal/events`,s=JSON.stringify({action:"error",collection:e,error:n,context:t,ts:Date.now()});navigator.sendBeacon?.(o,s)||fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:s,keepalive:!0}).catch(()=>{})}catch{}}function Le(){if(document.getElementById("xtal-filter-styles"))return;let r=document.createElement("style");r.id="xtal-filter-styles",r.textContent=`
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
  cursor: pointer; font-size: 14px; font-weight: 400; color: #1d1d1b;
  font-family: inherit;
}
.xtal-section-header:hover { color: #000; }
.xtal-section-label { display: flex; align-items: center; gap: 8px; }
.xtal-section-badge {
  font-size: 10px; padding: 1px 6px; border-radius: 9999px;
  background: #1d1d1b; color: #fff; font-weight: 400;
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
  font-size: 15px; font-weight: 400;
  line-height: 1; letter-spacing: 0.3px; text-transform: none;
  box-sizing: border-box;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 12px 28px rgba(0,0,0,0.3);
}
.xtal-filter-fab:active { transform: translateX(-50%) scale(0.96); transition: transform 0.1s ease; }
.xtal-fab-text { margin: 0; padding: 0; display: block; }
.xtal-fab-badge {
  display: flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%;
  background: #fff; color: #1d1d1b; font-size: 12px; font-weight: 400;
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
  font-family: "Manrope", serif; font-size: 14px; font-weight: 400; color: #1d1d1b;
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
  font-family: "Manrope", serif; font-size: 14px; font-weight: 400;
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
`,document.head.appendChild(r)}function Se(){return/[?&](Search|search)=/.test(window.location.search)}function ke(r){if(document.getElementById("xtal-sdk-early-hide"))return;let e=document.createElement("style");e.id="xtal-sdk-early-hide",e.textContent=`${r} { visibility: hidden !important; min-height: calc(100vh - 160px); }`,document.head.appendChild(e)}function de(){try{let r=document.querySelector("script[data-shop-id]"),e=window.XTAL_CONFIG,n=r?.getAttribute("data-shop-id")||e?.shopId||"";if(!n){console.warn("[xtal.js] No shopId found \u2014 need <script data-shop-id> or window.XTAL_CONFIG = { shopId: '...' }");return}let t="",o=r?.getAttribute("src");if(o)try{t=new URL(o,window.location.href).origin}catch{}t||(t=e?.apiBase||"https://www.xtalsearch.com");let s=new D(t,n),p=3e5,d=864e5,u=`xtal:config:${n}`,a=null,m=null;try{let c=localStorage.getItem(u);if(c){let b=JSON.parse(c),y=Date.now()-b.ts;y<p?a=b.config:y<d&&b.config.resultsSelector&&(m=b.config.resultsSelector)}}catch{}if(window.__XTAL_LOADING=!0,Se()){let c=a?.resultsSelector||m||e?.resultsSelector;c&&!ce.has(c.trim().toLowerCase())&&ke(c)}let i=c=>{try{localStorage.setItem(u,JSON.stringify({config:c,ts:Date.now()}))}catch{}},l=c=>{if(!c.enabled){console.log(`[xtal.js] Snippet disabled for ${n}`);return}let b=c.cardTemplate??null;if(b?.css){let E=document.getElementById("xtal-card-styles");E&&E.remove();let x=document.createElement("style");x.id="xtal-card-styles",x.textContent=Te(b.css,".xtal-layout"),document.head.appendChild(x)}function y(E){if(c.productUrlPattern){let T=E.variants?.[0]?.sku||"";if(T){let C=c.productUrlPattern.replace("{sku}",encodeURIComponent(T)).replace("{id}",E.id||"");if(!/^javascript:/i.test(C)&&!/^data:/i.test(C))return C}}let x=E.product_url||"#";return!x||x==="#"?"#":x.startsWith("http://")||x.startsWith("https://")?x:c.siteUrl?c.siteUrl.replace(/\/$/,"")+x:x}let v="",k=le(n,()=>v,y);console.log(`[xtal.js] Cart adapter: ${k.name}`);let S=c.resultsSelector??"",w=!!S&&!ce.has(S.trim().toLowerCase());if(!(c.displayMode==="inline"&&w)){!w&&S&&console.warn(`[xtal.js] resultsSelector "${S}" is blocked \u2014 SDK disabled`),window.XTAL={destroy(){let E=document.getElementById("xtal-card-styles");E&&E.remove(),window.XTAL=void 0}};return}{let E=document.querySelector(S),x=E?new B(E):null,T=null,C=()=>x||(E=document.querySelector(S),E&&(x=new B(E),_&&x.initLayout()),x),_=c.features?.filters===!0,M=null,L={},$=null,H=null,O=0,z={},j=null;_&&(Le(),x?.initLayout());let pe=()=>{if(H||!_||!x)return;let g=x.initLayout();H=new X(g,(f,A)=>{L[f]||(L[f]=[]);let ie=L[f].indexOf(A);ie>=0?(L[f].splice(ie,1),L[f].length===0&&delete L[f]):L[f].push(A),K()},f=>{$=f,K()},()=>{L={},$=null,K()},c.pricePresets,c.hiddenFacets)},Y={onViewProduct(g){let f=N(y(g),{shopId:n,productId:g.id,query:v});window.open(f,"_blank","noopener,noreferrer")},async onAddToCart(g){let f=await k.addToCart(g);console.log(`[xtal.js] Add to cart: ${f.success?"OK":"FAIL"} \u2014 ${f.message}`),f.success&&fetch(`${t}/api/xtal/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:g.id,action:"add_to_cart",collection:n,query:v})}).catch(()=>{})}},ee=g=>g.map(f=>b?q(b.html,f,v,n,Y,k.name,y(f)):se(f,v,n,null,Y,y(f))),K=()=>{!M||!x||(j&&clearTimeout(j),j=setTimeout(()=>{x?.showFilterLoading(),s.searchFiltered(v,M,{facetFilters:L,priceRange:$,limit:c.resultsPerPage??24}).then(g=>{O=g.total,z=g.computed_facets||{},g.results.length===0?x?.renderEmpty(v):x?.renderCards(ee(g.results)),H?.update(z,L,$,O)}).catch(g=>{g instanceof DOMException&&g.name==="AbortError"||(console.error("[xtal.js] Filter error:",g),Z(t,n,String(g),"filter"))})},350))},U=c.siteUrl&&(c.siteUrl.startsWith("https://")||c.siteUrl.startsWith("http://"))?c.siteUrl.replace(/\/$/,""):"",V=g=>{if(v=g,!C()){let f=/[?&](Search|search)=/.test(window.location.search);U&&!f&&(console.log("[xtal.js] No results container \u2014 navigating to search page"),window.location.href=`${U}/shop/?Search=${encodeURIComponent(g)}`);return}M=null,L={},$=null,H?.closeDrawer(),H?.resetState(),x.showLoading(g),s.searchFull(g,c.resultsPerPage??24).then(f=>{O=f.total,z=f.computed_facets||{},M=f.search_context||null,pe();let A=document.querySelector(J);if(A&&A.value!==g&&(A.value=g),f.results.length===0){x?.renderEmpty(g),H?.update({},{},null,0);return}x?.renderCards(ee(f.results)),H?.update(z,L,$,O)}).catch(f=>{f instanceof DOMException&&f.name==="AbortError"||(console.error("[xtal.js] Search error:",f),Z(t,n,String(f),"search"),x?.restore(),U&&v&&(window.location.href=`${U}/shop/?Search=${encodeURIComponent(v)}`))})},R=null,te=g=>{R&&clearTimeout(R),R=setTimeout(()=>V(g),200)},J=c.searchSelector||'input[type="search"]';T=oe(J,te,c.observerTimeoutMs);let P=null;E||(console.log(`[xtal.js] Inline mode: "${S}" not found \u2014 watching`),P=new MutationObserver(()=>{C()&&(P?.disconnect(),P=null,v&&!M&&V(v))}),P.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{P?.disconnect(),P=null},c.observerTimeoutMs??1e4));let ne=new URLSearchParams(window.location.search),re=ne.get("Search")||ne.get("search");re?.trim()&&V(re.trim()),window.XTAL={search(g){g?.trim()&&te(g.trim())},destroy(){R&&clearTimeout(R),j&&clearTimeout(j),s.abort(),T?.(),P?.disconnect(),H?.destroy(),x?.destroy();let g=document.getElementById("xtal-card-styles");g&&g.remove();let f=document.getElementById("xtal-filter-styles");f&&f.remove(),window.XTAL=void 0}},console.log(`[xtal.js] Initialized INLINE for ${n}. Search: ${J}, Grid: ${c.resultsSelector}${E?"":" (deferred)"}${_?", Filters: ON":""}`)}window.__XTAL_LOADING=!1},h=!1;a?(l(a),h=!0,s.fetchConfig().then(i).catch(()=>{})):s.fetchConfig().then(c=>{i(c),h||l(c)}).catch(c=>{console.error("[xtal.js] Failed to fetch config:",c),Z(t,n,String(c),"config"),window.__XTAL_LOADING=!1})}catch(r){console.error("[xtal.js] Boot error:",r)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",de):de();})();
