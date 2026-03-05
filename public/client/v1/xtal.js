"use strict";var XTAL=(()=>{var B=class{constructor(e,i){this.controller=null;this.apiBase=e,this.shopId=i}abort(){this.controller&&(this.controller.abort(),this.controller=null)}async fetchConfig(){let e=new AbortController,i=setTimeout(()=>e.abort(),5e3);try{let t=await fetch(`${this.apiBase}/api/xtal/config?shopId=${encodeURIComponent(this.shopId)}`,{mode:"cors",signal:e.signal});if(!t.ok)throw new Error(`Config fetch failed: ${t.status}`);return t.json()}finally{clearTimeout(i)}}async searchFull(e,i=16,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=await fetch(`${this.apiBase}/api/xtal/search-full`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,limit:i,selected_aspects:t}),signal:this.controller.signal});if(!o.ok)throw new Error(`Search failed: ${o.status}`);return o.json()}async searchFiltered(e,i,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=t?.facetFilters&&Object.values(t.facetFilters).some(c=>c.length>0),r=t?.priceRange?{min:t.priceRange.min,max:t.priceRange.max}:void 0,m=await fetch(`${this.apiBase}/api/xtal/search`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,search_context:i,limit:t?.limit??24,...o?{facet_filters:t.facetFilters}:{},...r?{price_range:r}:{}}),signal:this.controller.signal});if(!m.ok)throw new Error(`Filter search failed: ${m.status}`);return m.json()}};var A=class{constructor(e){this.originalHTML=null;this.originalDisplay="";this.layoutEl=null;this.railSlot=null;this.gridSlot=null;this.loadingPhraseTimer=null;this.target=e}captureOriginal(){this.originalHTML===null&&(this.originalHTML=this.target.innerHTML,this.originalDisplay=this.target.style.display,this.target.style.display="block",this.target.style.width="100%")}initLayout(){return this.layoutEl?this.railSlot:(this.captureOriginal(),this.target.innerHTML="",this.layoutEl=document.createElement("div"),this.layoutEl.className="xtal-layout",this.railSlot=document.createElement("div"),this.railSlot.className="xtal-rail-slot",this.gridSlot=document.createElement("div"),this.gridSlot.className="xtal-grid-slot",this.layoutEl.appendChild(this.railSlot),this.layoutEl.appendChild(this.gridSlot),this.target.appendChild(this.layoutEl),this.railSlot)}showLoading(e){this.captureOriginal(),this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null);let i=this.gridSlot||this.target;if(i.innerHTML="",!document.getElementById("xtal-inline-keyframes")){let a=document.createElement("style");a.id="xtal-inline-keyframes",a.textContent=["@keyframes xtal-inline-spin{to{transform:rotate(360deg)}}","@keyframes xtal-pulse{0%,100%{opacity:1}50%{opacity:0.4}}"].join(""),document.head.appendChild(a)}let t=document.createElement("div");t.style.cssText="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;width:100%;";let o=document.createElement("div");o.style.cssText="position:relative;width:48px;height:48px;margin-bottom:12px;";let r=document.createElement("div");r.style.cssText="position:absolute;inset:0;border:3px solid #e5e5e5;border-radius:50%;";let m=document.createElement("div");m.style.cssText="position:absolute;inset:0;border:3px solid transparent;border-top-color:#1d1d1b;border-radius:50%;animation:xtal-inline-spin .8s linear infinite;";let c=document.createElement("div");if(c.style.cssText="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;",c.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:xtal-pulse 2s ease-in-out infinite"><path d="M12 3l1.91 5.49L19.4 10.4l-5.49 1.91L12 17.8l-1.91-5.49L4.6 10.4l5.49-1.91z"/><path d="M19 2l.5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5z"/><path d="M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5z"/></svg>',o.appendChild(r),o.appendChild(m),o.appendChild(c),t.appendChild(o),e){let a=e.length>80?e.slice(0,77)+"\u2026":e,l=document.createElement("p");l.style.cssText="margin:0 0 8px 0;font-size:14px;color:#555;font-style:italic;text-align:center;max-width:320px;",l.textContent=`\u201C${a}\u201D`,t.appendChild(l)}let d=["Analyzing search intent\u2026","Finding best matches\u2026","Ranking results\u2026","Almost there\u2026"],s=document.createElement("p");s.style.cssText="margin:0;font-size:13px;color:#999;text-align:center;transition:opacity 0.3s;",s.textContent=d[0],t.appendChild(s);let p=0;this.loadingPhraseTimer=setInterval(()=>{s.style.opacity="0",setTimeout(()=>{p=(p+1)%d.length,s.textContent=d[p],s.style.opacity="1"},300)},2500),i.appendChild(t)}clearPhraseTimer(){this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null)}renderCards(e){this.clearPhraseTimer();let i=this.gridSlot||this.target;i.innerHTML="";let t=document.createElement("div");t.className="xtal-grid";for(let o of e)t.appendChild(o);i.appendChild(t)}renderEmpty(e){this.clearPhraseTimer();let i=this.gridSlot||this.target;i.innerHTML="";let t=document.createElement("div");t.style.cssText="text-align:center;padding:60px 20px;color:#888;font-size:14px;",t.textContent=`No results found for "${e}"`,i.appendChild(t)}restore(){this.layoutEl=null,this.railSlot=null,this.gridSlot=null,this.originalHTML!==null&&(this.target.innerHTML=this.originalHTML,this.target.style.display=this.originalDisplay,this.target.style.width="",this.originalHTML=null)}destroy(){this.clearPhraseTimer(),this.restore();let e=document.getElementById("xtal-inline-keyframes");e&&e.remove()}};var ne={"product-subcategory":"Category",brand:"Brand",vendor:"Vendor","product-age":"Age",proof:"Proof",region:"Region",size:"Size",terpene:"Terpene",effect:"Effect","strain-type":"Strain Type",format:"Format",material:"Material",shape:"Shape","use-case":"Use Case",feature:"Feature",design:"Design",style:"Style",color:"Color"},re=["product-subcategory","brand","vendor","strain-type","terpene","effect","format","material","use-case","style"],H=5,ie=[{label:"Under $25",max:25},{label:"$25\u2013$50",min:25,max:50},{label:"$50\u2013$100",min:50,max:100},{label:"$100\u2013$200",min:100,max:200},{label:"$200+",min:200}];function X(n){return n.split(/[-_]/).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function ae(n){return ne[n]||n.split("-").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function G(n,e){return n?n.min===e.min&&n.max===e.max:!1}var O=class{constructor(e,i,t,o,r){this.expandedSections=new Set(["price"].concat(re));this.showMore={};this.drawerOpen=!1;this.savedBodyOverflow="";this.container=e,this.onFacetToggle=i,this.onPriceChange=t,this.onClearAll=o,this.pricePresets=r||ie,this.railEl=document.createElement("aside"),this.railEl.className="xtal-filter-rail",e.appendChild(this.railEl),this.fabEl=document.createElement("button"),this.fabEl.className="xtal-filter-fab",this.fabEl.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg><span class="xtal-fab-text">Filters</span>',this.fabEl.addEventListener("click",()=>this.openDrawer()),document.body.appendChild(this.fabEl),this.backdropEl=document.createElement("div"),this.backdropEl.className="xtal-backdrop",this.backdropEl.addEventListener("click",()=>this.closeDrawer()),document.body.appendChild(this.backdropEl),this.drawerEl=document.createElement("div"),this.drawerEl.className="xtal-filter-drawer";let m=document.createElement("div");m.className="xtal-drawer-header",m.innerHTML='<span class="xtal-drawer-title">Filters</span>';let c=document.createElement("button");c.className="xtal-drawer-close",c.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',c.setAttribute("aria-label","Close filters"),c.addEventListener("click",()=>this.closeDrawer()),m.appendChild(c),this.drawerEl.appendChild(m),this.drawerContentEl=document.createElement("div"),this.drawerContentEl.className="xtal-drawer-content",this.drawerEl.appendChild(this.drawerContentEl);let d=document.createElement("div");d.className="xtal-drawer-footer",this.drawerFooterBtn=document.createElement("button"),this.drawerFooterBtn.className="xtal-drawer-apply",this.drawerFooterBtn.textContent="Show results",this.drawerFooterBtn.addEventListener("click",()=>this.closeDrawer()),d.appendChild(this.drawerFooterBtn),this.drawerEl.appendChild(d),document.body.appendChild(this.drawerEl)}update(e,i,t,o){let r=e&&Object.keys(e).length>0,m=Object.values(i).some(a=>a.length>0)||t!==null;if(this.railEl.style.display=!r&&!m?"none":"",this.fabEl.style.display="",!r&&!m){this.fabEl.classList.add("xtal-fab-hidden");return}else this.fabEl.classList.remove("xtal-fab-hidden");this.railEl.innerHTML="",this.drawerContentEl.innerHTML="";let c=this.buildFilterSections(e,i,t,"desktop"),d=this.buildFilterSections(e,i,t,"mobile");this.railEl.appendChild(c),this.drawerContentEl.appendChild(d);let s=Object.values(i).reduce((a,l)=>a+l.length,0)+(t?1:0),p=this.fabEl.querySelector(".xtal-fab-badge");if(p&&p.remove(),s>0){let a=document.createElement("span");a.className="xtal-fab-badge",a.textContent=String(s),this.fabEl.appendChild(a)}this.drawerFooterBtn.textContent=`Show ${o} result${o!==1?"s":""}`}buildFilterSections(e,i,t,o){let r=document.createDocumentFragment();if(Object.values(i).some(s=>s.length>0)||t!==null){let s=document.createElement("div");s.className="xtal-applied-section";let p=document.createElement("div");p.className="xtal-clear-row";let a=document.createElement("button");a.className="xtal-clear-all",a.textContent="Clear all",a.addEventListener("click",()=>this.onClearAll()),p.appendChild(a),s.appendChild(p);let l=document.createElement("div");l.className="xtal-applied-chips";for(let[x,g]of Object.entries(i))for(let u of g){let y=document.createElement("button");y.className="xtal-chip",y.innerHTML=`${X(u)} <span class="xtal-chip-x">\xD7</span>`,y.addEventListener("click",()=>this.onFacetToggle(x,u)),l.appendChild(y)}if(t){let x=document.createElement("button");x.className="xtal-chip";let g=t.min&&t.max?`$${t.min}\u2013$${t.max}`:t.max?`Under $${t.max}`:`$${t.min}+`;x.innerHTML=`${g} <span class="xtal-chip-x">\xD7</span>`,x.addEventListener("click",()=>this.onPriceChange(null)),l.appendChild(x)}s.appendChild(l),r.appendChild(s)}let c=this.buildCollapsibleSection("price","Price",0,t!==null,o,()=>{let s=document.createElement("div");s.className="xtal-price-presets";for(let p of this.pricePresets){let a=document.createElement("button");a.className="xtal-price-btn",G(t,p)&&a.classList.add("xtal-price-btn-active"),a.textContent=p.label,a.addEventListener("click",()=>{G(t,p)?this.onPriceChange(null):this.onPriceChange({min:p.min,max:p.max})}),s.appendChild(a)}return s});r.appendChild(c);let d=Object.entries(e);for(let[s,p]of d){let a=i[s]||[],l=a.length,x=this.buildCollapsibleSection(s,ae(s),l,l>0,o,()=>{let g=document.createElement("div");g.className="xtal-facet-list";let u=Object.entries(p).sort((b,v)=>v[1]-b[1]),y=`${o}-${s}`,E=this.showMore[y],L=E||u.length<=H?u:u.slice(0,H),k=u.length-H;for(let[b,v]of L){let w=a.includes(b),M=v===0&&!w,T=document.createElement("label");T.className="xtal-facet-label",M&&T.classList.add("xtal-facet-disabled");let C=document.createElement("input");C.type="checkbox",C.className="xtal-facet-checkbox",C.checked=w,M&&(C.disabled=!0),C.addEventListener("change",()=>this.onFacetToggle(s,b));let N=document.createElement("span");N.className="xtal-facet-text",N.textContent=X(b);let $=document.createElement("span");$.className="xtal-facet-count",$.textContent=String(v),T.appendChild(C),T.appendChild(N),T.appendChild($),g.appendChild(T)}if(k>0){let b=document.createElement("button");b.className="xtal-show-more",b.textContent=E?"Show less":`Show ${k} more`,b.addEventListener("click",()=>{this.showMore[y]=!this.showMore[y];let v=b.parentElement;if(!v)return;let w=this.buildFacetList(s,p,a,o);v.replaceWith(w)}),g.appendChild(b)}return g});r.appendChild(x)}return r}buildFacetList(e,i,t,o){let r=document.createElement("div");r.className="xtal-facet-list";let m=`${o}-${e}`,c=Object.entries(i).sort((a,l)=>l[1]-a[1]),d=this.showMore[m],s=d||c.length<=H?c:c.slice(0,H),p=c.length-H;for(let[a,l]of s){let x=t.includes(a),g=l===0&&!x,u=document.createElement("label");u.className="xtal-facet-label",g&&u.classList.add("xtal-facet-disabled");let y=document.createElement("input");y.type="checkbox",y.className="xtal-facet-checkbox",y.checked=x,g&&(y.disabled=!0),y.addEventListener("change",()=>this.onFacetToggle(e,a));let E=document.createElement("span");E.className="xtal-facet-text",E.textContent=X(a);let L=document.createElement("span");L.className="xtal-facet-count",L.textContent=String(l),u.appendChild(y),u.appendChild(E),u.appendChild(L),r.appendChild(u)}if(p>0){let a=document.createElement("button");a.className="xtal-show-more",a.textContent=d?"Show less":`Show ${p} more`,a.addEventListener("click",()=>{this.showMore[m]=!this.showMore[m];let l=this.buildFacetList(e,i,t,o);r.replaceWith(l)}),r.appendChild(a)}return r}buildCollapsibleSection(e,i,t,o,r,m){let c=document.createElement("div");c.className="xtal-filter-section";let d=o||this.expandedSections.has(e),s=document.createElement("button");s.className="xtal-section-header";let p=document.createElement("span");if(p.className="xtal-section-label",p.textContent=i,t>0){let x=document.createElement("span");x.className="xtal-section-badge",x.textContent=String(t),p.appendChild(x)}let a=document.createElement("span");a.className="xtal-section-chevron",a.textContent=d?"\u25BE":"\u25B8",s.appendChild(p),s.appendChild(a),s.addEventListener("click",()=>{this.expandedSections.has(e)?this.expandedSections.delete(e):this.expandedSections.add(e);let x=c.querySelector(".xtal-section-content");x&&(x.style.display=x.style.display==="none"?"":"none",a.textContent=x.style.display==="none"?"\u25B8":"\u25BE")}),c.appendChild(s);let l=document.createElement("div");return l.className="xtal-section-content",d||(l.style.display="none"),l.appendChild(m()),c.appendChild(l),c}resetState(){this.showMore={}}openDrawer(){this.drawerOpen=!0,this.savedBodyOverflow=document.body.style.overflow,document.body.style.overflow="hidden",this.backdropEl.classList.add("xtal-backdrop-open"),this.drawerEl.classList.add("xtal-drawer-open")}closeDrawer(){this.drawerOpen=!1,document.body.style.overflow=this.savedBodyOverflow,this.backdropEl.classList.remove("xtal-backdrop-open"),this.drawerEl.classList.remove("xtal-drawer-open")}destroy(){this.drawerOpen&&this.closeDrawer(),this.railEl.remove(),this.fabEl.remove(),this.backdropEl.remove(),this.drawerEl.remove()}};function S(n,e){try{let i=new URL(n);return i.searchParams.set("utm_source","xtal"),i.searchParams.set("utm_medium","search"),i.searchParams.set("utm_campaign",e.shopId),i.searchParams.set("utm_content",e.productId),i.searchParams.set("utm_term",e.query),i.toString()}catch{return n}}function se(n,e){let i=Array.isArray(n.price)?n.price[0]??0:n.price,t=n.variants?.[0]?.compare_at_price,o={id:n.id??"",title:n.title??"",vendor:n.vendor??"",product_type:n.product_type??"",price:i.toFixed(2),image_url:n.image_url||n.featured_image||n.images?.[0]?.src||"",product_url:e||n.product_url||"",available:n.available?"true":"",description:n.description??""};t&&t>i&&(o.compare_at_price=t.toFixed(2));let r=n.variants?.[0];if(r&&(r.sku&&(o.sku=r.sku),r.title&&(o.variant_title=r.title)),n.tags?.length){o.tags=n.tags.join(", ");for(let m of n.tags){let c=m.indexOf(":");if(c>0){let d=m.slice(0,c).trim().toLowerCase().replace(/\s+/g,"_"),s=m.slice(c+1).trim();d&&s&&!(d in o)&&(o[d]=s)}}}return o}function oe(n,e){let i=n.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,r)=>e[o]?r:"");return i=i.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,r)=>e[o]?"":r),i}function le(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function ce(n){let e=n.replace(/<script\b[\s\S]*?<\/script>/gi,"");return e=e.replace(/<iframe\b[\s\S]*?<\/iframe>/gi,""),e=e.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,""),e=e.replace(/(href|src|action)\s*=\s*"(?:javascript|data):[^"]*"/gi,'$1=""'),e=e.replace(/(href|src|action)\s*=\s*'(?:javascript|data):[^']*'/gi,"$1=''"),e=e.replace(/(href|src|action)\s*=\s*(?:javascript|data):[^\s>]*/gi,'$1=""'),e}function de(n,e){return n.replace(/\{\{(\w+)\}\}/g,(i,t)=>le(e[t]??""))}function pe(n){let e=document.createElement("div");return e.innerHTML=ce(n.trim()),e.firstElementChild||e}function z(n,e,i,t,o,r,m){let c=se(e,m),d=oe(n,c);d=de(d,c);let s=pe(d),p=S(m||e.product_url||"#",{shopId:t,productId:e.id,query:i});return s.querySelectorAll('[data-xtal-action="view-product"]').forEach(a=>{a.tagName==="A"?(a.href=p,a.target="_blank",a.rel="noopener noreferrer"):(a.style.cursor="pointer",a.addEventListener("click",l=>{l.preventDefault(),o.onViewProduct(e)}))}),s.querySelectorAll('[data-xtal-action="add-to-cart"]').forEach(a=>{r==="fallback"&&(a.textContent="View Product"),a.addEventListener("click",async l=>{l.preventDefault(),l.stopPropagation();let x=a.textContent;a.textContent="Adding...",a.style.opacity="0.7",a.style.pointerEvents="none";try{await o.onAddToCart(e)}finally{a.textContent=x,a.style.opacity="",a.style.pointerEvents=""}})}),s}function me(n){if(Array.isArray(n)){let e=[...n].sort((i,t)=>i-t);return e.length===0?"N/A":e.length===1||e[0]===e[e.length-1]?`$${e[0].toFixed(2)}`:`$${e[0].toFixed(2)} \u2013 $${e[e.length-1].toFixed(2)}`}return`$${n.toFixed(2)}`}function Z(n,e,i,t,o,r){if(t&&o)return z(t.html,n,e,i,o);let m=n.image_url||n.featured_image||n.images&&n.images[0]?.src,c=document.createElement("a");c.className="xtal-card",c.href=S(r||n.product_url||"#",{shopId:i,productId:n.id,query:e}),c.target="_blank",c.rel="noopener noreferrer";let d=document.createElement("div");if(d.className="xtal-card-image",m){let l=document.createElement("img");l.src=m,l.alt=n.title,l.loading="lazy",d.appendChild(l)}else{let l=document.createElement("span");l.className="xtal-card-image-placeholder",l.textContent="No image",d.appendChild(l)}c.appendChild(d);let s=document.createElement("div");if(s.className="xtal-card-body",n.vendor){let l=document.createElement("div");l.className="xtal-card-vendor",l.textContent=n.vendor,s.appendChild(l)}let p=document.createElement("div");p.className="xtal-card-title",p.textContent=n.title,s.appendChild(p);let a=document.createElement("div");return a.className="xtal-card-price",a.textContent=me(n.price),s.appendChild(a),c.appendChild(s),c}function Y(n,e,i){let t=null,o=null,r=[];function m(s){let p=s.closest("form");if(p){let l=x=>{x.preventDefault(),x.stopImmediatePropagation();let g=s.value.trim();g.length>=1&&e(g)};p.addEventListener("submit",l,!0),r.push(()=>p.removeEventListener("submit",l,!0))}let a=l=>{if(l.key==="Enter"){l.preventDefault(),l.stopImmediatePropagation();let x=s.value.trim();x.length>=1&&e(x)}};s.addEventListener("keydown",a,!0),r.push(()=>s.removeEventListener("keydown",a,!0))}let c=document.querySelector(n);if(c)return m(c),()=>r.forEach(s=>s());t=new MutationObserver(s=>{for(let p of s)for(let a of Array.from(p.addedNodes)){if(!(a instanceof HTMLElement))continue;let l=a.matches(n)?a:a.querySelector(n);if(l){m(l),t?.disconnect(),t=null,o&&clearTimeout(o),o=null;return}}}),t.observe(document.body,{childList:!0,subtree:!0});let d=i??1e4;return o=setTimeout(()=>{t?.disconnect(),t=null,console.warn(`[xtal.js] Could not find input matching "${n}" after ${d/1e3}s`)},d),()=>{r.forEach(s=>s()),t?.disconnect(),t=null,o&&clearTimeout(o)}}function ue(n){return typeof n=="string"&&n.includes("/")?n.split("/").pop():n}var U=class{constructor(){this.name="shopify"}async addToCart(e,i=1){let t=e.variants?.[0]?.id;if(!t)return{success:!1,message:"No variant available"};if(!e.available)return{success:!1,message:"Product unavailable"};let o=ue(t);try{let r=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o,quantity:i})});return r.ok?{success:!0,message:"Added to cart"}:r.status===422?{success:!1,message:(await r.json().catch(()=>({}))).description||"Could not add to cart"}:{success:!1,message:`Cart error (${r.status})`}}catch(r){return{success:!1,message:r instanceof Error?r.message:"Network error"}}}};var D=class{constructor(e,i,t){this.name="fallback";this.shopId=e,this.queryFn=i,this.resolveUrl=t}async addToCart(e){let i=this.resolveUrl?.(e)??e.product_url??"#",t=S(i,{shopId:this.shopId,productId:e.id,query:this.queryFn()});return window.open(t,"_blank","noopener,noreferrer"),{success:!0,message:"Opening product page..."}}};function ee(n,e,i){return window.Shopify?new U:new D(n,e,i)}var he=new Set(["body","html","head","*"]);function fe(n,e){return n.replace(/\/\*[\s\S]*?\*\//g,"").replace(/([^{}@][^{}]*)\{([^{}]*)\}/g,(t,o,r)=>{let m=o.trim();if(!m||/^(from|to|\d[\d.]*%)/.test(m))return t;let c=m.split(",").map(d=>{let s=d.trim();return s?`${e} ${s}`:""}).filter(Boolean).join(", ");return c?`${c} { ${r} }`:t})}function W(n,e,i,t){try{let o=`${n}/api/xtal/events`,r=JSON.stringify({action:"error",collection:e,error:i,context:t,ts:Date.now()});navigator.sendBeacon?.(o,r)||fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:r,keepalive:!0}).catch(()=>{})}catch{}}function ge(){if(document.getElementById("xtal-filter-styles"))return;let n=document.createElement("style");n.id="xtal-filter-styles",n.textContent=`
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
`,document.head.appendChild(n)}function te(){try{let n=document.querySelector("script[data-shop-id]");if(!n){console.warn("[xtal.js] No <script data-shop-id> tag found");return}let e=n.getAttribute("data-shop-id")??"";if(!e){console.warn("[xtal.js] data-shop-id is empty");return}let i="",t=n.getAttribute("src");if(t)try{i=new URL(t,window.location.href).origin}catch{i=window.location.origin}else i=window.location.origin;let o=new B(i,e);o.fetchConfig().then(r=>{if(!r.enabled){console.log(`[xtal.js] Snippet disabled for ${e}`);return}let m=r.cardTemplate??null;if(m?.css){let g=document.getElementById("xtal-card-styles");g&&g.remove();let u=document.createElement("style");u.id="xtal-card-styles",u.textContent=fe(m.css,".xtal-layout"),document.head.appendChild(u)}function c(g){if(r.productUrlPattern){let y=g.variants?.[0]?.sku||"";if(y){let E=r.productUrlPattern.replace("{sku}",encodeURIComponent(y)).replace("{id}",g.id||"");if(!/^javascript:/i.test(E)&&!/^data:/i.test(E))return E}}let u=g.product_url||"#";return!u||u==="#"?"#":u.startsWith("http://")||u.startsWith("https://")?u:r.siteUrl?r.siteUrl.replace(/\/$/,"")+u:u}let d="",s=ee(e,()=>d,c);console.log(`[xtal.js] Cart adapter: ${s.name}`);let p=r.resultsSelector??"",a=!!p&&!he.has(p.trim().toLowerCase());if(!(r.displayMode==="inline"&&a)){!a&&p&&console.warn(`[xtal.js] resultsSelector "${p}" is blocked \u2014 SDK disabled`),window.XTAL={destroy(){let g=document.getElementById("xtal-card-styles");g&&g.remove(),window.XTAL=void 0}};return}{let E=function(){return u||(g=document.querySelector(p),g&&(u=new A(g),L&&u.initLayout()),u)};var x=E;let g=document.querySelector(p),u=g?new A(g):null,y=null,L=r.features?.filters===!0,k=null,b={},v=null,w=null,M=0,T={},C=null;L&&(ge(),u?.initLayout());let N=()=>{if(w||!L||!u)return;let f=u.initLayout();w=new O(f,(h,_)=>{b[h]||(b[h]=[]);let Q=b[h].indexOf(_);Q>=0?(b[h].splice(Q,1),b[h].length===0&&delete b[h]):b[h].push(_),q()},h=>{v=h,q()},()=>{b={},v=null,q()},r.pricePresets)},$={onViewProduct(f){let h=S(c(f),{shopId:e,productId:f.id,query:d});window.open(h,"_blank","noopener,noreferrer")},async onAddToCart(f){let h=await s.addToCart(f);console.log(`[xtal.js] Add to cart: ${h.success?"OK":"FAIL"} \u2014 ${h.message}`),h.success&&fetch(`${i}/api/xtal/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:f.id,action:"add_to_cart",collection:e,query:d})}).catch(()=>{})}},V=f=>f.map(h=>m?z(m.html,h,d,e,$,s.name,c(h)):Z(h,d,e,null,$,c(h))),q=()=>{!k||!u||(C&&clearTimeout(C),C=setTimeout(()=>{u?.showLoading(d),o.searchFiltered(d,k,{facetFilters:b,priceRange:v,limit:r.resultsPerPage??24}).then(f=>{M=f.total,T=f.computed_facets||{},f.results.length===0?u?.renderEmpty(d):u?.renderCards(V(f.results)),w?.update(T,b,v,M)}).catch(f=>{f instanceof DOMException&&f.name==="AbortError"||(console.error("[xtal.js] Filter error:",f),W(i,e,String(f),"filter"))})},150))},F=r.siteUrl&&(r.siteUrl.startsWith("https://")||r.siteUrl.startsWith("http://"))?r.siteUrl.replace(/\/$/,""):"",R=f=>{if(d=f,!E()){F&&(console.log("[xtal.js] No results container \u2014 navigating to search page"),window.location.href=`${F}/shop/?Search=${encodeURIComponent(f)}`);return}k=null,b={},v=null,w?.closeDrawer(),w?.resetState(),u.showLoading(f),o.searchFull(f,r.resultsPerPage??24).then(h=>{if(M=h.total,T=h.computed_facets||{},k=h.search_context||null,N(),h.results.length===0){u?.renderEmpty(f),w?.update({},{},null,0);return}u?.renderCards(V(h.results)),w?.update(T,b,v,M)}).catch(h=>{h instanceof DOMException&&h.name==="AbortError"||(console.error("[xtal.js] Search error:",h),W(i,e,String(h),"search"),u?.restore(),F&&d&&(window.location.href=`${F}/shop/?Search=${encodeURIComponent(d)}`))})},I=null,K=f=>{I&&clearTimeout(I),I=setTimeout(()=>R(f),200)},j=r.searchSelector||'input[type="search"]';y=Y(j,K,r.observerTimeoutMs);let P=null;g||(console.log(`[xtal.js] Inline mode: "${p}" not found \u2014 watching`),P=new MutationObserver(()=>{E()&&(P?.disconnect(),P=null,d&&R(d))}),P.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{P?.disconnect(),P=null},r.observerTimeoutMs??1e4));let J=document.querySelector(j);if(J?.value?.trim())R(J.value.trim());else{let f=new URLSearchParams(window.location.search),h=f.get("Search")||f.get("search");if(h?.trim()){let _=document.querySelector(j);_&&(_.value=h.trim()),R(h.trim())}}window.XTAL={search(f){f?.trim()&&K(f.trim())},destroy(){I&&clearTimeout(I),C&&clearTimeout(C),o.abort(),y?.(),P?.disconnect(),w?.destroy(),u?.destroy();let f=document.getElementById("xtal-card-styles");f&&f.remove();let h=document.getElementById("xtal-filter-styles");h&&h.remove(),window.XTAL=void 0}},console.log(`[xtal.js] Initialized INLINE for ${e}. Search: ${j}, Grid: ${r.resultsSelector}${g?"":" (deferred)"}${L?", Filters: ON":""}`)}}).catch(r=>{console.error("[xtal.js] Failed to fetch config:",r),W(i,e,String(r),"config")})}catch(n){console.error("[xtal.js] Boot error:",n)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",te):te();})();
