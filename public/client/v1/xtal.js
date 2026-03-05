"use strict";var XTAL=(()=>{var B=class{constructor(e,i){this.controller=null;this.apiBase=e,this.shopId=i}abort(){this.controller&&(this.controller.abort(),this.controller=null)}async fetchConfig(){let e=new AbortController,i=setTimeout(()=>e.abort(),5e3);try{let t=await fetch(`${this.apiBase}/api/xtal/config?shopId=${encodeURIComponent(this.shopId)}`,{mode:"cors",signal:e.signal});if(!t.ok)throw new Error(`Config fetch failed: ${t.status}`);return t.json()}finally{clearTimeout(i)}}async searchFull(e,i=16,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=await fetch(`${this.apiBase}/api/xtal/search-full`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,limit:i,selected_aspects:t}),signal:this.controller.signal});if(!o.ok)throw new Error(`Search failed: ${o.status}`);return o.json()}async searchFiltered(e,i,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=t?.facetFilters&&Object.values(t.facetFilters).some(c=>c.length>0),r=t?.priceRange?{min:t.priceRange.min,max:t.priceRange.max}:void 0,u=await fetch(`${this.apiBase}/api/xtal/search`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,search_context:i,limit:t?.limit??24,...o?{facet_filters:t.facetFilters}:{},...r?{price_range:r}:{}}),signal:this.controller.signal});if(!u.ok)throw new Error(`Filter search failed: ${u.status}`);return u.json()}};var A=class{constructor(e){this.originalHTML=null;this.originalDisplay="";this.layoutEl=null;this.railSlot=null;this.gridSlot=null;this.loadingPhraseTimer=null;this.target=e}captureOriginal(){this.originalHTML===null&&(this.originalHTML=this.target.innerHTML,this.originalDisplay=this.target.style.display,this.target.style.display="block",this.target.style.width="100%")}initLayout(){return this.layoutEl?this.railSlot:(this.captureOriginal(),this.target.innerHTML="",this.layoutEl=document.createElement("div"),this.layoutEl.className="xtal-layout",this.railSlot=document.createElement("div"),this.railSlot.className="xtal-rail-slot",this.gridSlot=document.createElement("div"),this.gridSlot.className="xtal-grid-slot",this.layoutEl.appendChild(this.railSlot),this.layoutEl.appendChild(this.gridSlot),this.target.appendChild(this.layoutEl),this.railSlot)}showLoading(e){this.captureOriginal(),this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null);let i=this.gridSlot||this.target;if(i.innerHTML="",!document.getElementById("xtal-inline-keyframes")){let a=document.createElement("style");a.id="xtal-inline-keyframes",a.textContent=["@keyframes xtal-inline-spin{to{transform:rotate(360deg)}}","@keyframes xtal-pulse{0%,100%{opacity:1}50%{opacity:0.4}}"].join(""),document.head.appendChild(a)}let t=document.createElement("div");t.style.cssText="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;width:100%;";let o=document.createElement("div");o.style.cssText="position:relative;width:48px;height:48px;margin-bottom:12px;";let r=document.createElement("div");r.style.cssText="position:absolute;inset:0;border:3px solid #e5e5e5;border-radius:50%;";let u=document.createElement("div");u.style.cssText="position:absolute;inset:0;border:3px solid transparent;border-top-color:#1d1d1b;border-radius:50%;animation:xtal-inline-spin .8s linear infinite;";let c=document.createElement("div");if(c.style.cssText="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;",c.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:xtal-pulse 2s ease-in-out infinite"><path d="M12 3l1.91 5.49L19.4 10.4l-5.49 1.91L12 17.8l-1.91-5.49L4.6 10.4l5.49-1.91z"/><path d="M19 2l.5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5z"/><path d="M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5z"/></svg>',o.appendChild(r),o.appendChild(u),o.appendChild(c),t.appendChild(o),e){let a=e.length>80?e.slice(0,77)+"\u2026":e,l=document.createElement("p");l.style.cssText="margin:0 0 8px 0;font-size:14px;color:#555;font-style:italic;text-align:center;max-width:320px;",l.textContent=`\u201C${a}\u201D`,t.appendChild(l)}let d=["Analyzing search intent\u2026","Finding best matches\u2026","Ranking results\u2026","Almost there\u2026"],s=document.createElement("p");s.style.cssText="margin:0;font-size:13px;color:#999;text-align:center;transition:opacity 0.3s;",s.textContent=d[0],t.appendChild(s);let p=0;this.loadingPhraseTimer=setInterval(()=>{s.style.opacity="0",setTimeout(()=>{p=(p+1)%d.length,s.textContent=d[p],s.style.opacity="1"},300)},2500),i.appendChild(t)}clearPhraseTimer(){this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null)}renderCards(e){this.clearPhraseTimer();let i=this.gridSlot||this.target;i.innerHTML="";let t=document.createElement("div");t.className="xtal-grid";for(let o of e)t.appendChild(o);i.appendChild(t)}renderEmpty(e){this.clearPhraseTimer();let i=this.gridSlot||this.target;i.innerHTML="";let t=document.createElement("div");t.style.cssText="text-align:center;padding:60px 20px;color:#888;font-size:14px;",t.textContent=`No results found for "${e}"`,i.appendChild(t)}restore(){this.layoutEl=null,this.railSlot=null,this.gridSlot=null,this.originalHTML!==null&&(this.target.innerHTML=this.originalHTML,this.target.style.display=this.originalDisplay,this.target.style.width="",this.originalHTML=null)}destroy(){this.clearPhraseTimer(),this.restore();let e=document.getElementById("xtal-inline-keyframes");e&&e.remove()}};var te={"product-subcategory":"Category",brand:"Brand",vendor:"Vendor","product-age":"Age",proof:"Proof",region:"Region",size:"Size",terpene:"Terpene",effect:"Effect","strain-type":"Strain Type",format:"Format",material:"Material",shape:"Shape","use-case":"Use Case",feature:"Feature",design:"Design",style:"Style",color:"Color"},ne=["product-subcategory","brand","vendor","strain-type","terpene","effect","format","material","use-case","style"],N=5,re=[{label:"Under $25",max:25},{label:"$25\u2013$50",min:25,max:50},{label:"$50\u2013$100",min:50,max:100},{label:"$100\u2013$200",min:100,max:200},{label:"$200+",min:200}];function X(n){return n.split(/[-_]/).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function ie(n){return te[n]||n.split("-").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function Q(n,e){return n?n.min===e.min&&n.max===e.max:!1}var O=class{constructor(e,i,t,o,r){this.expandedSections=new Set(["price"].concat(ne));this.showMore={};this.drawerOpen=!1;this.savedBodyOverflow="";this.container=e,this.onFacetToggle=i,this.onPriceChange=t,this.onClearAll=o,this.pricePresets=r||re,this.railEl=document.createElement("aside"),this.railEl.className="xtal-filter-rail",e.appendChild(this.railEl),this.fabEl=document.createElement("button"),this.fabEl.className="xtal-filter-fab",this.fabEl.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg><span class="xtal-fab-text">Filters</span>',this.fabEl.addEventListener("click",()=>this.openDrawer()),document.body.appendChild(this.fabEl),this.backdropEl=document.createElement("div"),this.backdropEl.className="xtal-backdrop",this.backdropEl.addEventListener("click",()=>this.closeDrawer()),document.body.appendChild(this.backdropEl),this.drawerEl=document.createElement("div"),this.drawerEl.className="xtal-filter-drawer";let u=document.createElement("div");u.className="xtal-drawer-header",u.innerHTML='<span class="xtal-drawer-title">Filters</span>';let c=document.createElement("button");c.className="xtal-drawer-close",c.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',c.setAttribute("aria-label","Close filters"),c.addEventListener("click",()=>this.closeDrawer()),u.appendChild(c),this.drawerEl.appendChild(u),this.drawerContentEl=document.createElement("div"),this.drawerContentEl.className="xtal-drawer-content",this.drawerEl.appendChild(this.drawerContentEl);let d=document.createElement("div");d.className="xtal-drawer-footer",this.drawerFooterBtn=document.createElement("button"),this.drawerFooterBtn.className="xtal-drawer-apply",this.drawerFooterBtn.textContent="Show results",this.drawerFooterBtn.addEventListener("click",()=>this.closeDrawer()),d.appendChild(this.drawerFooterBtn),this.drawerEl.appendChild(d),document.body.appendChild(this.drawerEl)}update(e,i,t,o){let r=e&&Object.keys(e).length>0,u=Object.values(i).some(a=>a.length>0)||t!==null;if(this.railEl.style.display=!r&&!u?"none":"",this.fabEl.style.display="",!r&&!u){this.fabEl.classList.add("xtal-fab-hidden");return}else this.fabEl.classList.remove("xtal-fab-hidden");this.railEl.innerHTML="",this.drawerContentEl.innerHTML="";let c=this.buildFilterSections(e,i,t,"desktop"),d=this.buildFilterSections(e,i,t,"mobile");this.railEl.appendChild(c),this.drawerContentEl.appendChild(d);let s=Object.values(i).reduce((a,l)=>a+l.length,0)+(t?1:0),p=this.fabEl.querySelector(".xtal-fab-badge");if(p&&p.remove(),s>0){let a=document.createElement("span");a.className="xtal-fab-badge",a.textContent=String(s),this.fabEl.appendChild(a)}this.drawerFooterBtn.textContent=`Show ${o} result${o!==1?"s":""}`}buildFilterSections(e,i,t,o){let r=document.createDocumentFragment();if(Object.values(i).some(s=>s.length>0)||t!==null){let s=document.createElement("div");s.className="xtal-applied-section";let p=document.createElement("div");p.className="xtal-clear-row";let a=document.createElement("button");a.className="xtal-clear-all",a.textContent="Clear all",a.addEventListener("click",()=>this.onClearAll()),p.appendChild(a),s.appendChild(p);let l=document.createElement("div");l.className="xtal-applied-chips";for(let[m,h]of Object.entries(i))for(let b of h){let x=document.createElement("button");x.className="xtal-chip",x.innerHTML=`${X(b)} <span class="xtal-chip-x">\xD7</span>`,x.addEventListener("click",()=>this.onFacetToggle(m,b)),l.appendChild(x)}if(t){let m=document.createElement("button");m.className="xtal-chip";let h=t.min&&t.max?`$${t.min}\u2013$${t.max}`:t.max?`Under $${t.max}`:`$${t.min}+`;m.innerHTML=`${h} <span class="xtal-chip-x">\xD7</span>`,m.addEventListener("click",()=>this.onPriceChange(null)),l.appendChild(m)}s.appendChild(l),r.appendChild(s)}let c=this.buildCollapsibleSection("price","Price",0,t!==null,o,()=>{let s=document.createElement("div");s.className="xtal-price-presets";for(let p of this.pricePresets){let a=document.createElement("button");a.className="xtal-price-btn",Q(t,p)&&a.classList.add("xtal-price-btn-active"),a.textContent=p.label,a.addEventListener("click",()=>{Q(t,p)?this.onPriceChange(null):this.onPriceChange({min:p.min,max:p.max})}),s.appendChild(a)}return s});r.appendChild(c);let d=Object.entries(e);for(let[s,p]of d){let a=i[s]||[],l=a.length,m=this.buildCollapsibleSection(s,ie(s),l,l>0,o,()=>{let h=document.createElement("div");h.className="xtal-facet-list";let b=Object.entries(p).sort((y,E)=>E[1]-y[1]),x=`${o}-${s}`,C=this.showMore[x],T=C||b.length<=N?b:b.slice(0,N),v=b.length-N;for(let[y,E]of T){let L=a.includes(y),M=E===0&&!L,w=document.createElement("label");w.className="xtal-facet-label",M&&w.classList.add("xtal-facet-disabled");let S=document.createElement("input");S.type="checkbox",S.className="xtal-facet-checkbox",S.checked=L,M&&(S.disabled=!0),S.addEventListener("change",()=>this.onFacetToggle(s,y));let $=document.createElement("span");$.className="xtal-facet-text",$.textContent=X(y);let H=document.createElement("span");H.className="xtal-facet-count",H.textContent=String(E),w.appendChild(S),w.appendChild($),w.appendChild(H),h.appendChild(w)}if(v>0){let y=document.createElement("button");y.className="xtal-show-more",y.textContent=C?"Show less":`Show ${v} more`,y.addEventListener("click",()=>{this.showMore[x]=!this.showMore[x];let E=y.parentElement;if(!E)return;let L=this.buildFacetList(s,p,a,o);E.replaceWith(L)}),h.appendChild(y)}return h});r.appendChild(m)}return r}buildFacetList(e,i,t,o){let r=document.createElement("div");r.className="xtal-facet-list";let u=`${o}-${e}`,c=Object.entries(i).sort((a,l)=>l[1]-a[1]),d=this.showMore[u],s=d||c.length<=N?c:c.slice(0,N),p=c.length-N;for(let[a,l]of s){let m=t.includes(a),h=l===0&&!m,b=document.createElement("label");b.className="xtal-facet-label",h&&b.classList.add("xtal-facet-disabled");let x=document.createElement("input");x.type="checkbox",x.className="xtal-facet-checkbox",x.checked=m,h&&(x.disabled=!0),x.addEventListener("change",()=>this.onFacetToggle(e,a));let C=document.createElement("span");C.className="xtal-facet-text",C.textContent=X(a);let T=document.createElement("span");T.className="xtal-facet-count",T.textContent=String(l),b.appendChild(x),b.appendChild(C),b.appendChild(T),r.appendChild(b)}if(p>0){let a=document.createElement("button");a.className="xtal-show-more",a.textContent=d?"Show less":`Show ${p} more`,a.addEventListener("click",()=>{this.showMore[u]=!this.showMore[u];let l=this.buildFacetList(e,i,t,o);r.replaceWith(l)}),r.appendChild(a)}return r}buildCollapsibleSection(e,i,t,o,r,u){let c=document.createElement("div");c.className="xtal-filter-section";let d=o||this.expandedSections.has(e),s=document.createElement("button");s.className="xtal-section-header";let p=document.createElement("span");if(p.className="xtal-section-label",p.textContent=i,t>0){let m=document.createElement("span");m.className="xtal-section-badge",m.textContent=String(t),p.appendChild(m)}let a=document.createElement("span");a.className="xtal-section-chevron",a.textContent=d?"\u25BE":"\u25B8",s.appendChild(p),s.appendChild(a),s.addEventListener("click",()=>{this.expandedSections.has(e)?this.expandedSections.delete(e):this.expandedSections.add(e);let m=c.querySelector(".xtal-section-content");m&&(m.style.display=m.style.display==="none"?"":"none",a.textContent=m.style.display==="none"?"\u25B8":"\u25BE")}),c.appendChild(s);let l=document.createElement("div");return l.className="xtal-section-content",d||(l.style.display="none"),l.appendChild(u()),c.appendChild(l),c}resetState(){this.showMore={}}openDrawer(){this.drawerOpen=!0,this.savedBodyOverflow=document.body.style.overflow,document.body.style.overflow="hidden",this.backdropEl.classList.add("xtal-backdrop-open"),this.drawerEl.classList.add("xtal-drawer-open")}closeDrawer(){this.drawerOpen=!1,document.body.style.overflow=this.savedBodyOverflow,this.backdropEl.classList.remove("xtal-backdrop-open"),this.drawerEl.classList.remove("xtal-drawer-open")}destroy(){this.drawerOpen&&this.closeDrawer(),this.railEl.remove(),this.fabEl.remove(),this.backdropEl.remove(),this.drawerEl.remove()}};function k(n,e){try{let i=new URL(n);return i.searchParams.set("utm_source","xtal"),i.searchParams.set("utm_medium","search"),i.searchParams.set("utm_campaign",e.shopId),i.searchParams.set("utm_content",e.productId),i.searchParams.set("utm_term",e.query),i.toString()}catch{return n}}function ae(n,e){let i=Array.isArray(n.price)?n.price[0]??0:n.price,t=n.variants?.[0]?.compare_at_price,o={id:n.id??"",title:n.title??"",vendor:n.vendor??"",product_type:n.product_type??"",price:i.toFixed(2),image_url:n.image_url||n.featured_image||n.images?.[0]?.src||"",product_url:e||n.product_url||"",available:n.available?"true":"",description:n.description??""};t&&t>i&&(o.compare_at_price=t.toFixed(2));let r=n.variants?.[0];if(r&&(r.sku&&(o.sku=r.sku),r.title&&(o.variant_title=r.title)),n.tags?.length){o.tags=n.tags.join(", ");for(let u of n.tags){let c=u.indexOf(":");if(c>0){let d=u.slice(0,c).trim().toLowerCase().replace(/\s+/g,"_"),s=u.slice(c+1).trim();d&&s&&!(d in o)&&(o[d]=s)}}}return o}function se(n,e){let i=n.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,r)=>e[o]?r:"");return i=i.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,r)=>e[o]?"":r),i}function oe(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function le(n){let e=n.replace(/<script\b[\s\S]*?<\/script>/gi,"");return e=e.replace(/<iframe\b[\s\S]*?<\/iframe>/gi,""),e=e.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,""),e=e.replace(/(href|src|action)\s*=\s*"(?:javascript|data):[^"]*"/gi,'$1=""'),e=e.replace(/(href|src|action)\s*=\s*'(?:javascript|data):[^']*'/gi,"$1=''"),e=e.replace(/(href|src|action)\s*=\s*(?:javascript|data):[^\s>]*/gi,'$1=""'),e}function ce(n,e){return n.replace(/\{\{(\w+)\}\}/g,(i,t)=>oe(e[t]??""))}function de(n){let e=document.createElement("div");return e.innerHTML=le(n.trim()),e.firstElementChild||e}function z(n,e,i,t,o,r,u){let c=ae(e,u),d=se(n,c);d=ce(d,c);let s=de(d),p=k(u||e.product_url||"#",{shopId:t,productId:e.id,query:i});return s.querySelectorAll('[data-xtal-action="view-product"]').forEach(a=>{a.tagName==="A"?(a.href=p,a.target="_blank",a.rel="noopener noreferrer"):(a.style.cursor="pointer",a.addEventListener("click",l=>{l.preventDefault(),o.onViewProduct(e)}))}),s.querySelectorAll('[data-xtal-action="add-to-cart"]').forEach(a=>{r==="fallback"&&(a.textContent="View Product"),a.addEventListener("click",async l=>{l.preventDefault(),l.stopPropagation();let m=a.textContent;a.textContent="Adding...",a.style.opacity="0.7",a.style.pointerEvents="none";try{await o.onAddToCart(e)}finally{a.textContent=m,a.style.opacity="",a.style.pointerEvents=""}})}),s}function pe(n){if(Array.isArray(n)){let e=[...n].sort((i,t)=>i-t);return e.length===0?"N/A":e.length===1||e[0]===e[e.length-1]?`$${e[0].toFixed(2)}`:`$${e[0].toFixed(2)} \u2013 $${e[e.length-1].toFixed(2)}`}return`$${n.toFixed(2)}`}function G(n,e,i,t,o,r){if(t&&o)return z(t.html,n,e,i,o);let u=n.image_url||n.featured_image||n.images&&n.images[0]?.src,c=document.createElement("a");c.className="xtal-card",c.href=k(r||n.product_url||"#",{shopId:i,productId:n.id,query:e}),c.target="_blank",c.rel="noopener noreferrer";let d=document.createElement("div");if(d.className="xtal-card-image",u){let l=document.createElement("img");l.src=u,l.alt=n.title,l.loading="lazy",d.appendChild(l)}else{let l=document.createElement("span");l.className="xtal-card-image-placeholder",l.textContent="No image",d.appendChild(l)}c.appendChild(d);let s=document.createElement("div");if(s.className="xtal-card-body",n.vendor){let l=document.createElement("div");l.className="xtal-card-vendor",l.textContent=n.vendor,s.appendChild(l)}let p=document.createElement("div");p.className="xtal-card-title",p.textContent=n.title,s.appendChild(p);let a=document.createElement("div");return a.className="xtal-card-price",a.textContent=pe(n.price),s.appendChild(a),c.appendChild(s),c}function Z(n,e,i){let t=null,o=null,r=[];function u(s){let p=s.closest("form");if(p){let l=m=>{m.preventDefault(),m.stopImmediatePropagation();let h=s.value.trim();h.length>=1&&e(h)};p.addEventListener("submit",l,!0),r.push(()=>p.removeEventListener("submit",l,!0))}let a=l=>{if(l.key==="Enter"){l.preventDefault(),l.stopImmediatePropagation();let m=s.value.trim();m.length>=1&&e(m)}};s.addEventListener("keydown",a,!0),r.push(()=>s.removeEventListener("keydown",a,!0))}let c=document.querySelector(n);if(c)return u(c),()=>r.forEach(s=>s());t=new MutationObserver(s=>{for(let p of s)for(let a of Array.from(p.addedNodes)){if(!(a instanceof HTMLElement))continue;let l=a.matches(n)?a:a.querySelector(n);if(l){u(l),t?.disconnect(),t=null,o&&clearTimeout(o),o=null;return}}}),t.observe(document.body,{childList:!0,subtree:!0});let d=i??1e4;return o=setTimeout(()=>{t?.disconnect(),t=null,console.warn(`[xtal.js] Could not find input matching "${n}" after ${d/1e3}s`)},d),()=>{r.forEach(s=>s()),t?.disconnect(),t=null,o&&clearTimeout(o)}}function me(n){return typeof n=="string"&&n.includes("/")?n.split("/").pop():n}var U=class{constructor(){this.name="shopify"}async addToCart(e,i=1){let t=e.variants?.[0]?.id;if(!t)return{success:!1,message:"No variant available"};if(!e.available)return{success:!1,message:"Product unavailable"};let o=me(t);try{let r=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o,quantity:i})});return r.ok?{success:!0,message:"Added to cart"}:r.status===422?{success:!1,message:(await r.json().catch(()=>({}))).description||"Could not add to cart"}:{success:!1,message:`Cart error (${r.status})`}}catch(r){return{success:!1,message:r instanceof Error?r.message:"Network error"}}}};var D=class{constructor(e,i,t){this.name="fallback";this.shopId=e,this.queryFn=i,this.resolveUrl=t}async addToCart(e){let i=this.resolveUrl?.(e)??e.product_url??"#",t=k(i,{shopId:this.shopId,productId:e.id,query:this.queryFn()});return window.open(t,"_blank","noopener,noreferrer"),{success:!0,message:"Opening product page..."}}};function Y(n,e,i){return window.Shopify?new U:new D(n,e,i)}var ue=new Set(["body","html","head","*"]);function he(n,e){return n.replace(/\/\*[\s\S]*?\*\//g,"").replace(/([^{}@][^{}]*)\{([^{}]*)\}/g,(t,o,r)=>{let u=o.trim();if(!u||/^(from|to|\d[\d.]*%)/.test(u))return t;let c=u.split(",").map(d=>{let s=d.trim();return s?`${e} ${s}`:""}).filter(Boolean).join(", ");return c?`${c} { ${r} }`:t})}function W(n,e,i,t){try{let o=`${n}/api/xtal/events`,r=JSON.stringify({action:"error",collection:e,error:i,context:t,ts:Date.now()});navigator.sendBeacon?.(o,r)||fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:r,keepalive:!0}).catch(()=>{})}catch{}}function fe(){if(document.getElementById("xtal-filter-styles"))return;let n=document.createElement("style");n.id="xtal-filter-styles",n.textContent=`
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
`,document.head.appendChild(n)}function ee(){try{let n=document.querySelector("script[data-shop-id]");if(!n){console.warn("[xtal.js] No <script data-shop-id> tag found");return}let e=n.getAttribute("data-shop-id")??"";if(!e){console.warn("[xtal.js] data-shop-id is empty");return}let i="",t=n.getAttribute("src");if(t)try{i=new URL(t,window.location.href).origin}catch{i=window.location.origin}else i=window.location.origin;let o=new B(i,e);o.fetchConfig().then(r=>{if(!r.enabled){console.log(`[xtal.js] Snippet disabled for ${e}`);return}let u=r.cardTemplate??null;if(u?.css){let m=document.getElementById("xtal-card-styles");m&&m.remove();let h=document.createElement("style");h.id="xtal-card-styles",h.textContent=he(u.css,".xtal-layout"),document.head.appendChild(h)}function c(m){if(r.productUrlPattern){let b=m.variants?.[0]?.sku||"";if(b){let x=r.productUrlPattern.replace("{sku}",encodeURIComponent(b)).replace("{id}",m.id||"");if(!/^javascript:/i.test(x)&&!/^data:/i.test(x))return x}}let h=m.product_url||"#";return!h||h==="#"?"#":h.startsWith("http://")||h.startsWith("https://")?h:r.siteUrl?r.siteUrl.replace(/\/$/,"")+h:h}let d="",s=Y(e,()=>d,c);console.log(`[xtal.js] Cart adapter: ${s.name}`);let p=r.resultsSelector??"",a=!!p&&!ue.has(p.trim().toLowerCase());if(!(r.displayMode==="inline"&&a)){!a&&p&&console.warn(`[xtal.js] resultsSelector "${p}" is blocked \u2014 SDK disabled`),window.XTAL={destroy(){let m=document.getElementById("xtal-card-styles");m&&m.remove(),window.XTAL=void 0}};return}{let m=document.querySelector(p),h=m?new A(m):null,b=null,x=()=>h||(m=document.querySelector(p),m&&(h=new A(m),C&&h.initLayout()),h),C=r.features?.filters===!0,T=null,v={},y=null,E=null,L=0,M={},w=null;C&&(fe(),h?.initLayout());let S=()=>{if(E||!C||!h)return;let g=h.initLayout();E=new O(g,(f,_)=>{v[f]||(v[f]=[]);let J=v[f].indexOf(_);J>=0?(v[f].splice(J,1),v[f].length===0&&delete v[f]):v[f].push(_),q()},f=>{y=f,q()},()=>{v={},y=null,q()},r.pricePresets)},$={onViewProduct(g){let f=k(c(g),{shopId:e,productId:g.id,query:d});window.open(f,"_blank","noopener,noreferrer")},async onAddToCart(g){let f=await s.addToCart(g);console.log(`[xtal.js] Add to cart: ${f.success?"OK":"FAIL"} \u2014 ${f.message}`),f.success&&fetch(`${i}/api/xtal/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:g.id,action:"add_to_cart",collection:e,query:d})}).catch(()=>{})}},H=g=>g.map(f=>u?z(u.html,f,d,e,$,s.name,c(f)):G(f,d,e,null,$,c(f))),q=()=>{!T||!h||(w&&clearTimeout(w),w=setTimeout(()=>{h?.showLoading(d),o.searchFiltered(d,T,{facetFilters:v,priceRange:y,limit:r.resultsPerPage??24}).then(g=>{L=g.total,M=g.computed_facets||{},g.results.length===0?h?.renderEmpty(d):h?.renderCards(H(g.results)),E?.update(M,v,y,L)}).catch(g=>{g instanceof DOMException&&g.name==="AbortError"||(console.error("[xtal.js] Filter error:",g),W(i,e,String(g),"filter"))})},150))},F=r.siteUrl&&(r.siteUrl.startsWith("https://")||r.siteUrl.startsWith("http://"))?r.siteUrl.replace(/\/$/,""):"",R=g=>{if(d=g,!x()){F&&(console.log("[xtal.js] No results container \u2014 navigating to search page"),window.location.href=`${F}/shop/?Search=${encodeURIComponent(g)}`);return}T=null,v={},y=null,E?.closeDrawer(),E?.resetState(),h.showLoading(g),o.searchFull(g,r.resultsPerPage??24).then(f=>{if(L=f.total,M=f.computed_facets||{},T=f.search_context||null,S(),f.results.length===0){h?.renderEmpty(g),E?.update({},{},null,0);return}h?.renderCards(H(f.results)),E?.update(M,v,y,L)}).catch(f=>{f instanceof DOMException&&f.name==="AbortError"||(console.error("[xtal.js] Search error:",f),W(i,e,String(f),"search"),h?.restore(),F&&d&&(window.location.href=`${F}/shop/?Search=${encodeURIComponent(d)}`))})},I=null,V=g=>{I&&clearTimeout(I),I=setTimeout(()=>R(g),200)},j=r.searchSelector||'input[type="search"]';b=Z(j,V,r.observerTimeoutMs);let P=null;m||(console.log(`[xtal.js] Inline mode: "${p}" not found \u2014 watching`),P=new MutationObserver(()=>{x()&&(P?.disconnect(),P=null,d&&R(d))}),P.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{P?.disconnect(),P=null},r.observerTimeoutMs??1e4));let K=document.querySelector(j);if(K?.value?.trim())R(K.value.trim());else{let g=new URLSearchParams(window.location.search),f=g.get("Search")||g.get("search");if(f?.trim()){let _=document.querySelector(j);_&&(_.value=f.trim()),R(f.trim())}}window.XTAL={search(g){g?.trim()&&V(g.trim())},destroy(){I&&clearTimeout(I),w&&clearTimeout(w),o.abort(),b?.(),P?.disconnect(),E?.destroy(),h?.destroy();let g=document.getElementById("xtal-card-styles");g&&g.remove();let f=document.getElementById("xtal-filter-styles");f&&f.remove(),window.XTAL=void 0}},console.log(`[xtal.js] Initialized INLINE for ${e}. Search: ${j}, Grid: ${r.resultsSelector}${m?"":" (deferred)"}${C?", Filters: ON":""}`)}}).catch(r=>{console.error("[xtal.js] Failed to fetch config:",r),W(i,e,String(r),"config")})}catch(n){console.error("[xtal.js] Boot error:",n)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",ee):ee();})();
