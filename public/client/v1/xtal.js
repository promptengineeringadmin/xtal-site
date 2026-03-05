"use strict";var XTAL=(()=>{var D=class{constructor(e,a){this.controller=null;this.apiBase=e,this.shopId=a}abort(){this.controller&&(this.controller.abort(),this.controller=null)}async fetchConfig(){let e=new AbortController,a=setTimeout(()=>e.abort(),5e3);try{let t=await fetch(`${this.apiBase}/api/xtal/config?shopId=${encodeURIComponent(this.shopId)}`,{mode:"cors",signal:e.signal});if(!t.ok)throw new Error(`Config fetch failed: ${t.status}`);return t.json()}finally{clearTimeout(a)}}async searchFull(e,a=16,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=await fetch(`${this.apiBase}/api/xtal/search-full`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,limit:a,selected_aspects:t}),signal:this.controller.signal});if(!o.ok)throw new Error(`Search failed: ${o.status}`);return o.json()}async searchFiltered(e,a,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=t?.facetFilters&&Object.values(t.facetFilters).some(c=>c.length>0),l=t?.priceRange?{min:t.priceRange.min,max:t.priceRange.max}:void 0,m=await fetch(`${this.apiBase}/api/xtal/search`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,search_context:a,limit:t?.limit??24,...o?{facet_filters:t.facetFilters}:{},...l?{price_range:l}:{}}),signal:this.controller.signal});if(!m.ok)throw new Error(`Filter search failed: ${m.status}`);return m.json()}};var R=class{constructor(e){this.originalHTML=null;this.originalDisplay="";this.layoutEl=null;this.railSlot=null;this.gridSlot=null;this.loadingPhraseTimer=null;this.target=e}captureOriginal(){if(this.originalHTML===null){this.originalHTML=this.target.innerHTML,this.originalDisplay=this.target.style.display,this.target.style.display="block",this.target.style.width="100%";let e=document.getElementById("xtal-early-hide");e&&e.remove()}}initLayout(){return this.layoutEl?this.railSlot:(this.captureOriginal(),this.target.innerHTML="",this.layoutEl=document.createElement("div"),this.layoutEl.className="xtal-layout",this.railSlot=document.createElement("div"),this.railSlot.className="xtal-rail-slot",this.gridSlot=document.createElement("div"),this.gridSlot.className="xtal-grid-slot",this.layoutEl.appendChild(this.railSlot),this.layoutEl.appendChild(this.gridSlot),this.target.appendChild(this.layoutEl),this.railSlot)}showLoading(e){this.captureOriginal(),this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null);let a=this.gridSlot||this.target;if(a.innerHTML="",!document.getElementById("xtal-inline-keyframes")){let i=document.createElement("style");i.id="xtal-inline-keyframes",i.textContent=["@keyframes xtal-inline-spin{to{transform:rotate(360deg)}}","@keyframes xtal-pulse{0%,100%{opacity:1}50%{opacity:0.4}}"].join(""),document.head.appendChild(i)}let t=document.createElement("div");t.style.cssText="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;width:100%;";let o=document.createElement("div");o.style.cssText="position:relative;width:48px;height:48px;margin-bottom:12px;";let l=document.createElement("div");l.style.cssText="position:absolute;inset:0;border:3px solid #e5e5e5;border-radius:50%;";let m=document.createElement("div");m.style.cssText="position:absolute;inset:0;border:3px solid transparent;border-top-color:#1d1d1b;border-radius:50%;animation:xtal-inline-spin .8s linear infinite;";let c=document.createElement("div");if(c.style.cssText="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;",c.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:xtal-pulse 2s ease-in-out infinite"><path d="M12 3l1.91 5.49L19.4 10.4l-5.49 1.91L12 17.8l-1.91-5.49L4.6 10.4l5.49-1.91z"/><path d="M19 2l.5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5z"/><path d="M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5z"/></svg>',o.appendChild(l),o.appendChild(m),o.appendChild(c),t.appendChild(o),e){let i=e.length>80?e.slice(0,77)+"\u2026":e,n=document.createElement("p");n.style.cssText="margin:0 0 8px 0;font-size:14px;color:#555;font-style:italic;text-align:center;max-width:320px;",n.textContent=`\u201C${i}\u201D`,t.appendChild(n)}let d=["Analyzing search intent\u2026","Finding best matches\u2026","Ranking results\u2026","Almost there\u2026"],s=document.createElement("p");s.style.cssText="margin:0;font-size:13px;color:#999;text-align:center;transition:opacity 0.3s;",s.textContent=d[0],t.appendChild(s);let p=0;this.loadingPhraseTimer=setInterval(()=>{s.style.opacity="0",setTimeout(()=>{p=(p+1)%d.length,s.textContent=d[p],s.style.opacity="1"},300)},2500),a.appendChild(t)}clearPhraseTimer(){this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null)}renderCards(e){this.clearPhraseTimer();let a=this.gridSlot||this.target;a.innerHTML="";let t=document.createElement("div");t.className="xtal-grid";for(let o of e)t.appendChild(o);a.appendChild(t)}renderEmpty(e){this.clearPhraseTimer();let a=this.gridSlot||this.target;a.innerHTML="";let t=document.createElement("div");t.style.cssText="text-align:center;padding:60px 20px;color:#888;font-size:14px;",t.textContent=`No results found for "${e}"`,a.appendChild(t)}restore(){this.layoutEl=null,this.railSlot=null,this.gridSlot=null;let e=document.getElementById("xtal-early-hide");e&&e.remove(),this.originalHTML!==null&&(this.target.innerHTML=this.originalHTML,this.target.style.display=this.originalDisplay,this.target.style.width="",this.originalHTML=null)}destroy(){this.clearPhraseTimer(),this.restore();let e=document.getElementById("xtal-inline-keyframes");e&&e.remove()}};var le={"product-subcategory":"Category",brand:"Brand",vendor:"Vendor","product-age":"Age",proof:"Proof",region:"Region",size:"Size",terpene:"Terpene",effect:"Effect","strain-type":"Strain Type",format:"Format",material:"Material",shape:"Shape","use-case":"Use Case",feature:"Feature",design:"Design",style:"Style",color:"Color"},ce=["product-subcategory","brand","vendor","strain-type","terpene","effect","format","material","use-case","style"],_=5,de=[{label:"Under $25",max:25},{label:"$25\u2013$50",min:25,max:50},{label:"$50\u2013$100",min:50,max:100},{label:"$100\u2013$200",min:100,max:200},{label:"$200+",min:200}];function G(r){return r.split(/[-_]/).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function pe(r){return le[r]||r.split("-").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function ne(r,e){return r?r.min===e.min&&r.max===e.max:!1}var X=class{constructor(e,a,t,o,l,m){this.expandedSections=new Set(["price"].concat(ce));this.showMore={};this.drawerOpen=!1;this.savedBodyOverflow="";this.container=e,this.onFacetToggle=a,this.onPriceChange=t,this.onClearAll=o,this.pricePresets=l||de,this.hiddenFacets=new Set(m||[]),this.railEl=document.createElement("aside"),this.railEl.className="xtal-filter-rail",e.appendChild(this.railEl),this.fabEl=document.createElement("button"),this.fabEl.className="xtal-filter-fab",this.fabEl.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg><span class="xtal-fab-text">Filters</span>',this.fabEl.addEventListener("click",()=>this.openDrawer()),document.body.appendChild(this.fabEl),this.backdropEl=document.createElement("div"),this.backdropEl.className="xtal-backdrop",this.backdropEl.addEventListener("click",()=>this.closeDrawer()),document.body.appendChild(this.backdropEl),this.drawerEl=document.createElement("div"),this.drawerEl.className="xtal-filter-drawer";let c=document.createElement("div");c.className="xtal-drawer-header",c.innerHTML='<span class="xtal-drawer-title">Filters</span>';let d=document.createElement("button");d.className="xtal-drawer-close",d.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',d.setAttribute("aria-label","Close filters"),d.addEventListener("click",()=>this.closeDrawer()),c.appendChild(d),this.drawerEl.appendChild(c),this.drawerContentEl=document.createElement("div"),this.drawerContentEl.className="xtal-drawer-content",this.drawerEl.appendChild(this.drawerContentEl);let s=document.createElement("div");s.className="xtal-drawer-footer",this.drawerFooterBtn=document.createElement("button"),this.drawerFooterBtn.className="xtal-drawer-apply",this.drawerFooterBtn.textContent="Show results",this.drawerFooterBtn.addEventListener("click",()=>this.closeDrawer()),s.appendChild(this.drawerFooterBtn),this.drawerEl.appendChild(s),document.body.appendChild(this.drawerEl)}update(e,a,t,o){let l=e&&Object.keys(e).length>0,m=Object.values(a).some(i=>i.length>0)||t!==null;if(this.railEl.style.display=!l&&!m?"none":"",this.fabEl.style.display="",!l&&!m){this.fabEl.classList.add("xtal-fab-hidden");return}else this.fabEl.classList.remove("xtal-fab-hidden");this.railEl.innerHTML="",this.drawerContentEl.innerHTML="";let c=this.buildFilterSections(e,a,t,"desktop"),d=this.buildFilterSections(e,a,t,"mobile");this.railEl.appendChild(c),this.drawerContentEl.appendChild(d);let s=Object.values(a).reduce((i,n)=>i+n.length,0)+(t?1:0),p=this.fabEl.querySelector(".xtal-fab-badge");if(p&&p.remove(),s>0){let i=document.createElement("span");i.className="xtal-fab-badge",i.textContent=String(s),this.fabEl.appendChild(i)}this.drawerFooterBtn.textContent=`Show ${o} result${o!==1?"s":""}`}buildFilterSections(e,a,t,o){let l=document.createDocumentFragment();if(Object.values(a).some(s=>s.length>0)||t!==null){let s=document.createElement("div");s.className="xtal-applied-section";let p=document.createElement("div");p.className="xtal-clear-row";let i=document.createElement("button");i.className="xtal-clear-all",i.textContent="Clear all",i.addEventListener("click",()=>this.onClearAll()),p.appendChild(i),s.appendChild(p);let n=document.createElement("div");n.className="xtal-applied-chips";for(let[u,y]of Object.entries(a))for(let b of y){let E=document.createElement("button");E.className="xtal-chip",E.innerHTML=`${G(b)} <span class="xtal-chip-x">\xD7</span>`,E.addEventListener("click",()=>this.onFacetToggle(u,b)),n.appendChild(E)}if(t){let u=document.createElement("button");u.className="xtal-chip";let y=t.min&&t.max?`$${t.min}\u2013$${t.max}`:t.max?`Under $${t.max}`:`$${t.min}+`;u.innerHTML=`${y} <span class="xtal-chip-x">\xD7</span>`,u.addEventListener("click",()=>this.onPriceChange(null)),n.appendChild(u)}s.appendChild(n),l.appendChild(s)}let c=this.buildCollapsibleSection("price","Price",0,t!==null,o,()=>{let s=document.createElement("div");s.className="xtal-price-presets";for(let p of this.pricePresets){let i=document.createElement("button");i.className="xtal-price-btn",ne(t,p)&&i.classList.add("xtal-price-btn-active"),i.textContent=p.label,i.addEventListener("click",()=>{ne(t,p)?this.onPriceChange(null):this.onPriceChange({min:p.min,max:p.max})}),s.appendChild(i)}return s});l.appendChild(c);let d=Object.entries(e).filter(([s])=>!this.hiddenFacets.has(s));for(let[s,p]of d){let i=a[s]||[],n=i.length,u=this.buildCollapsibleSection(s,pe(s),n,n>0,o,()=>{let y=document.createElement("div");y.className="xtal-facet-list";let b=Object.entries(p).sort((x,h)=>h[1]-x[1]),E=`${o}-${s}`,C=this.showMore[E],P=C||b.length<=_?b:b.slice(0,_),V=b.length-_;for(let[x,h]of P){let S=i.includes(x),M=h===0&&!S,L=document.createElement("label");L.className="xtal-facet-label",M&&L.classList.add("xtal-facet-disabled");let T=document.createElement("input");T.type="checkbox",T.className="xtal-facet-checkbox",T.checked=S,M&&(T.disabled=!0),T.addEventListener("change",()=>this.onFacetToggle(s,x));let v=document.createElement("span");v.className="xtal-facet-text",v.textContent=G(x);let k=document.createElement("span");k.className="xtal-facet-count",k.textContent=String(h),L.appendChild(T),L.appendChild(v),L.appendChild(k),y.appendChild(L)}if(V>0){let x=document.createElement("button");x.className="xtal-show-more",x.textContent=C?"Show less":`Show ${V} more`,x.addEventListener("click",()=>{this.showMore[E]=!this.showMore[E];let h=x.parentElement;if(!h)return;let S=this.buildFacetList(s,p,i,o);h.replaceWith(S)}),y.appendChild(x)}return y});l.appendChild(u)}return l}buildFacetList(e,a,t,o){let l=document.createElement("div");l.className="xtal-facet-list";let m=`${o}-${e}`,c=Object.entries(a).sort((i,n)=>n[1]-i[1]),d=this.showMore[m],s=d||c.length<=_?c:c.slice(0,_),p=c.length-_;for(let[i,n]of s){let u=t.includes(i),y=n===0&&!u,b=document.createElement("label");b.className="xtal-facet-label",y&&b.classList.add("xtal-facet-disabled");let E=document.createElement("input");E.type="checkbox",E.className="xtal-facet-checkbox",E.checked=u,y&&(E.disabled=!0),E.addEventListener("change",()=>this.onFacetToggle(e,i));let C=document.createElement("span");C.className="xtal-facet-text",C.textContent=G(i);let P=document.createElement("span");P.className="xtal-facet-count",P.textContent=String(n),b.appendChild(E),b.appendChild(C),b.appendChild(P),l.appendChild(b)}if(p>0){let i=document.createElement("button");i.className="xtal-show-more",i.textContent=d?"Show less":`Show ${p} more`,i.addEventListener("click",()=>{this.showMore[m]=!this.showMore[m];let n=this.buildFacetList(e,a,t,o);l.replaceWith(n)}),l.appendChild(i)}return l}buildCollapsibleSection(e,a,t,o,l,m){let c=document.createElement("div");c.className="xtal-filter-section";let d=o||this.expandedSections.has(e),s=document.createElement("button");s.className="xtal-section-header";let p=document.createElement("span");if(p.className="xtal-section-label",p.textContent=a,t>0){let u=document.createElement("span");u.className="xtal-section-badge",u.textContent=String(t),p.appendChild(u)}let i=document.createElement("span");i.className="xtal-section-chevron",i.textContent=d?"\u25BE":"\u25B8",s.appendChild(p),s.appendChild(i),s.addEventListener("click",()=>{this.expandedSections.has(e)?this.expandedSections.delete(e):this.expandedSections.add(e);let u=c.querySelector(".xtal-section-content");u&&(u.style.display=u.style.display==="none"?"":"none",i.textContent=u.style.display==="none"?"\u25B8":"\u25BE")}),c.appendChild(s);let n=document.createElement("div");return n.className="xtal-section-content",d||(n.style.display="none"),n.appendChild(m()),c.appendChild(n),c}resetState(){this.showMore={}}openDrawer(){this.drawerOpen=!0,this.savedBodyOverflow=document.body.style.overflow,document.body.style.overflow="hidden",this.backdropEl.classList.add("xtal-backdrop-open"),this.drawerEl.classList.add("xtal-drawer-open")}closeDrawer(){this.drawerOpen=!1,document.body.style.overflow=this.savedBodyOverflow,this.backdropEl.classList.remove("xtal-backdrop-open"),this.drawerEl.classList.remove("xtal-drawer-open")}destroy(){this.drawerOpen&&this.closeDrawer(),this.railEl.remove(),this.fabEl.remove(),this.backdropEl.remove(),this.drawerEl.remove()}};function H(r,e){try{let a=new URL(r);return a.searchParams.set("utm_source","xtal"),a.searchParams.set("utm_medium","search"),a.searchParams.set("utm_campaign",e.shopId),a.searchParams.set("utm_content",e.productId),a.searchParams.set("utm_term",e.query),a.toString()}catch{return r}}function me(r,e){let a=Array.isArray(r.price)?r.price[0]??0:r.price,t=r.variants?.[0]?.compare_at_price,o={id:r.id??"",title:r.title??"",vendor:r.vendor??"",product_type:r.product_type??"",price:a.toFixed(2),image_url:r.image_url||r.featured_image||r.images?.[0]?.src||"",product_url:e||r.product_url||"",available:r.available?"true":"",description:r.description??""};t&&t>a&&(o.compare_at_price=t.toFixed(2));let l=r.variants?.[0];if(l&&(l.sku&&(o.sku=l.sku),l.title&&(o.variant_title=l.title)),r.tags?.length){o.tags=r.tags.join(", ");for(let m of r.tags){let c=m.indexOf(":");if(c>0){let d=m.slice(0,c).trim().toLowerCase().replace(/\s+/g,"_"),s=m.slice(c+1).trim();d&&s&&!(d in o)&&(o[d]=s)}}}return o}function ue(r,e){let a=r.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,l)=>e[o]?l:"");return a=a.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,l)=>e[o]?"":l),a}function he(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function fe(r){let e=r.replace(/<script\b[\s\S]*?<\/script>/gi,"");return e=e.replace(/<iframe\b[\s\S]*?<\/iframe>/gi,""),e=e.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,""),e=e.replace(/(href|src|action)\s*=\s*"(?:javascript|data):[^"]*"/gi,'$1=""'),e=e.replace(/(href|src|action)\s*=\s*'(?:javascript|data):[^']*'/gi,"$1=''"),e=e.replace(/(href|src|action)\s*=\s*(?:javascript|data):[^\s>]*/gi,'$1=""'),e}function ge(r,e){return r.replace(/\{\{(\w+)\}\}/g,(a,t)=>he(e[t]??""))}function xe(r){let e=document.createElement("div");return e.innerHTML=fe(r.trim()),e.firstElementChild||e}function q(r,e,a,t,o,l,m){let c=me(e,m),d=ue(r,c);d=ge(d,c);let s=xe(d),p=H(m||e.product_url||"#",{shopId:t,productId:e.id,query:a});return s.querySelectorAll('[data-xtal-action="view-product"]').forEach(i=>{i.tagName==="A"?(i.href=p,i.target="_blank",i.rel="noopener noreferrer"):(i.style.cursor="pointer",i.addEventListener("click",n=>{n.preventDefault(),o.onViewProduct(e)}))}),s.querySelectorAll('[data-xtal-action="add-to-cart"]').forEach(i=>{l==="fallback"&&(i.textContent="View Product"),i.addEventListener("click",async n=>{n.preventDefault(),n.stopPropagation();let u=i.textContent;i.textContent="Adding...",i.style.opacity="0.7",i.style.pointerEvents="none";try{await o.onAddToCart(e)}finally{i.textContent=u,i.style.opacity="",i.style.pointerEvents=""}})}),s}function be(r){if(Array.isArray(r)){let e=[...r].sort((a,t)=>a-t);return e.length===0?"N/A":e.length===1||e[0]===e[e.length-1]?`$${e[0].toFixed(2)}`:`$${e[0].toFixed(2)} \u2013 $${e[e.length-1].toFixed(2)}`}return`$${r.toFixed(2)}`}function re(r,e,a,t,o,l){if(t&&o)return q(t.html,r,e,a,o);let m=r.image_url||r.featured_image||r.images&&r.images[0]?.src,c=document.createElement("a");c.className="xtal-card",c.href=H(l||r.product_url||"#",{shopId:a,productId:r.id,query:e}),c.target="_blank",c.rel="noopener noreferrer";let d=document.createElement("div");if(d.className="xtal-card-image",m){let n=document.createElement("img");n.src=m,n.alt=r.title,n.loading="lazy",d.appendChild(n)}else{let n=document.createElement("span");n.className="xtal-card-image-placeholder",n.textContent="No image",d.appendChild(n)}c.appendChild(d);let s=document.createElement("div");if(s.className="xtal-card-body",r.vendor){let n=document.createElement("div");n.className="xtal-card-vendor",n.textContent=r.vendor,s.appendChild(n)}let p=document.createElement("div");p.className="xtal-card-title",p.textContent=r.title,s.appendChild(p);let i=document.createElement("div");return i.className="xtal-card-price",i.textContent=be(r.price),s.appendChild(i),c.appendChild(s),c}function ae(r,e,a){let t=null,o=null,l=[];function m(s){let p=s.closest("form");if(p){let n=u=>{u.preventDefault(),u.stopImmediatePropagation();let y=s.value.trim();y.length>=1&&e(y)};p.addEventListener("submit",n,!0),l.push(()=>p.removeEventListener("submit",n,!0))}let i=n=>{if(n.key==="Enter"){n.preventDefault(),n.stopImmediatePropagation();let u=s.value.trim();u.length>=1&&e(u)}};s.addEventListener("keydown",i,!0),l.push(()=>s.removeEventListener("keydown",i,!0))}let c=document.querySelector(r);if(c)return m(c),()=>l.forEach(s=>s());t=new MutationObserver(s=>{for(let p of s)for(let i of Array.from(p.addedNodes)){if(!(i instanceof HTMLElement))continue;let n=i.matches(r)?i:i.querySelector(r);if(n){m(n),t?.disconnect(),t=null,o&&clearTimeout(o),o=null;return}}}),t.observe(document.body,{childList:!0,subtree:!0});let d=a??1e4;return o=setTimeout(()=>{t?.disconnect(),t=null,console.warn(`[xtal.js] Could not find input matching "${r}" after ${d/1e3}s`)},d),()=>{l.forEach(s=>s()),t?.disconnect(),t=null,o&&clearTimeout(o)}}function ye(r){return typeof r=="string"&&r.includes("/")?r.split("/").pop():r}var W=class{constructor(){this.name="shopify"}async addToCart(e,a=1){let t=e.variants?.[0]?.id;if(!t)return{success:!1,message:"No variant available"};if(!e.available)return{success:!1,message:"Product unavailable"};let o=ye(t);try{let l=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o,quantity:a})});return l.ok?{success:!0,message:"Added to cart"}:l.status===422?{success:!1,message:(await l.json().catch(()=>({}))).description||"Could not add to cart"}:{success:!1,message:`Cart error (${l.status})`}}catch(l){return{success:!1,message:l instanceof Error?l.message:"Network error"}}}};var K=class{constructor(e,a,t){this.name="fallback";this.shopId=e,this.queryFn=a,this.resolveUrl=t}async addToCart(e){let a=this.resolveUrl?.(e)??e.product_url??"#",t=H(a,{shopId:this.shopId,productId:e.id,query:this.queryFn()});return window.open(t,"_blank","noopener,noreferrer"),{success:!0,message:"Opening product page..."}}};function ie(r,e,a){return window.Shopify?new W:new K(r,e,a)}var Ee=new Set(["body","html","head","*"]);function ve(r,e){return r.replace(/\/\*[\s\S]*?\*\//g,"").replace(/([^{}@][^{}]*)\{([^{}]*)\}/g,(t,o,l)=>{let m=o.trim();if(!m||/^(from|to|\d[\d.]*%)/.test(m))return t;let c=m.split(",").map(d=>{let s=d.trim();return s?`${e} ${s}`:""}).filter(Boolean).join(", ");return c?`${c} { ${l} }`:t})}function Q(r,e,a,t){try{let o=`${r}/api/xtal/events`,l=JSON.stringify({action:"error",collection:e,error:a,context:t,ts:Date.now()});navigator.sendBeacon?.(o,l)||fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:l,keepalive:!0}).catch(()=>{})}catch{}}function we(){if(document.getElementById("xtal-filter-styles"))return;let r=document.createElement("style");r.id="xtal-filter-styles",r.textContent=`
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
`,document.head.appendChild(r)}function se(){try{let r=document.querySelector("script[data-shop-id]"),e=window.XTAL_CONFIG,a=r?.getAttribute("data-shop-id")||e?.shopId||"";if(!a){console.warn("[xtal.js] No shopId found \u2014 need <script data-shop-id> or window.XTAL_CONFIG = { shopId: '...' }");return}let t="",o=r?.getAttribute("src");if(o)try{t=new URL(o,window.location.href).origin}catch{}t||(t=e?.apiBase||"https://www.xtalsearch.com");let l=new D(t,a),m=3e5,c=`xtal:config:${a}`,d=null;try{let n=localStorage.getItem(c);if(n){let u=JSON.parse(n);Date.now()-u.ts<m&&(d=u.config)}}catch{}let s=n=>{try{localStorage.setItem(c,JSON.stringify({config:n,ts:Date.now()}))}catch{}};if(d?.resultsSelector&&!document.getElementById("xtal-early-hide")){let n=new URLSearchParams(window.location.search);if(n.has("Search")||n.has("search")){let y=document.createElement("style");y.id="xtal-early-hide",y.textContent=`${d.resultsSelector} { visibility: hidden !important; }`,document.head.appendChild(y)}}let p=n=>{if(!n.enabled){console.log(`[xtal.js] Snippet disabled for ${a}`);return}let u=n.cardTemplate??null;if(u?.css){let x=document.getElementById("xtal-card-styles");x&&x.remove();let h=document.createElement("style");h.id="xtal-card-styles",h.textContent=ve(u.css,".xtal-layout"),document.head.appendChild(h)}function y(x){if(n.productUrlPattern){let S=x.variants?.[0]?.sku||"";if(S){let M=n.productUrlPattern.replace("{sku}",encodeURIComponent(S)).replace("{id}",x.id||"");if(!/^javascript:/i.test(M)&&!/^data:/i.test(M))return M}}let h=x.product_url||"#";return!h||h==="#"?"#":h.startsWith("http://")||h.startsWith("https://")?h:n.siteUrl?n.siteUrl.replace(/\/$/,"")+h:h}let b="",E=ie(a,()=>b,y);console.log(`[xtal.js] Cart adapter: ${E.name}`);let C=n.resultsSelector??"",P=!!C&&!Ee.has(C.trim().toLowerCase());if(!(n.displayMode==="inline"&&P)){!P&&C&&console.warn(`[xtal.js] resultsSelector "${C}" is blocked \u2014 SDK disabled`),window.XTAL={destroy(){let x=document.getElementById("xtal-card-styles");x&&x.remove(),window.XTAL=void 0}};return}{let x=document.querySelector(C),h=x?new R(x):null,S=null,M=()=>h||(x=document.querySelector(C),x&&(h=new R(x),L&&h.initLayout()),h),L=n.features?.filters===!0,T=null,v={},k=null,I=null,j=0,B={},F=null;L&&(we(),h?.initLayout());let oe=()=>{if(I||!L||!h)return;let f=h.initLayout();I=new X(f,(g,$)=>{v[g]||(v[g]=[]);let w=v[g].indexOf($);w>=0?(v[g].splice(w,1),v[g].length===0&&delete v[g]):v[g].push($),J()},g=>{k=g,J()},()=>{v={},k=null,J()},n.pricePresets,n.hiddenFacets)},Z={onViewProduct(f){let g=H(y(f),{shopId:a,productId:f.id,query:b});window.open(g,"_blank","noopener,noreferrer")},async onAddToCart(f){let g=await E.addToCart(f);console.log(`[xtal.js] Add to cart: ${g.success?"OK":"FAIL"} \u2014 ${g.message}`),g.success&&fetch(`${t}/api/xtal/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:f.id,action:"add_to_cart",collection:a,query:b})}).catch(()=>{})}},Y=f=>f.map(g=>u?q(u.html,g,b,a,Z,E.name,y(g)):re(g,b,a,null,Z,y(g))),J=()=>{!T||!h||(F&&clearTimeout(F),F=setTimeout(()=>{h?.showLoading(b),l.searchFiltered(b,T,{facetFilters:v,priceRange:k,limit:n.resultsPerPage??24}).then(f=>{j=f.total,B=f.computed_facets||{},f.results.length===0?h?.renderEmpty(b):h?.renderCards(Y(f.results)),I?.update(B,v,k,j)}).catch(f=>{f instanceof DOMException&&f.name==="AbortError"||(console.error("[xtal.js] Filter error:",f),Q(t,a,String(f),"filter"))})},150))},O=n.siteUrl&&(n.siteUrl.startsWith("https://")||n.siteUrl.startsWith("http://"))?n.siteUrl.replace(/\/$/,""):"",z=f=>{if(b=f,!M()){let w=/[?&](Search|search)=/.test(window.location.search);O&&!w&&(console.log("[xtal.js] No results container \u2014 navigating to search page"),window.location.href=`${O}/shop/?Search=${encodeURIComponent(f)}`);return}T=null,v={},k=null,I?.closeDrawer(),I?.resetState(),h.showLoading(f);let g=window.__xtalPrefetch;(g?(delete window.__xtalPrefetch,g):l.searchFull(f,n.resultsPerPage??24)).then(w=>{if(!w)throw new Error("Prefetch returned null");if(j=w.total,B=w.computed_facets||{},T=w.search_context||null,oe(),w.results.length===0){h?.renderEmpty(f),I?.update({},{},null,0);return}h?.renderCards(Y(w.results)),I?.update(B,v,k,j)}).catch(w=>{w instanceof DOMException&&w.name==="AbortError"||(console.error("[xtal.js] Search error:",w),Q(t,a,String(w),"search"),h?.restore(),O&&b&&(window.location.href=`${O}/shop/?Search=${encodeURIComponent(b)}`))})},A=null,ee=f=>{A&&clearTimeout(A),A=setTimeout(()=>z(f),200)},U=n.searchSelector||'input[type="search"]';S=ae(U,ee,n.observerTimeoutMs);let N=null;x||(console.log(`[xtal.js] Inline mode: "${C}" not found \u2014 watching`),N=new MutationObserver(()=>{M()&&(N?.disconnect(),N=null,b&&!T&&z(b))}),N.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{N?.disconnect(),N=null},n.observerTimeoutMs??1e4));let te=document.querySelector(U);if(te?.value?.trim())z(te.value.trim());else{let f=new URLSearchParams(window.location.search),g=f.get("Search")||f.get("search");if(g?.trim()){let $=document.querySelector(U);$&&($.value=g.trim()),z(g.trim())}}window.XTAL={search(f){f?.trim()&&ee(f.trim())},destroy(){A&&clearTimeout(A),F&&clearTimeout(F),l.abort(),S?.(),N?.disconnect(),I?.destroy(),h?.destroy();let f=document.getElementById("xtal-card-styles");f&&f.remove();let g=document.getElementById("xtal-filter-styles");g&&g.remove(),window.XTAL=void 0}},console.log(`[xtal.js] Initialized INLINE for ${a}. Search: ${U}, Grid: ${n.resultsSelector}${x?"":" (deferred)"}${L?", Filters: ON":""}`)}},i=!1;d?(p(d),i=!0,l.fetchConfig().then(s).catch(()=>{})):l.fetchConfig().then(n=>{s(n),i||p(n)}).catch(n=>{console.error("[xtal.js] Failed to fetch config:",n),Q(t,a,String(n),"config")})}catch(r){console.error("[xtal.js] Boot error:",r)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",se):se();})();
