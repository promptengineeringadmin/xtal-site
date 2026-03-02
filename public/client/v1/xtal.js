"use strict";var XTAL=(()=>{var A=class{constructor(e,r){this.controller=null;this.apiBase=e,this.shopId=r}abort(){this.controller&&(this.controller.abort(),this.controller=null)}async fetchConfig(){let e=new AbortController,r=setTimeout(()=>e.abort(),5e3);try{let t=await fetch(`${this.apiBase}/api/xtal/config?shopId=${encodeURIComponent(this.shopId)}`,{mode:"cors",signal:e.signal});if(!t.ok)throw new Error(`Config fetch failed: ${t.status}`);return t.json()}finally{clearTimeout(r)}}async searchFull(e,r=16,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=await fetch(`${this.apiBase}/api/xtal/search-full`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,limit:r,selected_aspects:t}),signal:this.controller.signal});if(!o.ok)throw new Error(`Search failed: ${o.status}`);return o.json()}async searchFiltered(e,r,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=t?.facetFilters&&Object.values(t.facetFilters).some(c=>c.length>0),a=t?.priceRange?{min:t.priceRange.min,max:t.priceRange.max}:void 0,m=await fetch(`${this.apiBase}/api/xtal/search`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,search_context:r,limit:t?.limit??24,...o?{facet_filters:t.facetFilters}:{},...a?{price_range:a}:{}}),signal:this.controller.signal});if(!m.ok)throw new Error(`Filter search failed: ${m.status}`);return m.json()}};var I=class{constructor(e){this.originalHTML=null;this.originalDisplay="";this.layoutEl=null;this.railSlot=null;this.gridSlot=null;this.loadingPhraseTimer=null;this.target=e}captureOriginal(){this.originalHTML===null&&(this.originalHTML=this.target.innerHTML,this.originalDisplay=this.target.style.display,this.target.style.display="block",this.target.style.width="100%")}initLayout(){return this.layoutEl?this.railSlot:(this.captureOriginal(),this.target.innerHTML="",this.layoutEl=document.createElement("div"),this.layoutEl.className="xtal-layout",this.railSlot=document.createElement("div"),this.railSlot.className="xtal-rail-slot",this.gridSlot=document.createElement("div"),this.gridSlot.className="xtal-grid-slot",this.layoutEl.appendChild(this.railSlot),this.layoutEl.appendChild(this.gridSlot),this.target.appendChild(this.layoutEl),this.railSlot)}showLoading(e){this.captureOriginal(),this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null);let r=this.gridSlot||this.target;if(r.innerHTML="",!document.getElementById("xtal-inline-keyframes")){let i=document.createElement("style");i.id="xtal-inline-keyframes",i.textContent=["@keyframes xtal-inline-spin{to{transform:rotate(360deg)}}","@keyframes xtal-pulse{0%,100%{opacity:1}50%{opacity:0.4}}"].join(""),document.head.appendChild(i)}let t=document.createElement("div");t.style.cssText="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;width:100%;";let o=document.createElement("div");o.style.cssText="position:relative;width:48px;height:48px;margin-bottom:12px;";let a=document.createElement("div");a.style.cssText="position:absolute;inset:0;border:3px solid #e5e5e5;border-radius:50%;";let m=document.createElement("div");m.style.cssText="position:absolute;inset:0;border:3px solid transparent;border-top-color:#1d1d1b;border-radius:50%;animation:xtal-inline-spin .8s linear infinite;";let c=document.createElement("div");if(c.style.cssText="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;",c.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:xtal-pulse 2s ease-in-out infinite"><path d="M12 3l1.91 5.49L19.4 10.4l-5.49 1.91L12 17.8l-1.91-5.49L4.6 10.4l5.49-1.91z"/><path d="M19 2l.5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5z"/><path d="M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5z"/></svg>',o.appendChild(a),o.appendChild(m),o.appendChild(c),t.appendChild(o),e){let i=e.length>80?e.slice(0,77)+"\u2026":e,l=document.createElement("p");l.style.cssText="margin:0 0 8px 0;font-size:14px;color:#555;font-style:italic;text-align:center;max-width:320px;",l.textContent=`\u201C${i}\u201D`,t.appendChild(l)}let d=["Analyzing search intent\u2026","Finding best matches\u2026","Ranking results\u2026","Almost there\u2026"],s=document.createElement("p");s.style.cssText="margin:0;font-size:13px;color:#999;text-align:center;transition:opacity 0.3s;",s.textContent=d[0],t.appendChild(s);let p=0;this.loadingPhraseTimer=setInterval(()=>{s.style.opacity="0",setTimeout(()=>{p=(p+1)%d.length,s.textContent=d[p],s.style.opacity="1"},300)},2500),r.appendChild(t)}clearPhraseTimer(){this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null)}renderCards(e){this.clearPhraseTimer();let r=this.gridSlot||this.target;r.innerHTML="";let t=document.createElement("div");t.className="xtal-grid";for(let o of e)t.appendChild(o);r.appendChild(t)}renderEmpty(e){this.clearPhraseTimer();let r=this.gridSlot||this.target;r.innerHTML="";let t=document.createElement("div");t.style.cssText="text-align:center;padding:60px 20px;color:#888;font-size:14px;",t.textContent=`No results found for "${e}"`,r.appendChild(t)}restore(){this.layoutEl=null,this.railSlot=null,this.gridSlot=null,this.originalHTML!==null&&(this.target.innerHTML=this.originalHTML,this.target.style.display=this.originalDisplay,this.target.style.width="",this.originalHTML=null)}destroy(){this.clearPhraseTimer(),this.restore();let e=document.getElementById("xtal-inline-keyframes");e&&e.remove()}};var Z={"product-subcategory":"Category",brand:"Brand",vendor:"Vendor","product-age":"Age",proof:"Proof",region:"Region",size:"Size",terpene:"Terpene",effect:"Effect","strain-type":"Strain Type",format:"Format",material:"Material",shape:"Shape","use-case":"Use Case",feature:"Feature",design:"Design",style:"Style",color:"Color"},Y=["product-subcategory","brand","vendor","strain-type","terpene","effect","format","material","use-case","style"],N=5,ee=[{label:"Under $25",max:25},{label:"$25\u2013$50",min:25,max:50},{label:"$50\u2013$100",min:50,max:100},{label:"$100\u2013$200",min:100,max:200},{label:"$200+",min:200}];function z(n){return n.split(/[-_]/).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function te(n){return Z[n]||n.split("-").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function W(n,e){return n?n.min===e.min&&n.max===e.max:!1}var F=class{constructor(e,r,t,o,a){this.expandedSections=new Set(["price"].concat(Y));this.showMore={};this.drawerOpen=!1;this.savedBodyOverflow="";this.container=e,this.onFacetToggle=r,this.onPriceChange=t,this.onClearAll=o,this.pricePresets=a||ee,this.railEl=document.createElement("aside"),this.railEl.className="xtal-filter-rail",e.appendChild(this.railEl),this.fabEl=document.createElement("button"),this.fabEl.className="xtal-filter-fab",this.fabEl.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg><span class="xtal-fab-text">Filters</span>',this.fabEl.addEventListener("click",()=>this.openDrawer()),document.body.appendChild(this.fabEl),this.backdropEl=document.createElement("div"),this.backdropEl.className="xtal-backdrop",this.backdropEl.addEventListener("click",()=>this.closeDrawer()),document.body.appendChild(this.backdropEl),this.drawerEl=document.createElement("div"),this.drawerEl.className="xtal-filter-drawer";let m=document.createElement("div");m.className="xtal-drawer-header",m.innerHTML='<span class="xtal-drawer-title">Filters</span>';let c=document.createElement("button");c.className="xtal-drawer-close",c.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',c.setAttribute("aria-label","Close filters"),c.addEventListener("click",()=>this.closeDrawer()),m.appendChild(c),this.drawerEl.appendChild(m),this.drawerContentEl=document.createElement("div"),this.drawerContentEl.className="xtal-drawer-content",this.drawerEl.appendChild(this.drawerContentEl);let d=document.createElement("div");d.className="xtal-drawer-footer",this.drawerFooterBtn=document.createElement("button"),this.drawerFooterBtn.className="xtal-drawer-apply",this.drawerFooterBtn.textContent="Show results",this.drawerFooterBtn.addEventListener("click",()=>this.closeDrawer()),d.appendChild(this.drawerFooterBtn),this.drawerEl.appendChild(d),document.body.appendChild(this.drawerEl)}update(e,r,t,o){let a=e&&Object.keys(e).length>0,m=Object.values(r).some(i=>i.length>0)||t!==null;if(this.railEl.style.display=!a&&!m?"none":"",this.fabEl.style.display="",!a&&!m){this.fabEl.classList.add("xtal-fab-hidden");return}else this.fabEl.classList.remove("xtal-fab-hidden");this.railEl.innerHTML="",this.drawerContentEl.innerHTML="";let c=this.buildFilterSections(e,r,t,"desktop"),d=this.buildFilterSections(e,r,t,"mobile");this.railEl.appendChild(c),this.drawerContentEl.appendChild(d);let s=Object.values(r).reduce((i,l)=>i+l.length,0)+(t?1:0),p=this.fabEl.querySelector(".xtal-fab-badge");if(p&&p.remove(),s>0){let i=document.createElement("span");i.className="xtal-fab-badge",i.textContent=String(s),this.fabEl.appendChild(i)}this.drawerFooterBtn.textContent=`Show ${o} result${o!==1?"s":""}`}buildFilterSections(e,r,t,o){let a=document.createDocumentFragment();if(Object.values(r).some(s=>s.length>0)||t!==null){let s=document.createElement("div");s.className="xtal-applied-section";let p=document.createElement("div");p.className="xtal-clear-row";let i=document.createElement("button");i.className="xtal-clear-all",i.textContent="Clear all",i.addEventListener("click",()=>this.onClearAll()),p.appendChild(i),s.appendChild(p);let l=document.createElement("div");l.className="xtal-applied-chips";for(let[f,u]of Object.entries(r))for(let x of u){let b=document.createElement("button");b.className="xtal-chip",b.innerHTML=`${z(x)} <span class="xtal-chip-x">\xD7</span>`,b.addEventListener("click",()=>this.onFacetToggle(f,x)),l.appendChild(b)}if(t){let f=document.createElement("button");f.className="xtal-chip";let u=t.min&&t.max?`$${t.min}\u2013$${t.max}`:t.max?`Under $${t.max}`:`$${t.min}+`;f.innerHTML=`${u} <span class="xtal-chip-x">\xD7</span>`,f.addEventListener("click",()=>this.onPriceChange(null)),l.appendChild(f)}s.appendChild(l),a.appendChild(s)}let c=this.buildCollapsibleSection("price","Price",0,t!==null,o,()=>{let s=document.createElement("div");s.className="xtal-price-presets";for(let p of this.pricePresets){let i=document.createElement("button");i.className="xtal-price-btn",W(t,p)&&i.classList.add("xtal-price-btn-active"),i.textContent=p.label,i.addEventListener("click",()=>{W(t,p)?this.onPriceChange(null):this.onPriceChange({min:p.min,max:p.max})}),s.appendChild(i)}return s});a.appendChild(c);let d=Object.entries(e);for(let[s,p]of d){let i=r[s]||[],l=i.length,f=this.buildCollapsibleSection(s,te(s),l,l>0,o,()=>{let u=document.createElement("div");u.className="xtal-facet-list";let x=Object.entries(p).sort((y,w)=>w[1]-y[1]),b=`${o}-${s}`,v=this.showMore[b],E=v||x.length<=N?x:x.slice(0,N),C=x.length-N;for(let[y,w]of E){let T=i.includes(y),k=w===0&&!T,S=document.createElement("label");S.className="xtal-facet-label",k&&S.classList.add("xtal-facet-disabled");let L=document.createElement("input");L.type="checkbox",L.className="xtal-facet-checkbox",L.checked=T,k&&(L.disabled=!0),L.addEventListener("change",()=>this.onFacetToggle(s,y));let $=document.createElement("span");$.className="xtal-facet-text",$.textContent=z(y);let H=document.createElement("span");H.className="xtal-facet-count",H.textContent=String(w),S.appendChild(L),S.appendChild($),S.appendChild(H),u.appendChild(S)}if(C>0){let y=document.createElement("button");y.className="xtal-show-more",y.textContent=v?"Show less":`Show ${C} more`,y.addEventListener("click",()=>{this.showMore[b]=!this.showMore[b];let w=y.parentElement;if(!w)return;let T=this.buildFacetList(s,p,i,o);w.replaceWith(T)}),u.appendChild(y)}return u});a.appendChild(f)}return a}buildFacetList(e,r,t,o){let a=document.createElement("div");a.className="xtal-facet-list";let m=`${o}-${e}`,c=Object.entries(r).sort((i,l)=>l[1]-i[1]),d=this.showMore[m],s=d||c.length<=N?c:c.slice(0,N),p=c.length-N;for(let[i,l]of s){let f=t.includes(i),u=l===0&&!f,x=document.createElement("label");x.className="xtal-facet-label",u&&x.classList.add("xtal-facet-disabled");let b=document.createElement("input");b.type="checkbox",b.className="xtal-facet-checkbox",b.checked=f,u&&(b.disabled=!0),b.addEventListener("change",()=>this.onFacetToggle(e,i));let v=document.createElement("span");v.className="xtal-facet-text",v.textContent=z(i);let E=document.createElement("span");E.className="xtal-facet-count",E.textContent=String(l),x.appendChild(b),x.appendChild(v),x.appendChild(E),a.appendChild(x)}if(p>0){let i=document.createElement("button");i.className="xtal-show-more",i.textContent=d?"Show less":`Show ${p} more`,i.addEventListener("click",()=>{this.showMore[m]=!this.showMore[m];let l=this.buildFacetList(e,r,t,o);a.replaceWith(l)}),a.appendChild(i)}return a}buildCollapsibleSection(e,r,t,o,a,m){let c=document.createElement("div");c.className="xtal-filter-section";let d=o||this.expandedSections.has(e),s=document.createElement("button");s.className="xtal-section-header";let p=document.createElement("span");if(p.className="xtal-section-label",p.textContent=r,t>0){let f=document.createElement("span");f.className="xtal-section-badge",f.textContent=String(t),p.appendChild(f)}let i=document.createElement("span");i.className="xtal-section-chevron",i.textContent=d?"\u25BE":"\u25B8",s.appendChild(p),s.appendChild(i),s.addEventListener("click",()=>{this.expandedSections.has(e)?this.expandedSections.delete(e):this.expandedSections.add(e);let f=c.querySelector(".xtal-section-content");f&&(f.style.display=f.style.display==="none"?"":"none",i.textContent=f.style.display==="none"?"\u25B8":"\u25BE")}),c.appendChild(s);let l=document.createElement("div");return l.className="xtal-section-content",d||(l.style.display="none"),l.appendChild(m()),c.appendChild(l),c}resetState(){this.showMore={}}openDrawer(){this.drawerOpen=!0,this.savedBodyOverflow=document.body.style.overflow,document.body.style.overflow="hidden",this.backdropEl.classList.add("xtal-backdrop-open"),this.drawerEl.classList.add("xtal-drawer-open")}closeDrawer(){this.drawerOpen=!1,document.body.style.overflow=this.savedBodyOverflow,this.backdropEl.classList.remove("xtal-backdrop-open"),this.drawerEl.classList.remove("xtal-drawer-open")}destroy(){this.drawerOpen&&this.closeDrawer(),this.railEl.remove(),this.fabEl.remove(),this.backdropEl.remove(),this.drawerEl.remove()}};function M(n,e){try{let r=new URL(n);return r.searchParams.set("utm_source","xtal"),r.searchParams.set("utm_medium","search"),r.searchParams.set("utm_campaign",e.shopId),r.searchParams.set("utm_content",e.productId),r.searchParams.set("utm_term",e.query),r.toString()}catch{return n}}function ne(n,e){let r=Array.isArray(n.price)?n.price[0]??0:n.price,t=n.variants?.[0]?.compare_at_price,o={id:n.id??"",title:n.title??"",vendor:n.vendor??"",product_type:n.product_type??"",price:r.toFixed(2),image_url:n.image_url||n.featured_image||n.images?.[0]?.src||"",product_url:e||n.product_url||"",available:n.available?"true":"",description:n.description??""};t&&t>r&&(o.compare_at_price=t.toFixed(2));let a=n.variants?.[0];if(a&&(a.sku&&(o.sku=a.sku),a.title&&(o.variant_title=a.title)),n.tags?.length){o.tags=n.tags.join(", ");for(let m of n.tags){let c=m.indexOf(":");if(c>0){let d=m.slice(0,c).trim().toLowerCase().replace(/\s+/g,"_"),s=m.slice(c+1).trim();d&&s&&!(d in o)&&(o[d]=s)}}}return o}function re(n,e){let r=n.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,a)=>e[o]?a:"");return r=r.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,a)=>e[o]?"":a),r}function ae(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function ie(n){let e=n.replace(/<script\b[\s\S]*?<\/script>/gi,"");return e=e.replace(/<iframe\b[\s\S]*?<\/iframe>/gi,""),e=e.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,""),e=e.replace(/(href|src|action)\s*=\s*"(?:javascript|data):[^"]*"/gi,'$1=""'),e=e.replace(/(href|src|action)\s*=\s*'(?:javascript|data):[^']*'/gi,"$1=''"),e=e.replace(/(href|src|action)\s*=\s*(?:javascript|data):[^\s>]*/gi,'$1=""'),e}function se(n,e){return n.replace(/\{\{(\w+)\}\}/g,(r,t)=>ae(e[t]??""))}function oe(n){let e=document.createElement("div");return e.innerHTML=ie(n.trim()),e.firstElementChild||e}function j(n,e,r,t,o,a,m){let c=ne(e,m),d=re(n,c);d=se(d,c);let s=oe(d),p=M(m||e.product_url||"#",{shopId:t,productId:e.id,query:r});return s.querySelectorAll('[data-xtal-action="view-product"]').forEach(i=>{i.tagName==="A"?(i.href=p,i.target="_blank",i.rel="noopener noreferrer"):(i.style.cursor="pointer",i.addEventListener("click",l=>{l.preventDefault(),o.onViewProduct(e)}))}),s.querySelectorAll('[data-xtal-action="add-to-cart"]').forEach(i=>{a==="fallback"&&(i.textContent="View Product"),i.addEventListener("click",async l=>{l.preventDefault(),l.stopPropagation();let f=i.textContent;i.textContent="Adding...",i.style.opacity="0.7",i.style.pointerEvents="none";try{await o.onAddToCart(e)}finally{i.textContent=f,i.style.opacity="",i.style.pointerEvents=""}})}),s}function le(n){if(Array.isArray(n)){let e=[...n].sort((r,t)=>r-t);return e.length===0?"N/A":e.length===1||e[0]===e[e.length-1]?`$${e[0].toFixed(2)}`:`$${e[0].toFixed(2)} \u2013 $${e[e.length-1].toFixed(2)}`}return`$${n.toFixed(2)}`}function V(n,e,r,t,o,a){if(t&&o)return j(t.html,n,e,r,o);let m=n.image_url||n.featured_image||n.images&&n.images[0]?.src,c=document.createElement("a");c.className="xtal-card",c.href=M(a||n.product_url||"#",{shopId:r,productId:n.id,query:e}),c.target="_blank",c.rel="noopener noreferrer";let d=document.createElement("div");if(d.className="xtal-card-image",m){let l=document.createElement("img");l.src=m,l.alt=n.title,l.loading="lazy",d.appendChild(l)}else{let l=document.createElement("span");l.className="xtal-card-image-placeholder",l.textContent="No image",d.appendChild(l)}c.appendChild(d);let s=document.createElement("div");if(s.className="xtal-card-body",n.vendor){let l=document.createElement("div");l.className="xtal-card-vendor",l.textContent=n.vendor,s.appendChild(l)}let p=document.createElement("div");p.className="xtal-card-title",p.textContent=n.title,s.appendChild(p);let i=document.createElement("div");return i.className="xtal-card-price",i.textContent=le(n.price),s.appendChild(i),c.appendChild(s),c}function K(n,e,r){let t=null,o=null,a=[];function m(s){let p=s.closest("form");if(p){let l=f=>{f.preventDefault(),f.stopImmediatePropagation();let u=s.value.trim();u.length>=1&&e(u)};p.addEventListener("submit",l,!0),a.push(()=>p.removeEventListener("submit",l,!0))}let i=l=>{if(l.key==="Enter"){l.preventDefault(),l.stopImmediatePropagation();let f=s.value.trim();f.length>=1&&e(f)}};s.addEventListener("keydown",i,!0),a.push(()=>s.removeEventListener("keydown",i,!0))}let c=document.querySelector(n);if(c)return m(c),()=>a.forEach(s=>s());t=new MutationObserver(s=>{for(let p of s)for(let i of Array.from(p.addedNodes)){if(!(i instanceof HTMLElement))continue;let l=i.matches(n)?i:i.querySelector(n);if(l){m(l),t?.disconnect(),t=null,o&&clearTimeout(o),o=null;return}}}),t.observe(document.body,{childList:!0,subtree:!0});let d=r??1e4;return o=setTimeout(()=>{t?.disconnect(),t=null,console.warn(`[xtal.js] Could not find input matching "${n}" after ${d/1e3}s`)},d),()=>{a.forEach(s=>s()),t?.disconnect(),t=null,o&&clearTimeout(o)}}function ce(n){return typeof n=="string"&&n.includes("/")?n.split("/").pop():n}var R=class{constructor(){this.name="shopify"}async addToCart(e,r=1){let t=e.variants?.[0]?.id;if(!t)return{success:!1,message:"No variant available"};if(!e.available)return{success:!1,message:"Product unavailable"};let o=ce(t);try{let a=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o,quantity:r})});return a.ok?{success:!0,message:"Added to cart"}:a.status===422?{success:!1,message:(await a.json().catch(()=>({}))).description||"Could not add to cart"}:{success:!1,message:`Cart error (${a.status})`}}catch(a){return{success:!1,message:a instanceof Error?a.message:"Network error"}}}};var B=class{constructor(e,r,t){this.name="fallback";this.shopId=e,this.queryFn=r,this.resolveUrl=t}async addToCart(e){let r=this.resolveUrl?.(e)??e.product_url??"#",t=M(r,{shopId:this.shopId,productId:e.id,query:this.queryFn()});return window.open(t,"_blank","noopener,noreferrer"),{success:!0,message:"Opening product page..."}}};function J(n,e,r){return window.Shopify?new R:new B(n,e,r)}var de=new Set(["body","html","head","*"]);function pe(n,e){return n.replace(/\/\*[\s\S]*?\*\//g,"").replace(/([^{}@][^{}]*)\{([^{}]*)\}/g,(t,o,a)=>{let m=o.trim();if(!m||/^(from|to|\d[\d.]*%)/.test(m))return t;let c=m.split(",").map(d=>{let s=d.trim();return s?`${e} ${s}`:""}).filter(Boolean).join(", ");return c?`${c} { ${a} }`:t})}function U(n,e,r,t){try{let o=`${n}/api/xtal/events`,a=JSON.stringify({action:"error",collection:e,error:r,context:t,ts:Date.now()});navigator.sendBeacon?.(o,a)||fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:a,keepalive:!0}).catch(()=>{})}catch{}}function me(){if(document.getElementById("xtal-filter-styles"))return;let n=document.createElement("style");n.id="xtal-filter-styles",n.textContent=`
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
`,document.head.appendChild(n)}function G(){try{let n=document.querySelector("script[data-shop-id]");if(!n){console.warn("[xtal.js] No <script data-shop-id> tag found");return}let e=n.getAttribute("data-shop-id")??"";if(!e){console.warn("[xtal.js] data-shop-id is empty");return}let r="",t=n.getAttribute("src");if(t)try{r=new URL(t,window.location.href).origin}catch{r=window.location.origin}else r=window.location.origin;let o=new A(r,e);o.fetchConfig().then(a=>{if(!a.enabled){console.log(`[xtal.js] Snippet disabled for ${e}`);return}let m=a.cardTemplate??null;if(m?.css){let u=document.getElementById("xtal-card-styles");u&&u.remove();let x=document.createElement("style");x.id="xtal-card-styles",x.textContent=pe(m.css,".xtal-layout"),document.head.appendChild(x)}function c(u){if(a.productUrlPattern){let b=u.variants?.[0]?.sku||"";if(b){let v=a.productUrlPattern.replace("{sku}",encodeURIComponent(b)).replace("{id}",u.id||"");if(!/^javascript:/i.test(v)&&!/^data:/i.test(v))return v}}let x=u.product_url||"#";return!x||x==="#"?"#":x.startsWith("http://")||x.startsWith("https://")?x:a.siteUrl?a.siteUrl.replace(/\/$/,"")+x:x}let d="",s=J(e,()=>d,c);console.log(`[xtal.js] Cart adapter: ${s.name}`);let p=a.resultsSelector??"",i=!!p&&!de.has(p.trim().toLowerCase()),l=a.displayMode==="inline"&&i,f=l?document.querySelector(p):null;if(!l||!f){!i&&p?console.warn(`[xtal.js] resultsSelector "${p}" is blocked \u2014 SDK disabled`):l&&!f&&console.log(`[xtal.js] Inline mode: "${p}" not found \u2014 standing by`),window.XTAL={destroy(){let u=document.getElementById("xtal-card-styles");u&&u.remove(),window.XTAL=void 0}};return}{let u=new I(f),x=null,b=a.features?.filters===!0,v=null,E={},C=null,y=null,w=0,T={},k=null;b&&(me(),u.initLayout());let S=()=>{if(y||!b)return;let g=u.initLayout();y=new F(g,(h,_)=>{E[h]||(E[h]=[]);let X=E[h].indexOf(_);X>=0?(E[h].splice(X,1),E[h].length===0&&delete E[h]):E[h].push(_),H()},h=>{C=h,H()},()=>{E={},C=null,H()},a.pricePresets)},L={onViewProduct(g){let h=M(c(g),{shopId:e,productId:g.id,query:d});window.open(h,"_blank","noopener,noreferrer")},async onAddToCart(g){let h=await s.addToCart(g);console.log(`[xtal.js] Add to cart: ${h.success?"OK":"FAIL"} \u2014 ${h.message}`),h.success&&fetch(`${r}/api/xtal/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:g.id,action:"add_to_cart",collection:e,query:d})}).catch(()=>{})}},$=g=>g.map(h=>m?j(m.html,h,d,e,L,s.name,c(h)):V(h,d,e,null,L,c(h))),H=()=>{v&&(k&&clearTimeout(k),k=setTimeout(()=>{u.showLoading(d),o.searchFiltered(d,v,{facetFilters:E,priceRange:C,limit:24}).then(g=>{w=g.total,T=g.computed_facets||{},g.results.length===0?u.renderEmpty(d):u.renderCards($(g.results)),y?.update(T,E,C,w)}).catch(g=>{g instanceof DOMException&&g.name==="AbortError"||(console.error("[xtal.js] Filter error:",g),U(r,e,String(g),"filter"))})},150))},D=g=>{d=g,v=null,E={},C=null,y?.closeDrawer(),y?.resetState(),u.showLoading(g),o.searchFull(g,24).then(h=>{if(w=h.total,T=h.computed_facets||{},v=h.search_context||null,S(),h.results.length===0){u.renderEmpty(g),y?.update({},{},null,0);return}u.renderCards($(h.results)),y?.update(T,E,C,w)}).catch(h=>{if(h instanceof DOMException&&h.name==="AbortError")return;console.error("[xtal.js] Search error:",h),U(r,e,String(h),"search"),u.restore();let _=a.siteUrl&&(a.siteUrl.startsWith("https://")||a.siteUrl.startsWith("http://"))?a.siteUrl:"";_&&d&&(window.location.href=`${_.replace(/\/$/,"")}/shop/?Search=${encodeURIComponent(d)}`)})},P=null,Q=g=>{P&&clearTimeout(P),P=setTimeout(()=>D(g),200)},O=a.searchSelector||'input[type="search"]';x=K(O,Q,a.observerTimeoutMs);let q=document.querySelector(O);q?.value?.trim()&&D(q.value.trim()),window.XTAL={destroy(){P&&clearTimeout(P),k&&clearTimeout(k),o.abort(),x?.(),y?.destroy(),u.destroy();let g=document.getElementById("xtal-card-styles");g&&g.remove();let h=document.getElementById("xtal-filter-styles");h&&h.remove(),window.XTAL=void 0}},console.log(`[xtal.js] Initialized INLINE for ${e}. Search: ${O}, Grid: ${a.resultsSelector}${b?", Filters: ON":""}`)}}).catch(a=>{console.error("[xtal.js] Failed to fetch config:",a),U(r,e,String(a),"config")})}catch(n){console.error("[xtal.js] Boot error:",n)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",G):G();})();
