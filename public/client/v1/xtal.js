"use strict";var XTAL=(()=>{var Q=class{constructor(e,n){this.controller=null;this.apiBase=e,this.shopId=n}abort(){this.controller&&(this.controller.abort(),this.controller=null)}async fetchConfig(){let e=new AbortController,n=setTimeout(()=>e.abort(),5e3);try{let t=await fetch(`${this.apiBase}/api/xtal/config?shopId=${encodeURIComponent(this.shopId)}`,{mode:"cors",signal:e.signal});if(!t.ok)throw new Error(`Config fetch failed: ${t.status}`);return t.json()}finally{clearTimeout(n)}}async searchFull(e,n=16,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let s=await fetch(`${this.apiBase}/api/xtal/search-full`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,limit:n,selected_aspects:t}),signal:this.controller.signal});if(!s.ok)throw new Error(`Search failed: ${s.status}`);return s.json()}async searchShowcase(e,n=4){let t=await fetch(`${this.apiBase}/api/xtal/search-full`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,limit:n,_showcase:!0})});if(!t.ok)throw new Error(`Showcase search failed: ${t.status}`);return t.json()}async searchFiltered(e,n,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let s=t?.facetFilters&&Object.values(t.facetFilters).some(d=>d.length>0),a=t?.priceRange?{min:t.priceRange.min,max:t.priceRange.max}:void 0,l=await fetch(`${this.apiBase}/api/xtal/search`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,search_context:n,limit:t?.limit??24,...s?{facet_filters:t.facetFilters}:{},...a?{price_range:a}:{}}),signal:this.controller.signal});if(!l.ok)throw new Error(`Filter search failed: ${l.status}`);return l.json()}};var z=class{constructor(e){this.originalHTML=null;this.originalDisplay="";this.layoutEl=null;this.railSlot=null;this.gridSlot=null;this.firstSearchDone=!1;this.loadingPhraseTimer=null;this.target=e}captureOriginal(){if(this.originalHTML===null){this.originalHTML=this.target.innerHTML,this.originalDisplay=this.target.style.display,this.target.style.display="block",this.target.style.width="100%";let e=document.getElementById("xtal-early-hide");e&&e.remove();let n=document.getElementById("xtal-sdk-early-hide");n&&n.remove();let t=document.getElementById("xtal-search-loading");t&&t.remove()}}initLayout(){return this.layoutEl?this.railSlot:(this.captureOriginal(),this.target.innerHTML="",this.layoutEl=document.createElement("div"),this.layoutEl.className="xtal-layout",this.railSlot=document.createElement("div"),this.railSlot.className="xtal-rail-slot",this.gridSlot=document.createElement("div"),this.gridSlot.className="xtal-grid-slot",this.layoutEl.appendChild(this.railSlot),this.layoutEl.appendChild(this.gridSlot),this.target.appendChild(this.layoutEl),this.railSlot)}showLoading(e){this.captureOriginal(),this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null);let n=this.gridSlot||this.target;if(n.innerHTML="",!document.getElementById("xtal-inline-keyframes")){let y=document.createElement("style");y.id="xtal-inline-keyframes",y.textContent=["@keyframes xtal-inline-spin{to{transform:rotate(360deg)}}","@keyframes xtal-pulse{0%,100%{opacity:1}50%{opacity:0.4}}"].join(""),document.head.appendChild(y)}let t=this.target.getBoundingClientRect(),s=Math.max(200,window.innerHeight-t.top),a=document.createElement("div");a.style.cssText=`display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:60px 20px 48px;width:100%;min-height:${s}px;`,a.setAttribute("role","status"),a.setAttribute("aria-live","polite");let l=document.createElement("div");l.style.cssText="position:relative;width:48px;height:48px;margin-bottom:12px;";let d=document.createElement("div");d.style.cssText="position:absolute;inset:0;border:3px solid #e5e5e5;border-radius:50%;";let u=document.createElement("div");u.style.cssText="position:absolute;inset:0;border:3px solid transparent;border-top-color:#1d1d1b;border-radius:50%;animation:xtal-inline-spin .8s linear infinite;";let o=document.createElement("div");o.style.cssText="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;",o.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:xtal-pulse 2s ease-in-out infinite"><path d="M12 3l1.91 5.49L19.4 10.4l-5.49 1.91L12 17.8l-1.91-5.49L4.6 10.4l5.49-1.91z"/><path d="M19 2l.5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5z"/><path d="M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5z"/></svg>',l.appendChild(d),l.appendChild(u),l.appendChild(o);let h=["While we gather your results, here\u2019s how XTAL works","XTAL understands full phrases, not just keywords","For really effective results, try searching the way you\u2019d ask a friend","Know the right SKU or product name? That works too","Finding your results\u2026"],i=document.createElement("p");if(i.style.cssText="margin:0 0 16px 0;font-size:13px;line-height:1.5;color:#767676;text-align:center;transition:opacity 0.3s;min-height:2.6em;display:flex;align-items:center;justify-content:center;",i.textContent=h[0],a.appendChild(i),a.appendChild(l),e){let y=e.length>80?e.slice(0,77)+"\u2026":e,c=document.createElement("p");c.style.cssText="margin:0 0 8px 0;font-size:14px;color:#555;font-style:italic;text-align:center;max-width:320px;",c.textContent=`"${y}"`,a.appendChild(c)}let p=this.firstSearchDone?1+Math.floor(Math.random()*(h.length-1)):0;this.firstSearchDone=!0,i.textContent=h[p],this.loadingPhraseTimer=setInterval(()=>{i.style.opacity="0",setTimeout(()=>{p=(p+1)%h.length,i.textContent=h[p],i.style.opacity="1"},400)},2500),n.appendChild(a)}clearPhraseTimer(){this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null)}showFilterLoading(){let e=this.gridSlot||this.target,n=e.querySelector(".xtal-grid");if(n&&(n.style.opacity="0.5",n.style.pointerEvents="none",n.style.transition="opacity 0.15s"),!e.querySelector(".xtal-filter-spinner")){let t=document.createElement("div");t.className="xtal-filter-spinner",t.style.cssText="position:absolute;top:20px;left:50%;transform:translateX(-50%);z-index:10;width:32px;height:32px;border:3px solid #e5e5e5;border-top-color:#1d1d1b;border-radius:50%;animation:xtal-inline-spin .8s linear infinite;",getComputedStyle(e).position==="static"&&(e.style.position="relative"),e.appendChild(t)}}clearFilterLoading(){let e=this.gridSlot||this.target,n=e.querySelector(".xtal-grid");n&&(n.style.opacity="",n.style.pointerEvents="",n.style.transition="");let t=e.querySelector(".xtal-filter-spinner");t&&t.remove()}renderCards(e){this.clearPhraseTimer(),this.clearFilterLoading();let n=this.gridSlot||this.target;n.innerHTML="";let t=document.createElement("div");t.className="xtal-grid";for(let s of e)t.appendChild(s);n.appendChild(t)}renderCustom(e){this.clearPhraseTimer(),this.clearFilterLoading();let n=this.gridSlot||this.target;n.innerHTML="",n.appendChild(e)}renderEmpty(e){this.clearPhraseTimer(),this.clearFilterLoading();let n=this.gridSlot||this.target;n.innerHTML="";let t=document.createElement("div");t.style.cssText="text-align:center;padding:60px 20px;color:#888;font-size:14px;",t.textContent=`No results found for "${e}"`,n.appendChild(t)}restore(){this.layoutEl=null,this.railSlot=null,this.gridSlot=null;let e=document.getElementById("xtal-early-hide");e&&e.remove();let n=document.getElementById("xtal-sdk-early-hide");n&&n.remove();let t=document.getElementById("xtal-search-loading");t&&t.remove(),this.originalHTML!==null&&(this.target.innerHTML=this.originalHTML,this.target.style.display=this.originalDisplay,this.target.style.width="",this.originalHTML=null)}destroy(){this.clearPhraseTimer(),this.restore();let e=document.getElementById("xtal-inline-keyframes");e&&e.remove()}};var ve={"product-subcategory":"Category",brand:"Brand",vendor:"Vendor","product-age":"Age",proof:"Proof",region:"Region",size:"Size",terpene:"Terpene",effect:"Effect","strain-type":"Strain Type",format:"Format",material:"Material",shape:"Shape","use-case":"Use Case",feature:"Feature",design:"Design",style:"Style",color:"Color"},Ee=["product-subcategory","brand","vendor","strain-type","terpene","effect","format","material","use-case","style"],F=5,Ce=[{label:"Under $25",max:25},{label:"$25\u2013$50",min:25,max:50},{label:"$50\u2013$100",min:50,max:100},{label:"$100\u2013$200",min:100,max:200},{label:"$200+",min:200}];function Z(r){return r.split(/[-_]/).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function Se(r){return ve[r]||r.split("-").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function ce(r,e){return r?r.min===e.min&&r.max===e.max:!1}var K=class{constructor(e,n,t,s,a,l){this.expandedSections=new Set(["price"].concat(Ee));this.showMore={};this.drawerOpen=!1;this.savedBodyOverflow="";this.container=e,this.onFacetToggle=n,this.onPriceChange=t,this.onClearAll=s,this.pricePresets=a||Ce,this.hiddenFacets=new Set(l||[]),this.railEl=document.createElement("aside"),this.railEl.className="xtal-filter-rail",e.appendChild(this.railEl),this.fabEl=document.createElement("button"),this.fabEl.className="xtal-filter-fab",this.fabEl.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg><span class="xtal-fab-text">Filters</span>',this.fabEl.addEventListener("click",()=>this.openDrawer()),document.body.appendChild(this.fabEl),this.backdropEl=document.createElement("div"),this.backdropEl.className="xtal-backdrop",this.backdropEl.addEventListener("click",()=>this.closeDrawer()),document.body.appendChild(this.backdropEl),this.drawerEl=document.createElement("div"),this.drawerEl.className="xtal-filter-drawer";let d=document.createElement("div");d.className="xtal-drawer-header",d.innerHTML='<span class="xtal-drawer-title">Filters</span>';let u=document.createElement("button");u.className="xtal-drawer-close",u.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',u.setAttribute("aria-label","Close filters"),u.addEventListener("click",()=>this.closeDrawer()),d.appendChild(u),this.drawerEl.appendChild(d),this.drawerContentEl=document.createElement("div"),this.drawerContentEl.className="xtal-drawer-content",this.drawerEl.appendChild(this.drawerContentEl);let o=document.createElement("div");o.className="xtal-drawer-footer",this.drawerFooterBtn=document.createElement("button"),this.drawerFooterBtn.className="xtal-drawer-apply",this.drawerFooterBtn.textContent="Show results",this.drawerFooterBtn.addEventListener("click",()=>this.closeDrawer()),o.appendChild(this.drawerFooterBtn),this.drawerEl.appendChild(o),document.body.appendChild(this.drawerEl)}update(e,n,t,s){let a=e&&Object.keys(e).length>0,l=Object.values(n).some(i=>i.length>0)||t!==null;if(this.railEl.style.display=!a&&!l?"none":"",this.fabEl.style.display="",!a&&!l){this.fabEl.classList.add("xtal-fab-hidden");return}else this.fabEl.classList.remove("xtal-fab-hidden");this.railEl.innerHTML="",this.drawerContentEl.innerHTML="";let d=this.buildFilterSections(e,n,t,"desktop"),u=this.buildFilterSections(e,n,t,"mobile");this.railEl.appendChild(d),this.drawerContentEl.appendChild(u);let o=Object.values(n).reduce((i,p)=>i+p.length,0)+(t?1:0),h=this.fabEl.querySelector(".xtal-fab-badge");if(h&&h.remove(),o>0){let i=document.createElement("span");i.className="xtal-fab-badge",i.textContent=String(o),this.fabEl.appendChild(i)}this.drawerFooterBtn.textContent=`Show ${s} result${s!==1?"s":""}`}buildFilterSections(e,n,t,s){let a=document.createDocumentFragment();if(Object.values(n).some(o=>o.length>0)||t!==null){let o=document.createElement("div");o.className="xtal-applied-section";let h=document.createElement("div");h.className="xtal-clear-row";let i=document.createElement("button");i.className="xtal-clear-all",i.textContent="Clear all",i.addEventListener("click",()=>this.onClearAll()),h.appendChild(i),o.appendChild(h);let p=document.createElement("div");p.className="xtal-applied-chips";for(let[y,c]of Object.entries(n))for(let m of c){let b=document.createElement("button");b.className="xtal-chip",b.innerHTML=`${Z(m)} <span class="xtal-chip-x">\xD7</span>`,b.addEventListener("click",()=>this.onFacetToggle(y,m)),p.appendChild(b)}if(t){let y=document.createElement("button");y.className="xtal-chip";let c=t.min&&t.max?`$${t.min}\u2013$${t.max}`:t.max?`Under $${t.max}`:`$${t.min}+`;y.innerHTML=`${c} <span class="xtal-chip-x">\xD7</span>`,y.addEventListener("click",()=>this.onPriceChange(null)),p.appendChild(y)}o.appendChild(p),a.appendChild(o)}let d=this.buildCollapsibleSection("price","Price",0,t!==null,s,()=>{let o=document.createElement("div");o.className="xtal-price-presets";for(let h of this.pricePresets){let i=document.createElement("button");i.className="xtal-price-btn",ce(t,h)&&i.classList.add("xtal-price-btn-active"),i.textContent=h.label,i.addEventListener("click",()=>{ce(t,h)?this.onPriceChange(null):this.onPriceChange({min:h.min,max:h.max})}),o.appendChild(i)}return o});a.appendChild(d);let u=Object.entries(e).filter(([o])=>!this.hiddenFacets.has(o));for(let[o,h]of u){let i=n[o]||[],p=i.length,y=this.buildCollapsibleSection(o,Se(o),p,p>0,s,()=>{let c=document.createElement("div");c.className="xtal-facet-list";let m=Object.entries(h).sort((T,E)=>E[1]-T[1]),b=`${s}-${o}`,v=this.showMore[b],S=v||m.length<=F?m:m.slice(0,F),k=m.length-F;for(let[T,E]of S){let w=i.includes(T),f=E===0&&!w,C=document.createElement("label");C.className="xtal-facet-label",f&&C.classList.add("xtal-facet-disabled");let L=document.createElement("input");L.type="checkbox",L.className="xtal-facet-checkbox",L.checked=w,f&&(L.disabled=!0),L.addEventListener("change",()=>this.onFacetToggle(o,T));let I=document.createElement("span");I.className="xtal-facet-text",I.textContent=Z(T);let P=document.createElement("span");P.className="xtal-facet-count",P.textContent=String(E),C.appendChild(L),C.appendChild(I),C.appendChild(P),c.appendChild(C)}if(k>0){let T=document.createElement("button");T.className="xtal-show-more",T.textContent=v?"Show less":`Show ${k} more`,T.addEventListener("click",()=>{this.showMore[b]=!this.showMore[b];let E=T.parentElement;if(!E)return;let w=this.buildFacetList(o,h,i,s);E.replaceWith(w)}),c.appendChild(T)}return c});a.appendChild(y)}return a}buildFacetList(e,n,t,s){let a=document.createElement("div");a.className="xtal-facet-list";let l=`${s}-${e}`,d=Object.entries(n).sort((i,p)=>p[1]-i[1]),u=this.showMore[l],o=u||d.length<=F?d:d.slice(0,F),h=d.length-F;for(let[i,p]of o){let y=t.includes(i),c=p===0&&!y,m=document.createElement("label");m.className="xtal-facet-label",c&&m.classList.add("xtal-facet-disabled");let b=document.createElement("input");b.type="checkbox",b.className="xtal-facet-checkbox",b.checked=y,c&&(b.disabled=!0),b.addEventListener("change",()=>this.onFacetToggle(e,i));let v=document.createElement("span");v.className="xtal-facet-text",v.textContent=Z(i);let S=document.createElement("span");S.className="xtal-facet-count",S.textContent=String(p),m.appendChild(b),m.appendChild(v),m.appendChild(S),a.appendChild(m)}if(h>0){let i=document.createElement("button");i.className="xtal-show-more",i.textContent=u?"Show less":`Show ${h} more`,i.addEventListener("click",()=>{this.showMore[l]=!this.showMore[l];let p=this.buildFacetList(e,n,t,s);a.replaceWith(p)}),a.appendChild(i)}return a}buildCollapsibleSection(e,n,t,s,a,l){let d=document.createElement("div");d.className="xtal-filter-section";let u=s||this.expandedSections.has(e),o=document.createElement("button");o.className="xtal-section-header";let h=document.createElement("span");if(h.className="xtal-section-label",h.textContent=n,t>0){let y=document.createElement("span");y.className="xtal-section-badge",y.textContent=String(t),h.appendChild(y)}let i=document.createElement("span");i.className="xtal-section-chevron",i.textContent=u?"\u25BE":"\u25B8",o.appendChild(h),o.appendChild(i),o.addEventListener("click",()=>{this.expandedSections.has(e)?this.expandedSections.delete(e):this.expandedSections.add(e);let y=d.querySelector(".xtal-section-content");y&&(y.style.display=y.style.display==="none"?"":"none",i.textContent=y.style.display==="none"?"\u25B8":"\u25BE")}),d.appendChild(o);let p=document.createElement("div");return p.className="xtal-section-content",u||(p.style.display="none"),p.appendChild(l()),d.appendChild(p),d}resetState(){this.showMore={}}openDrawer(){this.drawerOpen=!0,this.savedBodyOverflow=document.body.style.overflow,document.body.style.overflow="hidden",this.backdropEl.classList.add("xtal-backdrop-open"),this.drawerEl.classList.add("xtal-drawer-open")}closeDrawer(){this.drawerOpen=!1,document.body.style.overflow=this.savedBodyOverflow,this.backdropEl.classList.remove("xtal-backdrop-open"),this.drawerEl.classList.remove("xtal-drawer-open")}destroy(){this.drawerOpen&&this.closeDrawer(),this.railEl.remove(),this.fabEl.remove(),this.backdropEl.remove(),this.drawerEl.remove()}};function N(r,e){try{let n=new URL(r);return n.searchParams.set("utm_source","xtal"),n.searchParams.set("utm_medium","search"),n.searchParams.set("utm_campaign",e.shopId),n.searchParams.set("utm_content",e.productId),n.searchParams.set("utm_term",e.query),n.toString()}catch{return r}}function Te(r,e){let n=Array.isArray(r.price)?r.price[0]??0:r.price,t=r.variants?.[0]?.compare_at_price,s={id:r.id??"",title:r.title??"",vendor:r.vendor??"",product_type:r.product_type??"",price:n.toFixed(2),image_url:r.image_url||r.featured_image||r.images?.[0]?.src||"",product_url:e||r.product_url||"",available:r.available?"true":"",description:r.description??""};t&&t>n&&(s.compare_at_price=t.toFixed(2));let a=r.variants?.[0];if(a&&(a.sku&&(s.sku=a.sku),a.title&&(s.variant_title=a.title)),r.tags?.length){s.tags=r.tags.join(", ");for(let l of r.tags){let d=l.indexOf(":");if(d>0){let u=l.slice(0,d).trim().toLowerCase().replace(/\s+/g,"_"),o=l.slice(d+1).trim();u&&o&&!(u in s)&&(s[u]=o)}}}return s}function Le(r,e){let n=r.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,s,a)=>e[s]?a:"");return n=n.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,s,a)=>e[s]?"":a),n}function ke(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Me(r){let e=r.replace(/<script\b[\s\S]*?<\/script>/gi,"");return e=e.replace(/<iframe\b[\s\S]*?<\/iframe>/gi,""),e=e.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,""),e=e.replace(/(href|src|action)\s*=\s*"(?:javascript|data):[^"]*"/gi,'$1=""'),e=e.replace(/(href|src|action)\s*=\s*'(?:javascript|data):[^']*'/gi,"$1=''"),e=e.replace(/(href|src|action)\s*=\s*(?:javascript|data):[^\s>]*/gi,'$1=""'),e}function _e(r,e){return r.replace(/\{\{(\w+)\}\}/g,(n,t)=>ke(e[t]??""))}function Pe(r){let e=document.createElement("div");return e.innerHTML=Me(r.trim()),e.firstElementChild||e}function W(r,e,n,t,s,a,l){let d=Te(e,l),u=Le(r,d);u=_e(u,d);let o=Pe(u),h=N(l||e.product_url||"#",{shopId:t,productId:e.id,query:n});return o.querySelectorAll('[data-xtal-action="view-product"]').forEach(i=>{i.tagName==="A"?(i.href=h,i.target="_blank",i.rel="noopener noreferrer"):(i.style.cursor="pointer",i.addEventListener("click",p=>{p.preventDefault(),s.onViewProduct(e)}))}),o.querySelectorAll('[data-xtal-action="add-to-cart"]').forEach(i=>{a==="fallback"&&(i.textContent="View Product"),i.addEventListener("click",async p=>{p.preventDefault(),p.stopPropagation();let y=i.textContent;i.textContent="Adding...",i.style.opacity="0.7",i.style.pointerEvents="none";try{await s.onAddToCart(e)}finally{i.textContent=y,i.style.opacity="",i.style.pointerEvents=""}})}),o.style.cursor="pointer",o.addEventListener("click",i=>{i.target.closest('a, button, [data-xtal-action="add-to-cart"]')||s.onViewProduct(e)}),o}function He(r){if(Array.isArray(r)){let e=[...r].sort((n,t)=>n-t);return e.length===0?"N/A":e.length===1||e[0]===e[e.length-1]?`$${e[0].toFixed(2)}`:`$${e[0].toFixed(2)} \u2013 $${e[e.length-1].toFixed(2)}`}return`$${r.toFixed(2)}`}function de(r,e,n,t,s,a){if(t&&s)return W(t.html,r,e,n,s);let l=r.image_url||r.featured_image||r.images&&r.images[0]?.src,d=document.createElement("a");d.className="xtal-card",d.href=N(a||r.product_url||"#",{shopId:n,productId:r.id,query:e}),d.target="_blank",d.rel="noopener noreferrer";let u=document.createElement("div");if(u.className="xtal-card-image",l){let p=document.createElement("img");p.src=l,p.alt=r.title,p.loading="lazy",u.appendChild(p)}else{let p=document.createElement("span");p.className="xtal-card-image-placeholder",p.textContent="No image",u.appendChild(p)}d.appendChild(u);let o=document.createElement("div");if(o.className="xtal-card-body",r.vendor){let p=document.createElement("div");p.className="xtal-card-vendor",p.textContent=r.vendor,o.appendChild(p)}let h=document.createElement("div");h.className="xtal-card-title",h.textContent=r.title,o.appendChild(h);let i=document.createElement("div");return i.className="xtal-card-price",i.textContent=He(r.price),o.appendChild(i),d.appendChild(o),d}function pe(r,e,n){let t=null,s=null,a=null,l="seeking";function d(m){let b=[],v=()=>{let E=m.value.trim();E.length>=1&&e(E)},S=m.closest("form");if(S){let E=w=>{w.preventDefault(),w.stopImmediatePropagation(),v()};S.addEventListener("submit",E,!0),b.push(()=>S.removeEventListener("submit",E,!0))}let k=E=>{E.key==="Enter"&&(E.preventDefault(),E.stopImmediatePropagation(),v())};if(m.addEventListener("keydown",k,!0),b.push(()=>m.removeEventListener("keydown",k,!0)),window.matchMedia("(max-width: 767px)").matches){(parseFloat(getComputedStyle(m).fontSize)||0)<16&&(m.style.fontSize="16px"),m.style.touchAction="manipulation",m.style.maxWidth="100%",m.style.boxSizing="border-box";let w=document.createElement("button");w.type="button",w.className="xtal-mobile-search-btn",w.setAttribute("aria-label","Search"),w.style.cssText="position:absolute;right:4px;top:50%;transform:translateY(-50%);width:34px;height:34px;border:none;border-radius:50%;background:#333;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:1;padding:0;flex-shrink:0;",w.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/></svg>',w.addEventListener("click",C=>{C.preventDefault(),v()}),m.style.paddingRight="42px";let f=m.parentElement;if(f){let C=f.querySelector('button[type="submit"], input[type="submit"]');C&&(C.style.display="none",b.push(()=>{C.style.display=""})),getComputedStyle(f).position==="static"&&(f.style.position="relative"),f.appendChild(w),b.push(()=>w.remove())}}return()=>b.forEach(E=>E())}function u(){o();let m=b=>{if(b.key!=="Enter")return;let v=b.target;if(!v.matches?.(r))return;b.preventDefault();let S=v.value.trim();S.length>=1&&e(S)};document.body.addEventListener("keydown",m,!0),a=()=>document.body.removeEventListener("keydown",m,!0)}function o(){a?.(),a=null}function h(){let m=document.querySelector(r);return!m||m===t?!1:(s?.(),s=d(m),t=m,l="guarding",o(),!0)}function i(m){if(t){for(let b of m)for(let v of Array.from(b.removedNodes))if(v===t||v instanceof HTMLElement&&v.contains(t)){s?.(),s=null,t=null,l="seeking",u();return}}}h();let p=new MutationObserver(m=>{l==="guarding"&&i(m),l==="seeking"&&h()});p.observe(document.body,{childList:!0,subtree:!0});let y=n??1e4,c=setTimeout(()=>{l==="seeking"&&!t&&(p.disconnect(),o(),console.warn(`[xtal.js] Could not find input matching "${r}" after ${y/1e3}s`))},y);return()=>{clearTimeout(c),p.disconnect(),s?.(),o(),t=null}}function Ne(r){return typeof r=="string"&&r.includes("/")?r.split("/").pop():r}var J=class{constructor(){this.name="shopify"}async addToCart(e,n=1){let t=e.variants?.[0]?.id;if(!t)return{success:!1,message:"No variant available"};if(!e.available)return{success:!1,message:"Product unavailable"};let s=Ne(t);try{let a=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:s,quantity:n})});return a.ok?{success:!0,message:"Added to cart"}:a.status===422?{success:!1,message:(await a.json().catch(()=>({}))).description||"Could not add to cart"}:{success:!1,message:`Cart error (${a.status})`}}catch(a){return{success:!1,message:a instanceof Error?a.message:"Network error"}}}};var G=class{constructor(e,n,t){this.name="fallback";this.shopId=e,this.queryFn=n,this.resolveUrl=t}async addToCart(e){let n=this.resolveUrl?.(e)??e.product_url??"#",t=N(n,{shopId:this.shopId,productId:e.id,query:this.queryFn()});return window.open(t,"_blank","noopener,noreferrer"),{success:!0,message:"Opening product page..."}}};function me(r,e,n){return window.Shopify?new J:new G(r,e,n)}function he(){if(!document.getElementById("xtal-showcase-styles")){let r=document.createElement("style");r.id="xtal-showcase-styles",r.textContent=$e,document.head.appendChild(r)}}function ge(r,e,n){he();let t=document.createElement("div");t.className="xtal-showcase";let s=document.createElement("div");s.className="xtal-showcase-header",s.innerHTML=`SKU <strong>"${ee(r)}"</strong> not found`,t.appendChild(s);let a=document.createElement("div");a.className="xtal-showcase-grid";for(let l of e){let d=Ie(l,n);a.appendChild(d)}return t.appendChild(a),t}function Ie(r,e){let n=document.createElement("div");n.className="xtal-showcase-card",n.addEventListener("click",()=>e(r.query));let t=document.createElement("div");t.className="xtal-showcase-label",t.innerHTML=`<span>${ee(r.label)}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,n.appendChild(t);let s=document.createElement("p");s.className="xtal-showcase-query",s.textContent=`\u201C${r.query}\u201D`,n.appendChild(s);let[a,...l]=r.products;if(a){let d=document.createElement("div");d.className="xtal-showcase-hero";let u=document.createElement("img");u.src=ue(a),u.alt=a.title,u.loading="lazy",d.appendChild(u),n.appendChild(d)}if(l.length>0){let d=document.createElement("div");d.className="xtal-showcase-thumbs";for(let u of l){let o=document.createElement("div");o.className="xtal-showcase-thumb";let h=document.createElement("img");h.src=ue(u),h.alt=u.title,h.loading="lazy",o.appendChild(h),d.appendChild(o)}n.appendChild(d)}return n}function fe(r){he();let e=document.createElement("div");e.className="xtal-showcase";let n=document.createElement("div");n.className="xtal-showcase-header",n.innerHTML=`SKU <strong>"${ee(r)}"</strong> not found`,e.appendChild(n);let t=document.createElement("div");t.className="xtal-showcase-grid";for(let s=0;s<3;s++){let a=document.createElement("div");a.className="xtal-showcase-card xtal-showcase-skeleton",a.innerHTML=`
      <div class="xtal-showcase-label"><span>&nbsp;</span></div>
      <p class="xtal-showcase-query">&nbsp;</p>
      <div class="xtal-showcase-hero xtal-shimmer"></div>
      <div class="xtal-showcase-thumbs">
        <div class="xtal-showcase-thumb xtal-shimmer"></div>
        <div class="xtal-showcase-thumb xtal-shimmer"></div>
        <div class="xtal-showcase-thumb xtal-shimmer"></div>
      </div>
    `,t.appendChild(a)}return e.appendChild(t),e}function ue(r){return r.image_url||r.featured_image||r.images?.[0]?.src||""}function ee(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var $e=`
  .xtal-showcase {
    padding: 32px 20px 24px;
    font-family: var(--xtal-font, inherit);
  }
  .xtal-showcase-header {
    text-align: center;
    font-size: 14px;
    color: var(--xtal-text-muted, #64748b);
    margin-bottom: 24px;
  }
  .xtal-showcase-header strong {
    color: var(--xtal-text, #1a1a1a);
    font-weight: 600;
  }
  .xtal-showcase-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .xtal-showcase-card {
    padding: 16px;
    border-radius: 8px;
    border: 1px solid var(--xtal-border, #e2e8f0);
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .xtal-showcase-card:hover {
    border-color: var(--xtal-accent, #4f46e5);
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .xtal-showcase-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--xtal-text-muted, #64748b);
    margin-bottom: 4px;
  }
  .xtal-showcase-query {
    font-size: 14px;
    font-weight: 600;
    color: var(--xtal-text, #1a1a1a);
    line-height: 1.4;
    margin: 0 0 12px;
  }
  .xtal-showcase-hero {
    aspect-ratio: 4/3;
    border-radius: 6px;
    overflow: hidden;
    background: #f8fafc;
  }
  .xtal-showcase-hero img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .xtal-showcase-thumbs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 8px;
  }
  .xtal-showcase-thumb {
    aspect-ratio: 1;
    border-radius: 4px;
    overflow: hidden;
    background: #f8fafc;
  }
  .xtal-showcase-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .xtal-shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: xtal-shimmer 1.5s ease-in-out infinite;
  }
  @keyframes xtal-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .xtal-showcase-skeleton .xtal-showcase-label span,
  .xtal-showcase-skeleton .xtal-showcase-query {
    background: #f0f0f0;
    border-radius: 4px;
    color: transparent;
  }
  @media (max-width: 768px) {
    .xtal-showcase-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }
`;function te(r){return`xtal-showcase-${r}`}function Ae(r){try{let e=localStorage.getItem(te(r));if(!e)return null;let n=JSON.parse(e);return Date.now()-n.ts>36e5?(localStorage.removeItem(te(r)),null):n.rows}catch{return null}}function Fe(r,e){try{let n={rows:e,ts:Date.now()};localStorage.setItem(te(r),JSON.stringify(n))}catch{}}async function xe(r,e,n){let t=Ae(e);if(t)return t;let a=(await Promise.allSettled(r.map(async l=>{let d=await n.searchShowcase(l.query,4);return{query:l.query,label:l.label,products:d.results.slice(0,4)}}))).filter(l=>l.status==="fulfilled"&&l.value.products.length>0).map(l=>l.value);return a.length>0&&Fe(e,a),a}var be=new Set(["body","html","head","*"]);function Re(r,e){return r.replace(/\/\*[\s\S]*?\*\//g,"").replace(/([^{}@][^{}]*)\{([^{}]*)\}/g,(t,s,a)=>{let l=s.trim();if(!l||/^(from|to|\d[\d.]*%)/.test(l))return t;let d=l.split(",").map(u=>{let o=u.trim();return o?`${e} ${o}`:""}).filter(Boolean).join(", ");return d?`${d} { ${a} }`:t})}function ne(r,e,n,t){try{let s=`${r}/api/xtal/events`,a=JSON.stringify({action:"error",collection:e,error:n,context:t,ts:Date.now()});navigator.sendBeacon?.(s,a)||fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:a,keepalive:!0}).catch(()=>{})}catch{}}function je(){if(document.getElementById("xtal-filter-styles"))return;let r=document.createElement("style");r.id="xtal-filter-styles",r.textContent=`
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
`,document.head.appendChild(r)}function Be(){return/[?&](Search|search)=/.test(window.location.search)}function Oe(r){if(document.getElementById("xtal-sdk-early-hide"))return;let e=document.createElement("style");e.id="xtal-sdk-early-hide",e.textContent=`${r} { visibility: hidden !important; min-height: calc(100vh - 160px); }`,document.head.appendChild(e)}function ye(){if(window.__XTAL_BOOTED){console.log("[xtal.js] Already booted \u2014 skipping duplicate init");return}window.__XTAL_BOOTED=!0;try{let r=document.querySelector("script[data-shop-id]"),e=window.XTAL_CONFIG,n=r?.getAttribute("data-shop-id")||e?.shopId||"";if(!n){console.warn("[xtal.js] No shopId found \u2014 need <script data-shop-id> or window.XTAL_CONFIG = { shopId: '...' }");return}let t="",s=r?.getAttribute("src");if(s)try{t=new URL(s,window.location.href).origin}catch{}t||(t=e?.apiBase||"https://www.xtalsearch.com");let a=new Q(t,n),l=3e5,d=864e5,u=`xtal:config:${n}`,o=null,h=null;try{let c=localStorage.getItem(u);if(c){let m=JSON.parse(c),b=Date.now()-m.ts;b<l?o=m.config:b<d&&m.config.resultsSelector&&(h=m.config.resultsSelector)}}catch{}if(window.__XTAL_LOADING=!0,Be()){let c=o?.resultsSelector||h||e?.resultsSelector;c&&!be.has(c.trim().toLowerCase())&&(Oe(c),setTimeout(()=>{let m=document.getElementById("xtal-sdk-early-hide");m&&(console.warn("[xtal.js] Failsafe: removing early-hide after 15s timeout"),m.remove())},15e3))}let i=c=>{try{localStorage.setItem(u,JSON.stringify({config:c,ts:Date.now()}))}catch{}},p=c=>{if(!c.enabled){console.log(`[xtal.js] Snippet disabled for ${n}`);return}let m=c.cardTemplate??null;if(m?.css){let w=document.getElementById("xtal-card-styles");w&&w.remove();let f=document.createElement("style");f.id="xtal-card-styles",f.textContent=Re(m.css,".xtal-layout"),document.head.appendChild(f)}function b(w){if(c.productUrlPattern){let C=w.variants?.[0]?.sku||"";if(C){let L=c.productUrlPattern.replace("{sku}",encodeURIComponent(C)).replace("{id}",w.id||"");if(!/^javascript:/i.test(L)&&!/^data:/i.test(L))return L}}let f=w.product_url||"#";return!f||f==="#"?"#":f.startsWith("http://")||f.startsWith("https://")?f:c.siteUrl?c.siteUrl.replace(/\/$/,"")+f:f}let v="",S=me(n,()=>v,b);console.log(`[xtal.js] Cart adapter: ${S.name}`);let k=c.resultsSelector??"",T=!!k&&!be.has(k.trim().toLowerCase());if(!(c.displayMode==="inline"&&T)){!T&&k&&console.warn(`[xtal.js] resultsSelector "${k}" is blocked \u2014 SDK disabled`),window.XTAL={destroy(){let w=document.getElementById("xtal-card-styles");w&&w.remove(),window.XTAL=void 0}};return}{let w=document.querySelector(k),f=w?new z(w):null,C=null,L=()=>f||(w=document.querySelector(k),w&&(f=new z(w)),f),I=c.features?.filters===!0,P=null,M={},A=null,H=null,D=0,U={},R=null;I&&je();let we=()=>{if(H||!I||!f)return;let g=f.initLayout();H=new K(g,(x,_)=>{M[x]||(M[x]=[]);let O=M[x].indexOf(_);O>=0?(M[x].splice(O,1),M[x].length===0&&delete M[x]):M[x].push(_),V()},x=>{A=x,V()},()=>{M={},A=null,V()},c.pricePresets,c.hiddenFacets)},re={onViewProduct(g){let x=N(b(g),{shopId:n,productId:g.id,query:v});window.open(x,"_blank","noopener,noreferrer"),fetch(`${t}/api/xtal/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:g.id,product_title:g.title,action:"product_click",collection:n,query:v})}).catch(()=>{})},async onAddToCart(g){let x=await S.addToCart(g);if(console.log(`[xtal.js] Add to cart: ${x.success?"OK":"FAIL"} \u2014 ${x.message}`),x.success){let _=S.name==="fallback"?"product_click":"add_to_cart";fetch(`${t}/api/xtal/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:g.id,product_title:g.title,action:_,collection:n,query:v})}).catch(()=>{})}}},ae=g=>g.map(x=>m?W(m.html,x,v,n,re,S.name,b(x)):de(x,v,n,null,re,b(x))),V=()=>{!P||!f||(R&&clearTimeout(R),R=setTimeout(()=>{f?.showFilterLoading(),a.searchFiltered(v,P,{facetFilters:M,priceRange:A,limit:c.resultsPerPage??24}).then(g=>{D=g.total,U=g.computed_facets||{},g.results.length===0?f?.renderEmpty(v):f?.renderCards(ae(g.results)),H?.update(U,M,A,D)}).catch(g=>{g instanceof DOMException&&g.name==="AbortError"||(console.error("[xtal.js] Filter error:",g),ne(t,n,String(g),"filter"))})},350))},X=c.siteUrl&&(c.siteUrl.startsWith("https://")||c.siteUrl.startsWith("http://"))?c.siteUrl.replace(/\/$/,""):"",ie=c.searchPagePath||"/shop/",j=c.searchQueryParam||"Search",q=g=>{if(v=g,!L()){let _=new RegExp(`[?&]${j}=`,"i").test(window.location.search);X&&!_&&(console.log("[xtal.js] No results container \u2014 navigating to search page"),window.location.href=`${X}${ie}?${j}=${encodeURIComponent(g)}`);return}P=null,M={},A=null,H?.closeDrawer(),H?.resetState(),f.showLoading(g),a.searchFull(g,c.resultsPerPage??24).then(x=>{D=x.total,U=x.computed_facets||{},P=x.search_context||null,we();let _=document.querySelector(Y);if(_&&_.value!==g&&(_.value=g),x.is_sku_search&&!x.sku_found&&c.showcaseQueries?.length){H?.update({},{},null,0),f?.renderCustom(fe(g)),xe(c.showcaseQueries,n,a).then(O=>{O.length>0?f?.renderCustom(ge(g,O,q)):f?.renderEmpty(g)}).catch(()=>{f?.renderEmpty(g)});return}if(x.results.length===0){f?.renderEmpty(g),H?.update({},{},null,0);return}f?.renderCards(ae(x.results)),H?.update(U,M,A,D)}).catch(x=>{x instanceof DOMException&&x.name==="AbortError"||(console.error("[xtal.js] Search error:",x),ne(t,n,String(x),"search"),f?.restore(),X&&v&&(window.location.href=`${X}${ie}?${j}=${encodeURIComponent(v)}`))})},B=null,se=g=>{B&&clearTimeout(B),B=setTimeout(()=>q(g),200)},Y=c.searchSelector||'input[type="search"]';C=pe(Y,se,c.observerTimeoutMs);let $=null;w||(console.log(`[xtal.js] Inline mode: "${k}" not found \u2014 watching`),$=new MutationObserver(()=>{L()&&($?.disconnect(),$=null,v&&!P&&q(v))}),$.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{$?.disconnect(),$=null},c.observerTimeoutMs??1e4));let oe=new URLSearchParams(window.location.search),le=oe.get(j)||oe.get(j.toLowerCase());le?.trim()&&q(le.trim()),window.XTAL={search(g){g?.trim()&&se(g.trim())},destroy(){B&&clearTimeout(B),R&&clearTimeout(R),a.abort(),C?.(),$?.disconnect(),H?.destroy(),f?.destroy();let g=document.getElementById("xtal-card-styles");g&&g.remove();let x=document.getElementById("xtal-filter-styles");x&&x.remove(),window.XTAL=void 0}},console.log(`[xtal.js] Initialized INLINE for ${n}. Search: ${Y}, Grid: ${c.resultsSelector}${w?"":" (deferred)"}${I?", Filters: ON":""}`)}window.__XTAL_LOADING=!1},y=!1;o?(p(o),y=!0,a.fetchConfig().then(i).catch(()=>{})):a.fetchConfig().then(c=>{i(c),y||p(c)}).catch(c=>{console.error("[xtal.js] Failed to fetch config:",c),ne(t,n,String(c),"config"),window.__XTAL_LOADING=!1})}catch(r){console.error("[xtal.js] Boot error:",r)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",ye):ye();})();
