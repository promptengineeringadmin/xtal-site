"use strict";var XTAL=(()=>{var K=class{constructor(e,n){this.controller=null;this.apiBase=e,this.shopId=n}abort(){this.controller&&(this.controller.abort(),this.controller=null)}async fetchConfig(){let e=new AbortController,n=setTimeout(()=>e.abort(),5e3);try{let t=await fetch(`${this.apiBase}/api/xtal/config?shopId=${encodeURIComponent(this.shopId)}`,{mode:"cors",signal:e.signal});if(!t.ok)throw new Error(`Config fetch failed: ${t.status}`);return t.json()}finally{clearTimeout(n)}}async searchFull(e,n=16,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=await fetch(`${this.apiBase}/api/xtal/search-full`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,limit:n,selected_aspects:t}),signal:this.controller.signal});if(!o.ok)throw new Error(`Search failed: ${o.status}`);return o.json()}async searchShowcase(e,n=4){let t=await fetch(`${this.apiBase}/api/xtal/search-full`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,limit:n,_showcase:!0})});if(!t.ok)throw new Error(`Showcase search failed: ${t.status}`);return t.json()}async searchFiltered(e,n,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=t?.facetFilters&&Object.values(t.facetFilters).some(h=>h.length>0),i=t?.priceRange?{min:t.priceRange.min,max:t.priceRange.max}:void 0,l=await fetch(`${this.apiBase}/api/xtal/search`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,search_context:n,limit:t?.limit??24,...o?{facet_filters:t.facetFilters}:{},...i?{price_range:i}:{}}),signal:this.controller.signal});if(!l.ok)throw new Error(`Filter search failed: ${l.status}`);return l.json()}};var D=class{constructor(e){this.originalHTML=null;this.originalDisplay="";this.layoutEl=null;this.railSlot=null;this.gridSlot=null;this.firstSearchDone=!1;this.loadingPhraseTimer=null;this.target=e}captureOriginal(){if(this.originalHTML===null){this.originalHTML=this.target.innerHTML,this.originalDisplay=this.target.style.display,this.target.style.display="block",this.target.style.width="100%";let e=document.getElementById("xtal-early-hide");e&&e.remove();let n=document.getElementById("xtal-sdk-early-hide");n&&n.remove();let t=document.getElementById("xtal-search-loading");t&&t.remove()}}initLayout(){return this.layoutEl?this.railSlot:(this.captureOriginal(),this.target.innerHTML="",this.layoutEl=document.createElement("div"),this.layoutEl.className="xtal-layout",this.railSlot=document.createElement("div"),this.railSlot.className="xtal-rail-slot",this.gridSlot=document.createElement("div"),this.gridSlot.className="xtal-grid-slot",this.layoutEl.appendChild(this.railSlot),this.layoutEl.appendChild(this.gridSlot),this.target.appendChild(this.layoutEl),this.railSlot)}showLoading(e){this.captureOriginal(),this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null);let n=this.gridSlot||this.target;if(n.innerHTML="",!document.getElementById("xtal-inline-keyframes")){let u=document.createElement("style");u.id="xtal-inline-keyframes",u.textContent=["@keyframes xtal-inline-spin{to{transform:rotate(360deg)}}","@keyframes xtal-pulse{0%,100%{opacity:1}50%{opacity:0.4}}"].join(""),document.head.appendChild(u)}let t=this.target.getBoundingClientRect(),o=Math.max(200,window.innerHeight-t.top),i=document.createElement("div");i.style.cssText=`display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:60px 20px 48px;width:100%;min-height:${o}px;`,i.setAttribute("role","status"),i.setAttribute("aria-live","polite");let l=document.createElement("div");l.style.cssText="position:relative;width:48px;height:48px;margin-bottom:12px;";let h=document.createElement("div");h.style.cssText="position:absolute;inset:0;border:3px solid #e5e5e5;border-radius:50%;";let m=document.createElement("div");m.style.cssText="position:absolute;inset:0;border:3px solid transparent;border-top-color:#1d1d1b;border-radius:50%;animation:xtal-inline-spin .8s linear infinite;";let s=document.createElement("div");s.style.cssText="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;",s.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:xtal-pulse 2s ease-in-out infinite"><path d="M12 3l1.91 5.49L19.4 10.4l-5.49 1.91L12 17.8l-1.91-5.49L4.6 10.4l5.49-1.91z"/><path d="M19 2l.5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5z"/><path d="M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5z"/></svg>',l.appendChild(h),l.appendChild(m),l.appendChild(s);let p=["While we gather your results, here\u2019s how XTAL works","XTAL understands full phrases, not just keywords","For really effective results, try searching the way you\u2019d ask a friend","Know the right SKU or product name? That works too","Finding your results\u2026"],c=document.createElement("p");if(c.style.cssText="margin:0 0 16px 0;font-size:13px;line-height:1.5;color:#767676;text-align:center;transition:opacity 0.3s;min-height:2.6em;display:flex;align-items:center;justify-content:center;",c.textContent=p[0],i.appendChild(c),i.appendChild(l),e){let u=e.length>80?e.slice(0,77)+"\u2026":e,C=document.createElement("p");C.style.cssText="margin:0 0 8px 0;font-size:14px;color:#555;font-style:italic;text-align:center;max-width:320px;",C.textContent=`"${u}"`,i.appendChild(C)}let d=this.firstSearchDone?1+Math.floor(Math.random()*(p.length-1)):0;this.firstSearchDone=!0,c.textContent=p[d],this.loadingPhraseTimer=setInterval(()=>{c.style.opacity="0",setTimeout(()=>{d=(d+1)%p.length,c.textContent=p[d],c.style.opacity="1"},400)},2500),n.appendChild(i)}clearPhraseTimer(){this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null)}showFilterLoading(){let e=this.gridSlot||this.target,n=e.querySelector(".xtal-grid");if(n&&(n.style.opacity="0.5",n.style.pointerEvents="none",n.style.transition="opacity 0.15s"),!e.querySelector(".xtal-filter-spinner")){let t=document.createElement("div");t.className="xtal-filter-spinner",t.style.cssText="position:absolute;top:20px;left:50%;transform:translateX(-50%);z-index:10;width:32px;height:32px;border:3px solid #e5e5e5;border-top-color:#1d1d1b;border-radius:50%;animation:xtal-inline-spin .8s linear infinite;",getComputedStyle(e).position==="static"&&(e.style.position="relative"),e.appendChild(t)}}clearFilterLoading(){let e=this.gridSlot||this.target,n=e.querySelector(".xtal-grid");n&&(n.style.opacity="",n.style.pointerEvents="",n.style.transition="");let t=e.querySelector(".xtal-filter-spinner");t&&t.remove()}renderCards(e){this.clearPhraseTimer(),this.clearFilterLoading();let n=this.gridSlot||this.target;n.innerHTML="";let t=document.createElement("div");t.className="xtal-grid";for(let o of e)t.appendChild(o);n.appendChild(t)}renderCustom(e){this.clearPhraseTimer(),this.clearFilterLoading();let n=this.gridSlot||this.target;n.innerHTML="",n.appendChild(e)}renderEmpty(e){this.clearPhraseTimer(),this.clearFilterLoading();let n=this.gridSlot||this.target;n.innerHTML="";let t=document.createElement("div");t.style.cssText="text-align:center;padding:60px 20px;color:#888;font-size:14px;",t.textContent=`No results found for "${e}"`,n.appendChild(t)}restore(){this.layoutEl=null,this.railSlot=null,this.gridSlot=null;let e=document.getElementById("xtal-early-hide");e&&e.remove();let n=document.getElementById("xtal-sdk-early-hide");n&&n.remove();let t=document.getElementById("xtal-search-loading");t&&t.remove(),this.originalHTML!==null&&(this.target.innerHTML=this.originalHTML,this.target.style.display=this.originalDisplay,this.target.style.width="",this.originalHTML=null)}destroy(){this.clearPhraseTimer(),this.restore();let e=document.getElementById("xtal-inline-keyframes");e&&e.remove()}};var Ee={"product-subcategory":"Category",brand:"Brand",vendor:"Vendor","product-age":"Age",proof:"Proof",region:"Region",size:"Size",terpene:"Terpene",effect:"Effect","strain-type":"Strain Type",format:"Format",material:"Material",shape:"Shape","use-case":"Use Case",feature:"Feature",design:"Design",style:"Style",color:"Color"},Ce=["product-subcategory","brand","vendor","strain-type","terpene","effect","format","material","use-case","style"],F=5,Se=[{label:"Under $25",max:25},{label:"$25\u2013$50",min:25,max:50},{label:"$50\u2013$100",min:50,max:100},{label:"$100\u2013$200",min:100,max:200},{label:"$200+",min:200}];function ee(r){return r.split(/[-_]/).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function Te(r){return Ee[r]||r.split("-").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function pe(r,e){return r?r.min===e.min&&r.max===e.max:!1}var W=class{constructor(e,n,t,o,i,l){this.expandedSections=new Set(["price"].concat(Ce));this.showMore={};this.drawerOpen=!1;this.savedBodyOverflow="";this.container=e,this.onFacetToggle=n,this.onPriceChange=t,this.onClearAll=o,this.pricePresets=i||Se,this.hiddenFacets=new Set(l||[]),this.railEl=document.createElement("aside"),this.railEl.className="xtal-filter-rail",e.appendChild(this.railEl),this.fabEl=document.createElement("button"),this.fabEl.className="xtal-filter-fab",this.fabEl.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg><span class="xtal-fab-text">Filters</span>',this.fabEl.addEventListener("click",()=>this.openDrawer()),document.body.appendChild(this.fabEl),this.backdropEl=document.createElement("div"),this.backdropEl.className="xtal-backdrop",this.backdropEl.addEventListener("click",()=>this.closeDrawer()),document.body.appendChild(this.backdropEl),this.drawerEl=document.createElement("div"),this.drawerEl.className="xtal-filter-drawer";let h=document.createElement("div");h.className="xtal-drawer-header",h.innerHTML='<span class="xtal-drawer-title">Filters</span>';let m=document.createElement("button");m.className="xtal-drawer-close",m.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',m.setAttribute("aria-label","Close filters"),m.addEventListener("click",()=>this.closeDrawer()),h.appendChild(m),this.drawerEl.appendChild(h),this.drawerContentEl=document.createElement("div"),this.drawerContentEl.className="xtal-drawer-content",this.drawerEl.appendChild(this.drawerContentEl);let s=document.createElement("div");s.className="xtal-drawer-footer",this.drawerFooterBtn=document.createElement("button"),this.drawerFooterBtn.className="xtal-drawer-apply",this.drawerFooterBtn.textContent="Show results",this.drawerFooterBtn.addEventListener("click",()=>this.closeDrawer()),s.appendChild(this.drawerFooterBtn),this.drawerEl.appendChild(s),document.body.appendChild(this.drawerEl)}update(e,n,t,o){let i=e&&Object.keys(e).length>0,l=Object.values(n).some(c=>c.length>0)||t!==null;if(this.railEl.style.display=!i&&!l?"none":"",this.fabEl.style.display="",!i&&!l){this.fabEl.classList.add("xtal-fab-hidden");return}else this.fabEl.classList.remove("xtal-fab-hidden");this.railEl.innerHTML="",this.drawerContentEl.innerHTML="";let h=this.buildFilterSections(e,n,t,"desktop"),m=this.buildFilterSections(e,n,t,"mobile");this.railEl.appendChild(h),this.drawerContentEl.appendChild(m);let s=Object.values(n).reduce((c,d)=>c+d.length,0)+(t?1:0),p=this.fabEl.querySelector(".xtal-fab-badge");if(p&&p.remove(),s>0){let c=document.createElement("span");c.className="xtal-fab-badge",c.textContent=String(s),this.fabEl.appendChild(c)}this.drawerFooterBtn.textContent=`Show ${o} result${o!==1?"s":""}`}buildFilterSections(e,n,t,o){let i=document.createDocumentFragment();if(Object.values(n).some(s=>s.length>0)||t!==null){let s=document.createElement("div");s.className="xtal-applied-section";let p=document.createElement("div");p.className="xtal-clear-row";let c=document.createElement("button");c.className="xtal-clear-all",c.textContent="Clear all",c.addEventListener("click",()=>this.onClearAll()),p.appendChild(c),s.appendChild(p);let d=document.createElement("div");d.className="xtal-applied-chips";for(let[u,C]of Object.entries(n))for(let a of C){let x=document.createElement("button");x.className="xtal-chip",x.innerHTML=`${ee(a)} <span class="xtal-chip-x">\xD7</span>`,x.addEventListener("click",()=>this.onFacetToggle(u,a)),d.appendChild(x)}if(t){let u=document.createElement("button");u.className="xtal-chip";let C=t.min&&t.max?`$${t.min}\u2013$${t.max}`:t.max?`Under $${t.max}`:`$${t.min}+`;u.innerHTML=`${C} <span class="xtal-chip-x">\xD7</span>`,u.addEventListener("click",()=>this.onPriceChange(null)),d.appendChild(u)}s.appendChild(d),i.appendChild(s)}let h=this.buildCollapsibleSection("price","Price",0,t!==null,o,()=>{let s=document.createElement("div");s.className="xtal-price-presets";for(let p of this.pricePresets){let c=document.createElement("button");c.className="xtal-price-btn",pe(t,p)&&c.classList.add("xtal-price-btn-active"),c.textContent=p.label,c.addEventListener("click",()=>{pe(t,p)?this.onPriceChange(null):this.onPriceChange({min:p.min,max:p.max})}),s.appendChild(c)}return s});i.appendChild(h);let m=Object.entries(e).filter(([s])=>!this.hiddenFacets.has(s));for(let[s,p]of m){let c=n[s]||[],d=c.length,u=this.buildCollapsibleSection(s,Te(s),d,d>0,o,()=>{let C=document.createElement("div");C.className="xtal-facet-list";let a=Object.entries(p).sort((S,E)=>E[1]-S[1]),x=`${o}-${s}`,v=this.showMore[x],y=v||a.length<=F?a:a.slice(0,F),M=a.length-F;for(let[S,E]of y){let T=c.includes(S),w=E===0&&!T,g=document.createElement("label");g.className="xtal-facet-label",w&&g.classList.add("xtal-facet-disabled");let L=document.createElement("input");L.type="checkbox",L.className="xtal-facet-checkbox",L.checked=T,w&&(L.disabled=!0),L.addEventListener("change",()=>this.onFacetToggle(s,S));let _=document.createElement("span");_.className="xtal-facet-text",_.textContent=ee(S);let I=document.createElement("span");I.className="xtal-facet-count",I.textContent=String(E),g.appendChild(L),g.appendChild(_),g.appendChild(I),C.appendChild(g)}if(M>0){let S=document.createElement("button");S.className="xtal-show-more",S.textContent=v?"Show less":`Show ${M} more`,S.addEventListener("click",()=>{this.showMore[x]=!this.showMore[x];let E=S.parentElement;if(!E)return;let T=this.buildFacetList(s,p,c,o);E.replaceWith(T)}),C.appendChild(S)}return C});i.appendChild(u)}return i}buildFacetList(e,n,t,o){let i=document.createElement("div");i.className="xtal-facet-list";let l=`${o}-${e}`,h=Object.entries(n).sort((c,d)=>d[1]-c[1]),m=this.showMore[l],s=m||h.length<=F?h:h.slice(0,F),p=h.length-F;for(let[c,d]of s){let u=t.includes(c),C=d===0&&!u,a=document.createElement("label");a.className="xtal-facet-label",C&&a.classList.add("xtal-facet-disabled");let x=document.createElement("input");x.type="checkbox",x.className="xtal-facet-checkbox",x.checked=u,C&&(x.disabled=!0),x.addEventListener("change",()=>this.onFacetToggle(e,c));let v=document.createElement("span");v.className="xtal-facet-text",v.textContent=ee(c);let y=document.createElement("span");y.className="xtal-facet-count",y.textContent=String(d),a.appendChild(x),a.appendChild(v),a.appendChild(y),i.appendChild(a)}if(p>0){let c=document.createElement("button");c.className="xtal-show-more",c.textContent=m?"Show less":`Show ${p} more`,c.addEventListener("click",()=>{this.showMore[l]=!this.showMore[l];let d=this.buildFacetList(e,n,t,o);i.replaceWith(d)}),i.appendChild(c)}return i}buildCollapsibleSection(e,n,t,o,i,l){let h=document.createElement("div");h.className="xtal-filter-section";let m=o||this.expandedSections.has(e),s=document.createElement("button");s.className="xtal-section-header";let p=document.createElement("span");if(p.className="xtal-section-label",p.textContent=n,t>0){let u=document.createElement("span");u.className="xtal-section-badge",u.textContent=String(t),p.appendChild(u)}let c=document.createElement("span");c.className="xtal-section-chevron",c.textContent=m?"\u25BE":"\u25B8",s.appendChild(p),s.appendChild(c),s.addEventListener("click",()=>{this.expandedSections.has(e)?this.expandedSections.delete(e):this.expandedSections.add(e);let u=h.querySelector(".xtal-section-content");u&&(u.style.display=u.style.display==="none"?"":"none",c.textContent=u.style.display==="none"?"\u25B8":"\u25BE")}),h.appendChild(s);let d=document.createElement("div");return d.className="xtal-section-content",m||(d.style.display="none"),d.appendChild(l()),h.appendChild(d),h}resetState(){this.showMore={}}openDrawer(){this.drawerOpen=!0,this.savedBodyOverflow=document.body.style.overflow,document.body.style.overflow="hidden",this.backdropEl.classList.add("xtal-backdrop-open"),this.drawerEl.classList.add("xtal-drawer-open")}closeDrawer(){this.drawerOpen=!1,document.body.style.overflow=this.savedBodyOverflow,this.backdropEl.classList.remove("xtal-backdrop-open"),this.drawerEl.classList.remove("xtal-drawer-open")}destroy(){this.drawerOpen&&this.closeDrawer(),this.railEl.remove(),this.fabEl.remove(),this.backdropEl.remove(),this.drawerEl.remove()}};function N(r,e){try{let n=new URL(r);return n.searchParams.set("utm_source","xtal"),n.searchParams.set("utm_medium","search"),n.searchParams.set("utm_campaign",e.shopId),n.searchParams.set("utm_content",e.productId),n.searchParams.set("utm_term",e.query),n.toString()}catch{return r}}function Le(r,e,n=!0){let t=Array.isArray(r.price)?r.price[0]??0:r.price,o=r.variants?.[0]?.compare_at_price,i={id:r.id??"",title:r.title??"",vendor:r.vendor??"",product_type:r.product_type??"",price:t.toFixed(2),image_url:r.image_url||r.featured_image||r.images?.[0]?.src||"",product_url:e||r.product_url||"",available:r.available?"true":"",description:r.description??"",isAuthenticated:n?"true":""};o&&o>t&&(i.compare_at_price=o.toFixed(2));let l=r.variants?.[0];if(l&&(l.sku&&(i.sku=l.sku),l.title&&(i.variant_title=l.title)),r.tags?.length){i.tags=r.tags.join(", ");for(let h of r.tags){let m=h.indexOf(":");if(m>0){let s=h.slice(0,m).trim().toLowerCase().replace(/\s+/g,"_"),p=h.slice(m+1).trim();s&&p&&!(s in i)&&(i[s]=p)}}}return i}function ke(r,e){let n=r.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,i)=>e[o]?i:"");return n=n.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,i)=>e[o]?"":i),n}function Me(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function _e(r){let e=r.replace(/<script\b[\s\S]*?<\/script>/gi,"");return e=e.replace(/<iframe\b[\s\S]*?<\/iframe>/gi,""),e=e.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,""),e=e.replace(/(href|src|action)\s*=\s*"(?:javascript|data):[^"]*"/gi,'$1=""'),e=e.replace(/(href|src|action)\s*=\s*'(?:javascript|data):[^']*'/gi,"$1=''"),e=e.replace(/(href|src|action)\s*=\s*(?:javascript|data):[^\s>]*/gi,'$1=""'),e}function Pe(r,e){return r.replace(/\{\{(\w+)\}\}/g,(n,t)=>Me(e[t]??""))}function He(r){let e=document.createElement("div");return e.innerHTML=_e(r.trim()),e.firstElementChild||e}function J(r,e,n,t,o,i,l,h=!0){let m=Le(e,l,h),s=ke(r,m);s=Pe(s,m);let p=He(s),c=N(l||e.product_url||"#",{shopId:t,productId:e.id,query:n});return p.querySelectorAll('[data-xtal-action="view-product"]').forEach(d=>{d.tagName==="A"?(d.href=c,d.target="_blank",d.rel="noopener noreferrer"):(d.style.cursor="pointer",d.addEventListener("click",u=>{u.preventDefault(),o.onViewProduct(e)}))}),p.querySelectorAll('[data-xtal-action="add-to-cart"]').forEach(d=>{i==="fallback"&&(d.textContent="View Product"),d.addEventListener("click",async u=>{u.preventDefault(),u.stopPropagation();let C=d.textContent;d.textContent="Adding...",d.style.opacity="0.7",d.style.pointerEvents="none";try{await o.onAddToCart(e)}finally{d.textContent=C,d.style.opacity="",d.style.pointerEvents=""}})}),p.style.cursor="pointer",p.addEventListener("click",d=>{d.target.closest('a, button, [data-xtal-action="add-to-cart"]')||o.onViewProduct(e)}),p}function Ne(r){if(Array.isArray(r)){let e=[...r].sort((n,t)=>n-t);return e.length===0?"N/A":e.length===1||e[0]===e[e.length-1]?`$${e[0].toFixed(2)}`:`$${e[0].toFixed(2)} \u2013 $${e[e.length-1].toFixed(2)}`}return`$${r.toFixed(2)}`}function ue(r,e,n,t,o,i,l=!0){if(t&&o)return J(t.html,r,e,n,o);let h=r.image_url||r.featured_image||r.images&&r.images[0]?.src,m=document.createElement("a");m.className="xtal-card",m.href=N(i||r.product_url||"#",{shopId:n,productId:r.id,query:e}),m.target="_blank",m.rel="noopener noreferrer";let s=document.createElement("div");if(s.className="xtal-card-image",h){let u=document.createElement("img");u.src=h,u.alt=r.title,u.loading="lazy",s.appendChild(u)}else{let u=document.createElement("span");u.className="xtal-card-image-placeholder",u.textContent="No image",s.appendChild(u)}m.appendChild(s);let p=document.createElement("div");if(p.className="xtal-card-body",r.vendor){let u=document.createElement("div");u.className="xtal-card-vendor",u.textContent=r.vendor,p.appendChild(u)}let c=document.createElement("div");c.className="xtal-card-title",c.textContent=r.title,p.appendChild(c);let d=document.createElement("div");return d.className="xtal-card-price",l?d.textContent=Ne(r.price):(d.textContent="Log in to see pricing",d.style.fontSize="12px",d.style.color="#888",d.style.fontStyle="italic"),p.appendChild(d),m.appendChild(p),m}function me(r,e,n){let t=null,o=null,i=null,l="seeking";function h(a){let x=[],v=()=>{let E=a.value.trim();E.length>=1&&e(E)},y=a.closest("form");if(y){let E=T=>{T.preventDefault(),T.stopImmediatePropagation(),v()};y.addEventListener("submit",E,!0),x.push(()=>y.removeEventListener("submit",E,!0))}let M=E=>{E.key==="Enter"&&(E.preventDefault(),E.stopImmediatePropagation(),v())};if(a.addEventListener("keydown",M,!0),x.push(()=>a.removeEventListener("keydown",M,!0)),window.matchMedia("(max-width: 767px)").matches){(parseFloat(getComputedStyle(a).fontSize)||0)<16&&(a.style.fontSize="16px"),a.style.touchAction="manipulation",a.style.maxWidth="100%",a.style.boxSizing="border-box";let T=document.createElement("button");T.type="button",T.className="xtal-mobile-search-btn",T.setAttribute("aria-label","Search"),T.style.cssText="position:absolute;right:4px;top:50%;transform:translateY(-50%);width:34px;height:34px;border:none;border-radius:50%;background:#333;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:1;padding:0;flex-shrink:0;",T.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/></svg>',T.addEventListener("click",g=>{g.preventDefault(),v()}),a.style.paddingRight="42px";let w=a.parentElement;if(w){let g=w.querySelector('button[type="submit"], input[type="submit"]');g&&(g.style.display="none",x.push(()=>{g.style.display=""})),getComputedStyle(w).position==="static"&&(w.style.position="relative"),w.appendChild(T),x.push(()=>T.remove())}}return()=>x.forEach(E=>E())}function m(){s();let a=x=>{if(x.key!=="Enter")return;let v=x.target;if(!v.matches?.(r))return;x.preventDefault();let y=v.value.trim();y.length>=1&&e(y)};document.body.addEventListener("keydown",a,!0),i=()=>document.body.removeEventListener("keydown",a,!0)}function s(){i?.(),i=null}function p(){let a=document.querySelector(r);return!a||a===t?!1:(o?.(),o=h(a),t=a,l="guarding",s(),!0)}function c(a){if(t){for(let x of a)for(let v of Array.from(x.removedNodes))if(v===t||v instanceof HTMLElement&&v.contains(t)){o?.(),o=null,t=null,l="seeking",m();return}}}p();let d=new MutationObserver(a=>{l==="guarding"&&c(a),l==="seeking"&&p()});d.observe(document.body,{childList:!0,subtree:!0});let u=n??1e4,C=setTimeout(()=>{l==="seeking"&&!t&&(d.disconnect(),s(),console.warn(`[xtal.js] Could not find input matching "${r}" after ${u/1e3}s`))},u);return()=>{clearTimeout(C),d.disconnect(),o?.(),s(),t=null}}function Ie(r){return typeof r=="string"&&r.includes("/")?r.split("/").pop():r}var G=class{constructor(){this.name="shopify"}async addToCart(e,n=1){let t=e.variants?.[0]?.id;if(!t)return{success:!1,message:"No variant available"};if(!e.available)return{success:!1,message:"Product unavailable"};let o=Ie(t);try{let i=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o,quantity:n})});return i.ok?{success:!0,message:"Added to cart"}:i.status===422?{success:!1,message:(await i.json().catch(()=>({}))).description||"Could not add to cart"}:{success:!1,message:`Cart error (${i.status})`}}catch(i){return{success:!1,message:i instanceof Error?i.message:"Network error"}}}};var V=class{constructor(e,n,t){this.name="fallback";this.shopId=e,this.queryFn=n,this.resolveUrl=t}async addToCart(e){let n=this.resolveUrl?.(e)??e.product_url??"#",t=N(n,{shopId:this.shopId,productId:e.id,query:this.queryFn()});return window.open(t,"_blank","noopener,noreferrer"),{success:!0,message:"Opening product page..."}}};function he(r,e,n){return window.Shopify?new G:new V(r,e,n)}function ge(){if(!document.getElementById("xtal-showcase-styles")){let r=document.createElement("style");r.id="xtal-showcase-styles",r.textContent=$e,document.head.appendChild(r)}}function fe(r,e,n){ge();let t=document.createElement("div");t.className="xtal-showcase";let o=document.createElement("div");o.className="xtal-showcase-header",o.innerHTML=`SKU <strong>"${ne(r)}"</strong> not found`,t.appendChild(o);let i=document.createElement("div");i.className="xtal-showcase-grid";for(let l of e){let h=Ae(l,n);i.appendChild(h)}return t.appendChild(i),t}function Ae(r,e){let n=document.createElement("div");n.className="xtal-showcase-card",n.addEventListener("click",()=>e(r.query));let t=document.createElement("div");t.className="xtal-showcase-label",t.innerHTML=`<span>${ne(r.label)}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,n.appendChild(t);let o=document.createElement("p");o.className="xtal-showcase-query",o.textContent=`\u201C${r.query}\u201D`,n.appendChild(o);let i=r.products.filter(m=>!!te(m)),[l,...h]=i;if(l){let m=document.createElement("div");m.className="xtal-showcase-hero";let s=document.createElement("img");s.src=te(l),s.alt=l.title,s.loading="lazy",m.appendChild(s),n.appendChild(m)}if(h.length>0){let m=document.createElement("div");m.className="xtal-showcase-thumbs";for(let s of h.slice(0,3)){let p=document.createElement("div");p.className="xtal-showcase-thumb";let c=document.createElement("img");c.src=te(s),c.alt=s.title,c.loading="lazy",p.appendChild(c),m.appendChild(p)}n.appendChild(m)}return n}function xe(r){ge();let e=document.createElement("div");e.className="xtal-showcase";let n=document.createElement("div");n.className="xtal-showcase-header",n.innerHTML=`SKU <strong>"${ne(r)}"</strong> not found`,e.appendChild(n);let t=document.createElement("div");t.className="xtal-showcase-grid";for(let o=0;o<3;o++){let i=document.createElement("div");i.className="xtal-showcase-card xtal-showcase-skeleton",i.innerHTML=`
      <div class="xtal-showcase-label"><span>&nbsp;</span></div>
      <p class="xtal-showcase-query">&nbsp;</p>
      <div class="xtal-showcase-hero xtal-shimmer"></div>
      <div class="xtal-showcase-thumbs">
        <div class="xtal-showcase-thumb xtal-shimmer"></div>
        <div class="xtal-showcase-thumb xtal-shimmer"></div>
        <div class="xtal-showcase-thumb xtal-shimmer"></div>
      </div>
    `,t.appendChild(i)}return e.appendChild(t),e}function te(r){return r.image_url||r.featured_image||r.images?.[0]?.src||""}function ne(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var $e=`
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
`;function re(r){return`xtal-showcase-${r}`}function Fe(r){try{let e=localStorage.getItem(re(r));if(!e)return null;let n=JSON.parse(e);return Date.now()-n.ts>36e5?(localStorage.removeItem(re(r)),null):n.rows}catch{return null}}function Re(r,e){try{let n={rows:e,ts:Date.now()};localStorage.setItem(re(r),JSON.stringify(n))}catch{}}async function be(r,e,n){let t=Fe(e);if(t)return t;let i=(await Promise.allSettled(r.map(async l=>{let h=await n.searchShowcase(l.query,4);return{query:l.query,label:l.label,products:h.results.slice(0,4)}}))).filter(l=>l.status==="fulfilled"&&l.value.products.length>0).map(l=>l.value);return i.length>0&&Re(e,i),i}var ye=new Set(["body","html","head","*"]);function je(r,e){return r.replace(/\/\*[\s\S]*?\*\//g,"").replace(/([^{}@][^{}]*)\{([^{}]*)\}/g,(t,o,i)=>{let l=o.trim();if(!l||/^(from|to|\d[\d.]*%)/.test(l))return t;let h=l.split(",").map(m=>{let s=m.trim();return s?`${e} ${s}`:""}).filter(Boolean).join(", ");return h?`${h} { ${i} }`:t})}function ae(r,e,n,t){try{let o=`${r}/api/xtal/events`,i=JSON.stringify({action:"error",collection:e,error:n,context:t,ts:Date.now()});navigator.sendBeacon?.(o,i)||fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:i,keepalive:!0}).catch(()=>{})}catch{}}function Be(){if(document.getElementById("xtal-filter-styles"))return;let r=document.createElement("style");r.id="xtal-filter-styles",r.textContent=`
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
`,document.head.appendChild(r)}function Oe(){return/[?&](Search|search)=/.test(window.location.search)}function ze(r){if(document.getElementById("xtal-sdk-early-hide"))return;let e=document.createElement("style");e.id="xtal-sdk-early-hide",e.textContent=`${r} { visibility: hidden !important; min-height: calc(100vh - 160px); }`,document.head.appendChild(e)}function we(){if(window.__XTAL_BOOTED){console.log("[xtal.js] Already booted \u2014 skipping duplicate init");return}window.__XTAL_BOOTED=!0;try{let r=document.querySelector("script[data-shop-id]"),e=window.XTAL_CONFIG,n=r?.getAttribute("data-shop-id")||e?.shopId||"";if(!n){console.warn("[xtal.js] No shopId found \u2014 need <script data-shop-id> or window.XTAL_CONFIG = { shopId: '...' }");return}let t="",o=r?.getAttribute("src");if(o)try{t=new URL(o,window.location.href).origin}catch{}t||(t=e?.apiBase||"https://www.xtalsearch.com");let i=e?.isAuthenticated!==!1,l=new K(t,n),h=3e5,m=864e5,s=`xtal:config:${n}`,p=null,c=null;try{let a=localStorage.getItem(s);if(a){let x=JSON.parse(a),v=Date.now()-x.ts;v<h?p=x.config:v<m&&x.config.resultsSelector&&(c=x.config.resultsSelector)}}catch{}if(window.__XTAL_LOADING=!0,Oe()){let a=p?.resultsSelector||c||e?.resultsSelector;a&&!ye.has(a.trim().toLowerCase())&&(ze(a),setTimeout(()=>{let x=document.getElementById("xtal-sdk-early-hide");x&&(console.warn("[xtal.js] Failsafe: removing early-hide after 15s timeout"),x.remove())},15e3))}let d=a=>{try{localStorage.setItem(s,JSON.stringify({config:a,ts:Date.now()}))}catch{}},u=a=>{if(!a.enabled){console.log(`[xtal.js] Snippet disabled for ${n}`);return}let x=a.cardTemplate??null;if(x?.css){let w=document.getElementById("xtal-card-styles");w&&w.remove();let g=document.createElement("style");g.id="xtal-card-styles",g.textContent=je(x.css,".xtal-layout"),document.head.appendChild(g)}function v(w){if(a.productUrlPattern){let L=w.variants?.[0]?.sku||"";if(L){let _=a.productUrlPattern.replace("{sku}",encodeURIComponent(L)).replace("{id}",w.id||"");if(!/^javascript:/i.test(_)&&!/^data:/i.test(_))return _}}let g=w.product_url||"#";return!g||g==="#"?"#":g.startsWith("http://")||g.startsWith("https://")?g:a.siteUrl?a.siteUrl.replace(/\/$/,"")+g:g}let y="",M=he(n,()=>y,v);console.log(`[xtal.js] Cart adapter: ${M.name}`);let S=a.resultsSelector??"",E=!!S&&!ye.has(S.trim().toLowerCase());if(!(a.displayMode==="inline"&&E)){!E&&S&&console.warn(`[xtal.js] resultsSelector "${S}" is blocked \u2014 SDK disabled`),window.XTAL={destroy(){let w=document.getElementById("xtal-card-styles");w&&w.remove(),window.XTAL=void 0}};return}{let w=document.querySelector(S),g=w?new D(w):null,L=null,_=()=>g||(w=document.querySelector(S),w&&(g=new D(w)),g),I=a.features?.filters===!0,R=null,k={},$=null,H=null,U=0,X={},j=null;I&&Be();let ve=()=>{if(H||!I||!g)return;let f=g.initLayout();H=new W(f,(b,P)=>{k[b]||(k[b]=[]);let z=k[b].indexOf(P);z>=0?(k[b].splice(z,1),k[b].length===0&&delete k[b]):k[b].push(P),Y()},b=>{$=b,Y()},()=>{k={},$=null,Y()},a.pricePresets,a.hiddenFacets)},ie={onViewProduct(f){let b=N(v(f),{shopId:n,productId:f.id,query:y});window.open(b,"_blank","noopener,noreferrer"),fetch(`${t}/api/xtal/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:f.id,product_title:f.title,action:"product_click",collection:n,query:y})}).catch(()=>{})},async onAddToCart(f){let b=await M.addToCart(f);if(console.log(`[xtal.js] Add to cart: ${b.success?"OK":"FAIL"} \u2014 ${b.message}`),b.success){let P=M.name==="fallback"?"product_click":"add_to_cart";fetch(`${t}/api/xtal/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:f.id,product_title:f.title,action:P,collection:n,query:y})}).catch(()=>{})}}},se=f=>f.map(b=>x?J(x.html,b,y,n,ie,M.name,v(b),i):ue(b,y,n,null,ie,v(b),i)),Y=()=>{!R||!g||(j&&clearTimeout(j),j=setTimeout(()=>{g?.showFilterLoading(),l.searchFiltered(y,R,{facetFilters:k,priceRange:$,limit:a.resultsPerPage??24}).then(f=>{U=f.total,X=f.computed_facets||{},f.results.length===0?g?.renderEmpty(y):g?.renderCards(se(f.results)),H?.update(X,k,$,U)}).catch(f=>{f instanceof DOMException&&f.name==="AbortError"||(console.error("[xtal.js] Filter error:",f),ae(t,n,String(f),"filter"))})},350))},q=a.siteUrl&&(a.siteUrl.startsWith("https://")||a.siteUrl.startsWith("http://"))?a.siteUrl.replace(/\/$/,""):"",oe=a.searchPagePath||"/shop/",B=a.searchQueryParam||"Search",Q=f=>{if(y=f,!_()){let P=new RegExp(`[?&]${B}=`,"i").test(window.location.search);q&&!P&&(console.log("[xtal.js] No results container \u2014 navigating to search page"),window.location.href=`${q}${oe}?${B}=${encodeURIComponent(f)}`);return}R=null,k={},$=null,H?.closeDrawer(),H?.resetState(),g.showLoading(f),l.searchFull(f,a.resultsPerPage??24).then(b=>{U=b.total,X=b.computed_facets||{},R=b.search_context||null,ve();let P=document.querySelector(Z);if(P&&P.value!==f&&(P.value=f),b.is_sku_search&&!b.sku_found&&a.showcaseQueries?.length){H?.update({},{},null,0),g?.renderCustom(xe(f)),be(a.showcaseQueries,n,l).then(z=>{z.length>0?g?.renderCustom(fe(f,z,Q)):g?.renderEmpty(f)}).catch(()=>{g?.renderEmpty(f)});return}if(b.results.length===0){g?.renderEmpty(f),H?.update({},{},null,0);return}g?.renderCards(se(b.results)),H?.update(X,k,$,U)}).catch(b=>{b instanceof DOMException&&b.name==="AbortError"||(console.error("[xtal.js] Search error:",b),ae(t,n,String(b),"search"),g?.restore(),q&&y&&(window.location.href=`${q}${oe}?${B}=${encodeURIComponent(y)}`))})},O=null,le=f=>{O&&clearTimeout(O),O=setTimeout(()=>Q(f),200)},Z=a.searchSelector||'input[type="search"]';L=me(Z,le,a.observerTimeoutMs);let A=null;w||(console.log(`[xtal.js] Inline mode: "${S}" not found \u2014 watching`),A=new MutationObserver(()=>{_()&&(A?.disconnect(),A=null,y&&!R&&Q(y))}),A.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{A?.disconnect(),A=null},a.observerTimeoutMs??1e4));let ce=new URLSearchParams(window.location.search),de=ce.get(B)||ce.get(B.toLowerCase());de?.trim()&&Q(de.trim()),window.XTAL={search(f){f?.trim()&&le(f.trim())},destroy(){O&&clearTimeout(O),j&&clearTimeout(j),l.abort(),L?.(),A?.disconnect(),H?.destroy(),g?.destroy();let f=document.getElementById("xtal-card-styles");f&&f.remove();let b=document.getElementById("xtal-filter-styles");b&&b.remove(),window.XTAL=void 0}},console.log(`[xtal.js] Initialized INLINE for ${n}. Search: ${Z}, Grid: ${a.resultsSelector}${w?"":" (deferred)"}${I?", Filters: ON":""}`)}window.__XTAL_LOADING=!1},C=!1;p?(u(p),C=!0,l.fetchConfig().then(d).catch(()=>{})):l.fetchConfig().then(a=>{d(a),C||u(a)}).catch(a=>{console.error("[xtal.js] Failed to fetch config:",a),ae(t,n,String(a),"config"),window.__XTAL_LOADING=!1})}catch(r){console.error("[xtal.js] Boot error:",r)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",we):we();})();
