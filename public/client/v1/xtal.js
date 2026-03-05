"use strict";var XTAL=(()=>{var U=class{constructor(e,a){this.controller=null;this.apiBase=e,this.shopId=a}abort(){this.controller&&(this.controller.abort(),this.controller=null)}async fetchConfig(){let e=new AbortController,a=setTimeout(()=>e.abort(),5e3);try{let t=await fetch(`${this.apiBase}/api/xtal/config?shopId=${encodeURIComponent(this.shopId)}`,{mode:"cors",signal:e.signal});if(!t.ok)throw new Error(`Config fetch failed: ${t.status}`);return t.json()}finally{clearTimeout(a)}}async searchFull(e,a=16,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=await fetch(`${this.apiBase}/api/xtal/search-full`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,limit:a,selected_aspects:t}),signal:this.controller.signal});if(!o.ok)throw new Error(`Search failed: ${o.status}`);return o.json()}async searchFiltered(e,a,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=t?.facetFilters&&Object.values(t.facetFilters).some(c=>c.length>0),l=t?.priceRange?{min:t.priceRange.min,max:t.priceRange.max}:void 0,d=await fetch(`${this.apiBase}/api/xtal/search`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,search_context:a,limit:t?.limit??24,...o?{facet_filters:t.facetFilters}:{},...l?{price_range:l}:{}}),signal:this.controller.signal});if(!d.ok)throw new Error(`Filter search failed: ${d.status}`);return d.json()}};var F=class{constructor(e){this.originalHTML=null;this.originalDisplay="";this.layoutEl=null;this.railSlot=null;this.gridSlot=null;this.loadingPhraseTimer=null;this.target=e}captureOriginal(){this.originalHTML===null&&(this.originalHTML=this.target.innerHTML,this.originalDisplay=this.target.style.display,this.target.style.display="block",this.target.style.width="100%")}initLayout(){return this.layoutEl?this.railSlot:(this.captureOriginal(),this.target.innerHTML="",this.layoutEl=document.createElement("div"),this.layoutEl.className="xtal-layout",this.railSlot=document.createElement("div"),this.railSlot.className="xtal-rail-slot",this.gridSlot=document.createElement("div"),this.gridSlot.className="xtal-grid-slot",this.layoutEl.appendChild(this.railSlot),this.layoutEl.appendChild(this.gridSlot),this.target.appendChild(this.layoutEl),this.railSlot)}showLoading(e){this.captureOriginal(),this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null);let a=this.gridSlot||this.target;if(a.innerHTML="",!document.getElementById("xtal-inline-keyframes")){let i=document.createElement("style");i.id="xtal-inline-keyframes",i.textContent=["@keyframes xtal-inline-spin{to{transform:rotate(360deg)}}","@keyframes xtal-pulse{0%,100%{opacity:1}50%{opacity:0.4}}"].join(""),document.head.appendChild(i)}let t=document.createElement("div");t.style.cssText="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;width:100%;";let o=document.createElement("div");o.style.cssText="position:relative;width:48px;height:48px;margin-bottom:12px;";let l=document.createElement("div");l.style.cssText="position:absolute;inset:0;border:3px solid #e5e5e5;border-radius:50%;";let d=document.createElement("div");d.style.cssText="position:absolute;inset:0;border:3px solid transparent;border-top-color:#1d1d1b;border-radius:50%;animation:xtal-inline-spin .8s linear infinite;";let c=document.createElement("div");if(c.style.cssText="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;",c.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:xtal-pulse 2s ease-in-out infinite"><path d="M12 3l1.91 5.49L19.4 10.4l-5.49 1.91L12 17.8l-1.91-5.49L4.6 10.4l5.49-1.91z"/><path d="M19 2l.5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5z"/><path d="M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5z"/></svg>',o.appendChild(l),o.appendChild(d),o.appendChild(c),t.appendChild(o),e){let i=e.length>80?e.slice(0,77)+"\u2026":e,r=document.createElement("p");r.style.cssText="margin:0 0 8px 0;font-size:14px;color:#555;font-style:italic;text-align:center;max-width:320px;",r.textContent=`\u201C${i}\u201D`,t.appendChild(r)}let m=["Analyzing search intent\u2026","Finding best matches\u2026","Ranking results\u2026","Almost there\u2026"],s=document.createElement("p");s.style.cssText="margin:0;font-size:13px;color:#999;text-align:center;transition:opacity 0.3s;",s.textContent=m[0],t.appendChild(s);let p=0;this.loadingPhraseTimer=setInterval(()=>{s.style.opacity="0",setTimeout(()=>{p=(p+1)%m.length,s.textContent=m[p],s.style.opacity="1"},300)},2500),a.appendChild(t)}clearPhraseTimer(){this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null)}renderCards(e){this.clearPhraseTimer();let a=this.gridSlot||this.target;a.innerHTML="";let t=document.createElement("div");t.className="xtal-grid";for(let o of e)t.appendChild(o);a.appendChild(t)}renderEmpty(e){this.clearPhraseTimer();let a=this.gridSlot||this.target;a.innerHTML="";let t=document.createElement("div");t.style.cssText="text-align:center;padding:60px 20px;color:#888;font-size:14px;",t.textContent=`No results found for "${e}"`,a.appendChild(t)}restore(){this.layoutEl=null,this.railSlot=null,this.gridSlot=null,this.originalHTML!==null&&(this.target.innerHTML=this.originalHTML,this.target.style.display=this.originalDisplay,this.target.style.width="",this.originalHTML=null)}destroy(){this.clearPhraseTimer(),this.restore();let e=document.getElementById("xtal-inline-keyframes");e&&e.remove()}};var le={"product-subcategory":"Category",brand:"Brand",vendor:"Vendor","product-age":"Age",proof:"Proof",region:"Region",size:"Size",terpene:"Terpene",effect:"Effect","strain-type":"Strain Type",format:"Format",material:"Material",shape:"Shape","use-case":"Use Case",feature:"Feature",design:"Design",style:"Style",color:"Color"},ce=["product-subcategory","brand","vendor","strain-type","terpene","effect","format","material","use-case","style"],H=5,de=[{label:"Under $25",max:25},{label:"$25\u2013$50",min:25,max:50},{label:"$50\u2013$100",min:50,max:100},{label:"$100\u2013$200",min:100,max:200},{label:"$200+",min:200}];function J(n){return n.split(/[-_]/).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function pe(n){return le[n]||n.split("-").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function ne(n,e){return n?n.min===e.min&&n.max===e.max:!1}var D=class{constructor(e,a,t,o,l){this.expandedSections=new Set(["price"].concat(ce));this.showMore={};this.drawerOpen=!1;this.savedBodyOverflow="";this.container=e,this.onFacetToggle=a,this.onPriceChange=t,this.onClearAll=o,this.pricePresets=l||de,this.railEl=document.createElement("aside"),this.railEl.className="xtal-filter-rail",e.appendChild(this.railEl),this.fabEl=document.createElement("button"),this.fabEl.className="xtal-filter-fab",this.fabEl.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg><span class="xtal-fab-text">Filters</span>',this.fabEl.addEventListener("click",()=>this.openDrawer()),document.body.appendChild(this.fabEl),this.backdropEl=document.createElement("div"),this.backdropEl.className="xtal-backdrop",this.backdropEl.addEventListener("click",()=>this.closeDrawer()),document.body.appendChild(this.backdropEl),this.drawerEl=document.createElement("div"),this.drawerEl.className="xtal-filter-drawer";let d=document.createElement("div");d.className="xtal-drawer-header",d.innerHTML='<span class="xtal-drawer-title">Filters</span>';let c=document.createElement("button");c.className="xtal-drawer-close",c.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',c.setAttribute("aria-label","Close filters"),c.addEventListener("click",()=>this.closeDrawer()),d.appendChild(c),this.drawerEl.appendChild(d),this.drawerContentEl=document.createElement("div"),this.drawerContentEl.className="xtal-drawer-content",this.drawerEl.appendChild(this.drawerContentEl);let m=document.createElement("div");m.className="xtal-drawer-footer",this.drawerFooterBtn=document.createElement("button"),this.drawerFooterBtn.className="xtal-drawer-apply",this.drawerFooterBtn.textContent="Show results",this.drawerFooterBtn.addEventListener("click",()=>this.closeDrawer()),m.appendChild(this.drawerFooterBtn),this.drawerEl.appendChild(m),document.body.appendChild(this.drawerEl)}update(e,a,t,o){let l=e&&Object.keys(e).length>0,d=Object.values(a).some(i=>i.length>0)||t!==null;if(this.railEl.style.display=!l&&!d?"none":"",this.fabEl.style.display="",!l&&!d){this.fabEl.classList.add("xtal-fab-hidden");return}else this.fabEl.classList.remove("xtal-fab-hidden");this.railEl.innerHTML="",this.drawerContentEl.innerHTML="";let c=this.buildFilterSections(e,a,t,"desktop"),m=this.buildFilterSections(e,a,t,"mobile");this.railEl.appendChild(c),this.drawerContentEl.appendChild(m);let s=Object.values(a).reduce((i,r)=>i+r.length,0)+(t?1:0),p=this.fabEl.querySelector(".xtal-fab-badge");if(p&&p.remove(),s>0){let i=document.createElement("span");i.className="xtal-fab-badge",i.textContent=String(s),this.fabEl.appendChild(i)}this.drawerFooterBtn.textContent=`Show ${o} result${o!==1?"s":""}`}buildFilterSections(e,a,t,o){let l=document.createDocumentFragment();if(Object.values(a).some(s=>s.length>0)||t!==null){let s=document.createElement("div");s.className="xtal-applied-section";let p=document.createElement("div");p.className="xtal-clear-row";let i=document.createElement("button");i.className="xtal-clear-all",i.textContent="Clear all",i.addEventListener("click",()=>this.onClearAll()),p.appendChild(i),s.appendChild(p);let r=document.createElement("div");r.className="xtal-applied-chips";for(let[h,y]of Object.entries(a))for(let b of y){let E=document.createElement("button");E.className="xtal-chip",E.innerHTML=`${J(b)} <span class="xtal-chip-x">\xD7</span>`,E.addEventListener("click",()=>this.onFacetToggle(h,b)),r.appendChild(E)}if(t){let h=document.createElement("button");h.className="xtal-chip";let y=t.min&&t.max?`$${t.min}\u2013$${t.max}`:t.max?`Under $${t.max}`:`$${t.min}+`;h.innerHTML=`${y} <span class="xtal-chip-x">\xD7</span>`,h.addEventListener("click",()=>this.onPriceChange(null)),r.appendChild(h)}s.appendChild(r),l.appendChild(s)}let c=this.buildCollapsibleSection("price","Price",0,t!==null,o,()=>{let s=document.createElement("div");s.className="xtal-price-presets";for(let p of this.pricePresets){let i=document.createElement("button");i.className="xtal-price-btn",ne(t,p)&&i.classList.add("xtal-price-btn-active"),i.textContent=p.label,i.addEventListener("click",()=>{ne(t,p)?this.onPriceChange(null):this.onPriceChange({min:p.min,max:p.max})}),s.appendChild(i)}return s});l.appendChild(c);let m=Object.entries(e);for(let[s,p]of m){let i=a[s]||[],r=i.length,h=this.buildCollapsibleSection(s,pe(s),r,r>0,o,()=>{let y=document.createElement("div");y.className="xtal-facet-list";let b=Object.entries(p).sort((x,f)=>f[1]-x[1]),E=`${o}-${s}`,w=this.showMore[E],M=w||b.length<=H?b:b.slice(0,H),K=b.length-H;for(let[x,f]of M){let L=i.includes(x),k=f===0&&!L,C=document.createElement("label");C.className="xtal-facet-label",k&&C.classList.add("xtal-facet-disabled");let T=document.createElement("input");T.type="checkbox",T.className="xtal-facet-checkbox",T.checked=L,k&&(T.disabled=!0),T.addEventListener("change",()=>this.onFacetToggle(s,x));let v=document.createElement("span");v.className="xtal-facet-text",v.textContent=J(x);let S=document.createElement("span");S.className="xtal-facet-count",S.textContent=String(f),C.appendChild(T),C.appendChild(v),C.appendChild(S),y.appendChild(C)}if(K>0){let x=document.createElement("button");x.className="xtal-show-more",x.textContent=w?"Show less":`Show ${K} more`,x.addEventListener("click",()=>{this.showMore[E]=!this.showMore[E];let f=x.parentElement;if(!f)return;let L=this.buildFacetList(s,p,i,o);f.replaceWith(L)}),y.appendChild(x)}return y});l.appendChild(h)}return l}buildFacetList(e,a,t,o){let l=document.createElement("div");l.className="xtal-facet-list";let d=`${o}-${e}`,c=Object.entries(a).sort((i,r)=>r[1]-i[1]),m=this.showMore[d],s=m||c.length<=H?c:c.slice(0,H),p=c.length-H;for(let[i,r]of s){let h=t.includes(i),y=r===0&&!h,b=document.createElement("label");b.className="xtal-facet-label",y&&b.classList.add("xtal-facet-disabled");let E=document.createElement("input");E.type="checkbox",E.className="xtal-facet-checkbox",E.checked=h,y&&(E.disabled=!0),E.addEventListener("change",()=>this.onFacetToggle(e,i));let w=document.createElement("span");w.className="xtal-facet-text",w.textContent=J(i);let M=document.createElement("span");M.className="xtal-facet-count",M.textContent=String(r),b.appendChild(E),b.appendChild(w),b.appendChild(M),l.appendChild(b)}if(p>0){let i=document.createElement("button");i.className="xtal-show-more",i.textContent=m?"Show less":`Show ${p} more`,i.addEventListener("click",()=>{this.showMore[d]=!this.showMore[d];let r=this.buildFacetList(e,a,t,o);l.replaceWith(r)}),l.appendChild(i)}return l}buildCollapsibleSection(e,a,t,o,l,d){let c=document.createElement("div");c.className="xtal-filter-section";let m=o||this.expandedSections.has(e),s=document.createElement("button");s.className="xtal-section-header";let p=document.createElement("span");if(p.className="xtal-section-label",p.textContent=a,t>0){let h=document.createElement("span");h.className="xtal-section-badge",h.textContent=String(t),p.appendChild(h)}let i=document.createElement("span");i.className="xtal-section-chevron",i.textContent=m?"\u25BE":"\u25B8",s.appendChild(p),s.appendChild(i),s.addEventListener("click",()=>{this.expandedSections.has(e)?this.expandedSections.delete(e):this.expandedSections.add(e);let h=c.querySelector(".xtal-section-content");h&&(h.style.display=h.style.display==="none"?"":"none",i.textContent=h.style.display==="none"?"\u25B8":"\u25BE")}),c.appendChild(s);let r=document.createElement("div");return r.className="xtal-section-content",m||(r.style.display="none"),r.appendChild(d()),c.appendChild(r),c}resetState(){this.showMore={}}openDrawer(){this.drawerOpen=!0,this.savedBodyOverflow=document.body.style.overflow,document.body.style.overflow="hidden",this.backdropEl.classList.add("xtal-backdrop-open"),this.drawerEl.classList.add("xtal-drawer-open")}closeDrawer(){this.drawerOpen=!1,document.body.style.overflow=this.savedBodyOverflow,this.backdropEl.classList.remove("xtal-backdrop-open"),this.drawerEl.classList.remove("xtal-drawer-open")}destroy(){this.drawerOpen&&this.closeDrawer(),this.railEl.remove(),this.fabEl.remove(),this.backdropEl.remove(),this.drawerEl.remove()}};function P(n,e){try{let a=new URL(n);return a.searchParams.set("utm_source","xtal"),a.searchParams.set("utm_medium","search"),a.searchParams.set("utm_campaign",e.shopId),a.searchParams.set("utm_content",e.productId),a.searchParams.set("utm_term",e.query),a.toString()}catch{return n}}function me(n,e){let a=Array.isArray(n.price)?n.price[0]??0:n.price,t=n.variants?.[0]?.compare_at_price,o={id:n.id??"",title:n.title??"",vendor:n.vendor??"",product_type:n.product_type??"",price:a.toFixed(2),image_url:n.image_url||n.featured_image||n.images?.[0]?.src||"",product_url:e||n.product_url||"",available:n.available?"true":"",description:n.description??""};t&&t>a&&(o.compare_at_price=t.toFixed(2));let l=n.variants?.[0];if(l&&(l.sku&&(o.sku=l.sku),l.title&&(o.variant_title=l.title)),n.tags?.length){o.tags=n.tags.join(", ");for(let d of n.tags){let c=d.indexOf(":");if(c>0){let m=d.slice(0,c).trim().toLowerCase().replace(/\s+/g,"_"),s=d.slice(c+1).trim();m&&s&&!(m in o)&&(o[m]=s)}}}return o}function ue(n,e){let a=n.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,l)=>e[o]?l:"");return a=a.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,l)=>e[o]?"":l),a}function he(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function fe(n){let e=n.replace(/<script\b[\s\S]*?<\/script>/gi,"");return e=e.replace(/<iframe\b[\s\S]*?<\/iframe>/gi,""),e=e.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,""),e=e.replace(/(href|src|action)\s*=\s*"(?:javascript|data):[^"]*"/gi,'$1=""'),e=e.replace(/(href|src|action)\s*=\s*'(?:javascript|data):[^']*'/gi,"$1=''"),e=e.replace(/(href|src|action)\s*=\s*(?:javascript|data):[^\s>]*/gi,'$1=""'),e}function ge(n,e){return n.replace(/\{\{(\w+)\}\}/g,(a,t)=>he(e[t]??""))}function xe(n){let e=document.createElement("div");return e.innerHTML=fe(n.trim()),e.firstElementChild||e}function X(n,e,a,t,o,l,d){let c=me(e,d),m=ue(n,c);m=ge(m,c);let s=xe(m),p=P(d||e.product_url||"#",{shopId:t,productId:e.id,query:a});return s.querySelectorAll('[data-xtal-action="view-product"]').forEach(i=>{i.tagName==="A"?(i.href=p,i.target="_blank",i.rel="noopener noreferrer"):(i.style.cursor="pointer",i.addEventListener("click",r=>{r.preventDefault(),o.onViewProduct(e)}))}),s.querySelectorAll('[data-xtal-action="add-to-cart"]').forEach(i=>{l==="fallback"&&(i.textContent="View Product"),i.addEventListener("click",async r=>{r.preventDefault(),r.stopPropagation();let h=i.textContent;i.textContent="Adding...",i.style.opacity="0.7",i.style.pointerEvents="none";try{await o.onAddToCart(e)}finally{i.textContent=h,i.style.opacity="",i.style.pointerEvents=""}})}),s}function be(n){if(Array.isArray(n)){let e=[...n].sort((a,t)=>a-t);return e.length===0?"N/A":e.length===1||e[0]===e[e.length-1]?`$${e[0].toFixed(2)}`:`$${e[0].toFixed(2)} \u2013 $${e[e.length-1].toFixed(2)}`}return`$${n.toFixed(2)}`}function re(n,e,a,t,o,l){if(t&&o)return X(t.html,n,e,a,o);let d=n.image_url||n.featured_image||n.images&&n.images[0]?.src,c=document.createElement("a");c.className="xtal-card",c.href=P(l||n.product_url||"#",{shopId:a,productId:n.id,query:e}),c.target="_blank",c.rel="noopener noreferrer";let m=document.createElement("div");if(m.className="xtal-card-image",d){let r=document.createElement("img");r.src=d,r.alt=n.title,r.loading="lazy",m.appendChild(r)}else{let r=document.createElement("span");r.className="xtal-card-image-placeholder",r.textContent="No image",m.appendChild(r)}c.appendChild(m);let s=document.createElement("div");if(s.className="xtal-card-body",n.vendor){let r=document.createElement("div");r.className="xtal-card-vendor",r.textContent=n.vendor,s.appendChild(r)}let p=document.createElement("div");p.className="xtal-card-title",p.textContent=n.title,s.appendChild(p);let i=document.createElement("div");return i.className="xtal-card-price",i.textContent=be(n.price),s.appendChild(i),c.appendChild(s),c}function ae(n,e,a){let t=null,o=null,l=[];function d(s){let p=s.closest("form");if(p){let r=h=>{h.preventDefault(),h.stopImmediatePropagation();let y=s.value.trim();y.length>=1&&e(y)};p.addEventListener("submit",r,!0),l.push(()=>p.removeEventListener("submit",r,!0))}let i=r=>{if(r.key==="Enter"){r.preventDefault(),r.stopImmediatePropagation();let h=s.value.trim();h.length>=1&&e(h)}};s.addEventListener("keydown",i,!0),l.push(()=>s.removeEventListener("keydown",i,!0))}let c=document.querySelector(n);if(c)return d(c),()=>l.forEach(s=>s());t=new MutationObserver(s=>{for(let p of s)for(let i of Array.from(p.addedNodes)){if(!(i instanceof HTMLElement))continue;let r=i.matches(n)?i:i.querySelector(n);if(r){d(r),t?.disconnect(),t=null,o&&clearTimeout(o),o=null;return}}}),t.observe(document.body,{childList:!0,subtree:!0});let m=a??1e4;return o=setTimeout(()=>{t?.disconnect(),t=null,console.warn(`[xtal.js] Could not find input matching "${n}" after ${m/1e3}s`)},m),()=>{l.forEach(s=>s()),t?.disconnect(),t=null,o&&clearTimeout(o)}}function ye(n){return typeof n=="string"&&n.includes("/")?n.split("/").pop():n}var q=class{constructor(){this.name="shopify"}async addToCart(e,a=1){let t=e.variants?.[0]?.id;if(!t)return{success:!1,message:"No variant available"};if(!e.available)return{success:!1,message:"Product unavailable"};let o=ye(t);try{let l=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o,quantity:a})});return l.ok?{success:!0,message:"Added to cart"}:l.status===422?{success:!1,message:(await l.json().catch(()=>({}))).description||"Could not add to cart"}:{success:!1,message:`Cart error (${l.status})`}}catch(l){return{success:!1,message:l instanceof Error?l.message:"Network error"}}}};var W=class{constructor(e,a,t){this.name="fallback";this.shopId=e,this.queryFn=a,this.resolveUrl=t}async addToCart(e){let a=this.resolveUrl?.(e)??e.product_url??"#",t=P(a,{shopId:this.shopId,productId:e.id,query:this.queryFn()});return window.open(t,"_blank","noopener,noreferrer"),{success:!0,message:"Opening product page..."}}};function ie(n,e,a){return window.Shopify?new q:new W(n,e,a)}var Ee=new Set(["body","html","head","*"]);function ve(n,e){return n.replace(/\/\*[\s\S]*?\*\//g,"").replace(/([^{}@][^{}]*)\{([^{}]*)\}/g,(t,o,l)=>{let d=o.trim();if(!d||/^(from|to|\d[\d.]*%)/.test(d))return t;let c=d.split(",").map(m=>{let s=m.trim();return s?`${e} ${s}`:""}).filter(Boolean).join(", ");return c?`${c} { ${l} }`:t})}function G(n,e,a,t){try{let o=`${n}/api/xtal/events`,l=JSON.stringify({action:"error",collection:e,error:a,context:t,ts:Date.now()});navigator.sendBeacon?.(o,l)||fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:l,keepalive:!0}).catch(()=>{})}catch{}}function we(){if(document.getElementById("xtal-filter-styles"))return;let n=document.createElement("style");n.id="xtal-filter-styles",n.textContent=`
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
`,document.head.appendChild(n)}function se(){try{let n=document.querySelector("script[data-shop-id]"),e=window.XTAL_CONFIG,a=n?.getAttribute("data-shop-id")||e?.shopId||"";if(!a){console.warn("[xtal.js] No shopId found \u2014 need <script data-shop-id> or window.XTAL_CONFIG = { shopId: '...' }");return}let t="",o=n?.getAttribute("src");if(o)try{t=new URL(o,window.location.href).origin}catch{}t||(t=e?.apiBase||"https://www.xtalsearch.com");let l=new U(t,a),d=3e5,c=`xtal:config:${a}`,m=null;try{let r=localStorage.getItem(c);if(r){let h=JSON.parse(r);Date.now()-h.ts<d&&(m=h.config)}}catch{}let s=r=>{try{localStorage.setItem(c,JSON.stringify({config:r,ts:Date.now()}))}catch{}};if(m?.resultsSelector){let r=new URLSearchParams(window.location.search);if(r.has("Search")||r.has("search")){let y=document.querySelector(m.resultsSelector);y&&(y.style.visibility="hidden")}}let p=r=>{if(!r.enabled){console.log(`[xtal.js] Snippet disabled for ${a}`);return}let h=r.cardTemplate??null;if(h?.css){let x=document.getElementById("xtal-card-styles");x&&x.remove();let f=document.createElement("style");f.id="xtal-card-styles",f.textContent=ve(h.css,".xtal-layout"),document.head.appendChild(f)}function y(x){if(r.productUrlPattern){let L=x.variants?.[0]?.sku||"";if(L){let k=r.productUrlPattern.replace("{sku}",encodeURIComponent(L)).replace("{id}",x.id||"");if(!/^javascript:/i.test(k)&&!/^data:/i.test(k))return k}}let f=x.product_url||"#";return!f||f==="#"?"#":f.startsWith("http://")||f.startsWith("https://")?f:r.siteUrl?r.siteUrl.replace(/\/$/,"")+f:f}let b="",E=ie(a,()=>b,y);console.log(`[xtal.js] Cart adapter: ${E.name}`);let w=r.resultsSelector??"",M=!!w&&!Ee.has(w.trim().toLowerCase());if(!(r.displayMode==="inline"&&M)){!M&&w&&console.warn(`[xtal.js] resultsSelector "${w}" is blocked \u2014 SDK disabled`),window.XTAL={destroy(){let x=document.getElementById("xtal-card-styles");x&&x.remove(),window.XTAL=void 0}};return}{let x=document.querySelector(w),f=x?new F(x):null,L=null,k=()=>f||(x=document.querySelector(w),x&&(f=new F(x),C&&f.initLayout()),f),C=r.features?.filters===!0,T=null,v={},S=null,I=null,R=0,j={},$=null;C&&(we(),f?.initLayout());let oe=()=>{if(I||!C||!f)return;let g=f.initLayout();I=new D(g,(u,A)=>{v[u]||(v[u]=[]);let te=v[u].indexOf(A);te>=0?(v[u].splice(te,1),v[u].length===0&&delete v[u]):v[u].push(A),V()},u=>{S=u,V()},()=>{v={},S=null,V()},r.pricePresets)},Q={onViewProduct(g){let u=P(y(g),{shopId:a,productId:g.id,query:b});window.open(u,"_blank","noopener,noreferrer")},async onAddToCart(g){let u=await E.addToCart(g);console.log(`[xtal.js] Add to cart: ${u.success?"OK":"FAIL"} \u2014 ${u.message}`),u.success&&fetch(`${t}/api/xtal/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:g.id,action:"add_to_cart",collection:a,query:b})}).catch(()=>{})}},Z=g=>g.map(u=>h?X(h.html,u,b,a,Q,E.name,y(u)):re(u,b,a,null,Q,y(u))),V=()=>{!T||!f||($&&clearTimeout($),$=setTimeout(()=>{f?.showLoading(b),l.searchFiltered(b,T,{facetFilters:v,priceRange:S,limit:r.resultsPerPage??24}).then(g=>{R=g.total,j=g.computed_facets||{},g.results.length===0?f?.renderEmpty(b):f?.renderCards(Z(g.results)),I?.update(j,v,S,R)}).catch(g=>{g instanceof DOMException&&g.name==="AbortError"||(console.error("[xtal.js] Filter error:",g),G(t,a,String(g),"filter"))})},150))},O=r.siteUrl&&(r.siteUrl.startsWith("https://")||r.siteUrl.startsWith("http://"))?r.siteUrl.replace(/\/$/,""):"",B=g=>{if(b=g,!k()){O&&(console.log("[xtal.js] No results container \u2014 navigating to search page"),window.location.href=`${O}/shop/?Search=${encodeURIComponent(g)}`);return}T=null,v={},S=null,I?.closeDrawer(),I?.resetState(),f.showLoading(g),l.searchFull(g,r.resultsPerPage??24).then(u=>{if(R=u.total,j=u.computed_facets||{},T=u.search_context||null,oe(),u.results.length===0){f?.renderEmpty(g),I?.update({},{},null,0);return}f?.renderCards(Z(u.results)),I?.update(j,v,S,R)}).catch(u=>{u instanceof DOMException&&u.name==="AbortError"||(console.error("[xtal.js] Search error:",u),G(t,a,String(u),"search"),f?.restore(),O&&b&&(window.location.href=`${O}/shop/?Search=${encodeURIComponent(b)}`))})},_=null,Y=g=>{_&&clearTimeout(_),_=setTimeout(()=>B(g),200)},z=r.searchSelector||'input[type="search"]';L=ae(z,Y,r.observerTimeoutMs);let N=null;x||(console.log(`[xtal.js] Inline mode: "${w}" not found \u2014 watching`),N=new MutationObserver(()=>{k()&&(N?.disconnect(),N=null,b&&B(b))}),N.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{N?.disconnect(),N=null},r.observerTimeoutMs??1e4));let ee=document.querySelector(z);if(ee?.value?.trim())B(ee.value.trim());else{let g=new URLSearchParams(window.location.search),u=g.get("Search")||g.get("search");if(u?.trim()){let A=document.querySelector(z);A&&(A.value=u.trim()),B(u.trim())}}window.XTAL={search(g){g?.trim()&&Y(g.trim())},destroy(){_&&clearTimeout(_),$&&clearTimeout($),l.abort(),L?.(),N?.disconnect(),I?.destroy(),f?.destroy();let g=document.getElementById("xtal-card-styles");g&&g.remove();let u=document.getElementById("xtal-filter-styles");u&&u.remove(),window.XTAL=void 0}},console.log(`[xtal.js] Initialized INLINE for ${a}. Search: ${z}, Grid: ${r.resultsSelector}${x?"":" (deferred)"}${C?", Filters: ON":""}`)}},i=!1;m?(p(m),i=!0,l.fetchConfig().then(s).catch(()=>{})):l.fetchConfig().then(r=>{s(r),i||p(r)}).catch(r=>{console.error("[xtal.js] Failed to fetch config:",r),G(t,a,String(r),"config")})}catch(n){console.error("[xtal.js] Boot error:",n)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",se):se();})();
