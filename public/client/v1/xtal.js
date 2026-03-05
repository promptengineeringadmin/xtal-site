"use strict";var XTAL=(()=>{var B=class{constructor(e,a){this.controller=null;this.apiBase=e,this.shopId=a}abort(){this.controller&&(this.controller.abort(),this.controller=null)}async fetchConfig(){let e=new AbortController,a=setTimeout(()=>e.abort(),5e3);try{let t=await fetch(`${this.apiBase}/api/xtal/config?shopId=${encodeURIComponent(this.shopId)}`,{mode:"cors",signal:e.signal});if(!t.ok)throw new Error(`Config fetch failed: ${t.status}`);return t.json()}finally{clearTimeout(a)}}async searchFull(e,a=16,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=await fetch(`${this.apiBase}/api/xtal/search-full`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,limit:a,selected_aspects:t}),signal:this.controller.signal});if(!o.ok)throw new Error(`Search failed: ${o.status}`);return o.json()}async searchFiltered(e,a,t){this.controller&&this.controller.abort(),this.controller=new AbortController;let o=t?.facetFilters&&Object.values(t.facetFilters).some(d=>d.length>0),l=t?.priceRange?{min:t.priceRange.min,max:t.priceRange.max}:void 0,s=await fetch(`${this.apiBase}/api/xtal/search`,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,collection:this.shopId,search_context:a,limit:t?.limit??24,...o?{facet_filters:t.facetFilters}:{},...l?{price_range:l}:{}}),signal:this.controller.signal});if(!s.ok)throw new Error(`Filter search failed: ${s.status}`);return s.json()}};var A=class{constructor(e){this.originalHTML=null;this.originalDisplay="";this.layoutEl=null;this.railSlot=null;this.gridSlot=null;this.loadingPhraseTimer=null;this.target=e}captureOriginal(){this.originalHTML===null&&(this.originalHTML=this.target.innerHTML,this.originalDisplay=this.target.style.display,this.target.style.display="block",this.target.style.width="100%")}initLayout(){return this.layoutEl?this.railSlot:(this.captureOriginal(),this.target.innerHTML="",this.layoutEl=document.createElement("div"),this.layoutEl.className="xtal-layout",this.railSlot=document.createElement("div"),this.railSlot.className="xtal-rail-slot",this.gridSlot=document.createElement("div"),this.gridSlot.className="xtal-grid-slot",this.layoutEl.appendChild(this.railSlot),this.layoutEl.appendChild(this.gridSlot),this.target.appendChild(this.layoutEl),this.railSlot)}showLoading(e){this.captureOriginal(),this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null);let a=this.gridSlot||this.target;if(a.innerHTML="",!document.getElementById("xtal-inline-keyframes")){let r=document.createElement("style");r.id="xtal-inline-keyframes",r.textContent=["@keyframes xtal-inline-spin{to{transform:rotate(360deg)}}","@keyframes xtal-pulse{0%,100%{opacity:1}50%{opacity:0.4}}"].join(""),document.head.appendChild(r)}let t=document.createElement("div");t.style.cssText="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;width:100%;";let o=document.createElement("div");o.style.cssText="position:relative;width:48px;height:48px;margin-bottom:12px;";let l=document.createElement("div");l.style.cssText="position:absolute;inset:0;border:3px solid #e5e5e5;border-radius:50%;";let s=document.createElement("div");s.style.cssText="position:absolute;inset:0;border:3px solid transparent;border-top-color:#1d1d1b;border-radius:50%;animation:xtal-inline-spin .8s linear infinite;";let d=document.createElement("div");if(d.style.cssText="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;",d.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:xtal-pulse 2s ease-in-out infinite"><path d="M12 3l1.91 5.49L19.4 10.4l-5.49 1.91L12 17.8l-1.91-5.49L4.6 10.4l5.49-1.91z"/><path d="M19 2l.5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5z"/><path d="M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5z"/></svg>',o.appendChild(l),o.appendChild(s),o.appendChild(d),t.appendChild(o),e){let r=e.length>80?e.slice(0,77)+"\u2026":e,c=document.createElement("p");c.style.cssText="margin:0 0 8px 0;font-size:14px;color:#555;font-style:italic;text-align:center;max-width:320px;",c.textContent=`\u201C${r}\u201D`,t.appendChild(c)}let u=["Analyzing search intent\u2026","Finding best matches\u2026","Ranking results\u2026","Almost there\u2026"],i=document.createElement("p");i.style.cssText="margin:0;font-size:13px;color:#999;text-align:center;transition:opacity 0.3s;",i.textContent=u[0],t.appendChild(i);let m=0;this.loadingPhraseTimer=setInterval(()=>{i.style.opacity="0",setTimeout(()=>{m=(m+1)%u.length,i.textContent=u[m],i.style.opacity="1"},300)},2500),a.appendChild(t)}clearPhraseTimer(){this.loadingPhraseTimer&&(clearInterval(this.loadingPhraseTimer),this.loadingPhraseTimer=null)}renderCards(e){this.clearPhraseTimer();let a=this.gridSlot||this.target;a.innerHTML="";let t=document.createElement("div");t.className="xtal-grid";for(let o of e)t.appendChild(o);a.appendChild(t)}renderEmpty(e){this.clearPhraseTimer();let a=this.gridSlot||this.target;a.innerHTML="";let t=document.createElement("div");t.style.cssText="text-align:center;padding:60px 20px;color:#888;font-size:14px;",t.textContent=`No results found for "${e}"`,a.appendChild(t)}restore(){this.layoutEl=null,this.railSlot=null,this.gridSlot=null,this.originalHTML!==null&&(this.target.innerHTML=this.originalHTML,this.target.style.display=this.originalDisplay,this.target.style.width="",this.originalHTML=null)}destroy(){this.clearPhraseTimer(),this.restore();let e=document.getElementById("xtal-inline-keyframes");e&&e.remove()}};var ne={"product-subcategory":"Category",brand:"Brand",vendor:"Vendor","product-age":"Age",proof:"Proof",region:"Region",size:"Size",terpene:"Terpene",effect:"Effect","strain-type":"Strain Type",format:"Format",material:"Material",shape:"Shape","use-case":"Use Case",feature:"Feature",design:"Design",style:"Style",color:"Color"},re=["product-subcategory","brand","vendor","strain-type","terpene","effect","format","material","use-case","style"],$=5,ae=[{label:"Under $25",max:25},{label:"$25\u2013$50",min:25,max:50},{label:"$50\u2013$100",min:50,max:100},{label:"$100\u2013$200",min:100,max:200},{label:"$200+",min:200}];function X(n){return n.split(/[-_]/).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function ie(n){return ne[n]||n.split("-").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function Q(n,e){return n?n.min===e.min&&n.max===e.max:!1}var O=class{constructor(e,a,t,o,l){this.expandedSections=new Set(["price"].concat(re));this.showMore={};this.drawerOpen=!1;this.savedBodyOverflow="";this.container=e,this.onFacetToggle=a,this.onPriceChange=t,this.onClearAll=o,this.pricePresets=l||ae,this.railEl=document.createElement("aside"),this.railEl.className="xtal-filter-rail",e.appendChild(this.railEl),this.fabEl=document.createElement("button"),this.fabEl.className="xtal-filter-fab",this.fabEl.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg><span class="xtal-fab-text">Filters</span>',this.fabEl.addEventListener("click",()=>this.openDrawer()),document.body.appendChild(this.fabEl),this.backdropEl=document.createElement("div"),this.backdropEl.className="xtal-backdrop",this.backdropEl.addEventListener("click",()=>this.closeDrawer()),document.body.appendChild(this.backdropEl),this.drawerEl=document.createElement("div"),this.drawerEl.className="xtal-filter-drawer";let s=document.createElement("div");s.className="xtal-drawer-header",s.innerHTML='<span class="xtal-drawer-title">Filters</span>';let d=document.createElement("button");d.className="xtal-drawer-close",d.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',d.setAttribute("aria-label","Close filters"),d.addEventListener("click",()=>this.closeDrawer()),s.appendChild(d),this.drawerEl.appendChild(s),this.drawerContentEl=document.createElement("div"),this.drawerContentEl.className="xtal-drawer-content",this.drawerEl.appendChild(this.drawerContentEl);let u=document.createElement("div");u.className="xtal-drawer-footer",this.drawerFooterBtn=document.createElement("button"),this.drawerFooterBtn.className="xtal-drawer-apply",this.drawerFooterBtn.textContent="Show results",this.drawerFooterBtn.addEventListener("click",()=>this.closeDrawer()),u.appendChild(this.drawerFooterBtn),this.drawerEl.appendChild(u),document.body.appendChild(this.drawerEl)}update(e,a,t,o){let l=e&&Object.keys(e).length>0,s=Object.values(a).some(r=>r.length>0)||t!==null;if(this.railEl.style.display=!l&&!s?"none":"",this.fabEl.style.display="",!l&&!s){this.fabEl.classList.add("xtal-fab-hidden");return}else this.fabEl.classList.remove("xtal-fab-hidden");this.railEl.innerHTML="",this.drawerContentEl.innerHTML="";let d=this.buildFilterSections(e,a,t,"desktop"),u=this.buildFilterSections(e,a,t,"mobile");this.railEl.appendChild(d),this.drawerContentEl.appendChild(u);let i=Object.values(a).reduce((r,c)=>r+c.length,0)+(t?1:0),m=this.fabEl.querySelector(".xtal-fab-badge");if(m&&m.remove(),i>0){let r=document.createElement("span");r.className="xtal-fab-badge",r.textContent=String(i),this.fabEl.appendChild(r)}this.drawerFooterBtn.textContent=`Show ${o} result${o!==1?"s":""}`}buildFilterSections(e,a,t,o){let l=document.createDocumentFragment();if(Object.values(a).some(i=>i.length>0)||t!==null){let i=document.createElement("div");i.className="xtal-applied-section";let m=document.createElement("div");m.className="xtal-clear-row";let r=document.createElement("button");r.className="xtal-clear-all",r.textContent="Clear all",r.addEventListener("click",()=>this.onClearAll()),m.appendChild(r),i.appendChild(m);let c=document.createElement("div");c.className="xtal-applied-chips";for(let[x,g]of Object.entries(a))for(let p of g){let y=document.createElement("button");y.className="xtal-chip",y.innerHTML=`${X(p)} <span class="xtal-chip-x">\xD7</span>`,y.addEventListener("click",()=>this.onFacetToggle(x,p)),c.appendChild(y)}if(t){let x=document.createElement("button");x.className="xtal-chip";let g=t.min&&t.max?`$${t.min}\u2013$${t.max}`:t.max?`Under $${t.max}`:`$${t.min}+`;x.innerHTML=`${g} <span class="xtal-chip-x">\xD7</span>`,x.addEventListener("click",()=>this.onPriceChange(null)),c.appendChild(x)}i.appendChild(c),l.appendChild(i)}let d=this.buildCollapsibleSection("price","Price",0,t!==null,o,()=>{let i=document.createElement("div");i.className="xtal-price-presets";for(let m of this.pricePresets){let r=document.createElement("button");r.className="xtal-price-btn",Q(t,m)&&r.classList.add("xtal-price-btn-active"),r.textContent=m.label,r.addEventListener("click",()=>{Q(t,m)?this.onPriceChange(null):this.onPriceChange({min:m.min,max:m.max})}),i.appendChild(r)}return i});l.appendChild(d);let u=Object.entries(e);for(let[i,m]of u){let r=a[i]||[],c=r.length,x=this.buildCollapsibleSection(i,ie(i),c,c>0,o,()=>{let g=document.createElement("div");g.className="xtal-facet-list";let p=Object.entries(m).sort((b,E)=>E[1]-b[1]),y=`${o}-${i}`,v=this.showMore[y],L=v||p.length<=$?p:p.slice(0,$),k=p.length-$;for(let[b,E]of L){let w=r.includes(b),M=E===0&&!w,T=document.createElement("label");T.className="xtal-facet-label",M&&T.classList.add("xtal-facet-disabled");let C=document.createElement("input");C.type="checkbox",C.className="xtal-facet-checkbox",C.checked=w,M&&(C.disabled=!0),C.addEventListener("change",()=>this.onFacetToggle(i,b));let H=document.createElement("span");H.className="xtal-facet-text",H.textContent=X(b);let I=document.createElement("span");I.className="xtal-facet-count",I.textContent=String(E),T.appendChild(C),T.appendChild(H),T.appendChild(I),g.appendChild(T)}if(k>0){let b=document.createElement("button");b.className="xtal-show-more",b.textContent=v?"Show less":`Show ${k} more`,b.addEventListener("click",()=>{this.showMore[y]=!this.showMore[y];let E=b.parentElement;if(!E)return;let w=this.buildFacetList(i,m,r,o);E.replaceWith(w)}),g.appendChild(b)}return g});l.appendChild(x)}return l}buildFacetList(e,a,t,o){let l=document.createElement("div");l.className="xtal-facet-list";let s=`${o}-${e}`,d=Object.entries(a).sort((r,c)=>c[1]-r[1]),u=this.showMore[s],i=u||d.length<=$?d:d.slice(0,$),m=d.length-$;for(let[r,c]of i){let x=t.includes(r),g=c===0&&!x,p=document.createElement("label");p.className="xtal-facet-label",g&&p.classList.add("xtal-facet-disabled");let y=document.createElement("input");y.type="checkbox",y.className="xtal-facet-checkbox",y.checked=x,g&&(y.disabled=!0),y.addEventListener("change",()=>this.onFacetToggle(e,r));let v=document.createElement("span");v.className="xtal-facet-text",v.textContent=X(r);let L=document.createElement("span");L.className="xtal-facet-count",L.textContent=String(c),p.appendChild(y),p.appendChild(v),p.appendChild(L),l.appendChild(p)}if(m>0){let r=document.createElement("button");r.className="xtal-show-more",r.textContent=u?"Show less":`Show ${m} more`,r.addEventListener("click",()=>{this.showMore[s]=!this.showMore[s];let c=this.buildFacetList(e,a,t,o);l.replaceWith(c)}),l.appendChild(r)}return l}buildCollapsibleSection(e,a,t,o,l,s){let d=document.createElement("div");d.className="xtal-filter-section";let u=o||this.expandedSections.has(e),i=document.createElement("button");i.className="xtal-section-header";let m=document.createElement("span");if(m.className="xtal-section-label",m.textContent=a,t>0){let x=document.createElement("span");x.className="xtal-section-badge",x.textContent=String(t),m.appendChild(x)}let r=document.createElement("span");r.className="xtal-section-chevron",r.textContent=u?"\u25BE":"\u25B8",i.appendChild(m),i.appendChild(r),i.addEventListener("click",()=>{this.expandedSections.has(e)?this.expandedSections.delete(e):this.expandedSections.add(e);let x=d.querySelector(".xtal-section-content");x&&(x.style.display=x.style.display==="none"?"":"none",r.textContent=x.style.display==="none"?"\u25B8":"\u25BE")}),d.appendChild(i);let c=document.createElement("div");return c.className="xtal-section-content",u||(c.style.display="none"),c.appendChild(s()),d.appendChild(c),d}resetState(){this.showMore={}}openDrawer(){this.drawerOpen=!0,this.savedBodyOverflow=document.body.style.overflow,document.body.style.overflow="hidden",this.backdropEl.classList.add("xtal-backdrop-open"),this.drawerEl.classList.add("xtal-drawer-open")}closeDrawer(){this.drawerOpen=!1,document.body.style.overflow=this.savedBodyOverflow,this.backdropEl.classList.remove("xtal-backdrop-open"),this.drawerEl.classList.remove("xtal-drawer-open")}destroy(){this.drawerOpen&&this.closeDrawer(),this.railEl.remove(),this.fabEl.remove(),this.backdropEl.remove(),this.drawerEl.remove()}};function S(n,e){try{let a=new URL(n);return a.searchParams.set("utm_source","xtal"),a.searchParams.set("utm_medium","search"),a.searchParams.set("utm_campaign",e.shopId),a.searchParams.set("utm_content",e.productId),a.searchParams.set("utm_term",e.query),a.toString()}catch{return n}}function se(n,e){let a=Array.isArray(n.price)?n.price[0]??0:n.price,t=n.variants?.[0]?.compare_at_price,o={id:n.id??"",title:n.title??"",vendor:n.vendor??"",product_type:n.product_type??"",price:a.toFixed(2),image_url:n.image_url||n.featured_image||n.images?.[0]?.src||"",product_url:e||n.product_url||"",available:n.available?"true":"",description:n.description??""};t&&t>a&&(o.compare_at_price=t.toFixed(2));let l=n.variants?.[0];if(l&&(l.sku&&(o.sku=l.sku),l.title&&(o.variant_title=l.title)),n.tags?.length){o.tags=n.tags.join(", ");for(let s of n.tags){let d=s.indexOf(":");if(d>0){let u=s.slice(0,d).trim().toLowerCase().replace(/\s+/g,"_"),i=s.slice(d+1).trim();u&&i&&!(u in o)&&(o[u]=i)}}}return o}function oe(n,e){let a=n.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,l)=>e[o]?l:"");return a=a.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(t,o,l)=>e[o]?"":l),a}function le(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function ce(n){let e=n.replace(/<script\b[\s\S]*?<\/script>/gi,"");return e=e.replace(/<iframe\b[\s\S]*?<\/iframe>/gi,""),e=e.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,""),e=e.replace(/(href|src|action)\s*=\s*"(?:javascript|data):[^"]*"/gi,'$1=""'),e=e.replace(/(href|src|action)\s*=\s*'(?:javascript|data):[^']*'/gi,"$1=''"),e=e.replace(/(href|src|action)\s*=\s*(?:javascript|data):[^\s>]*/gi,'$1=""'),e}function de(n,e){return n.replace(/\{\{(\w+)\}\}/g,(a,t)=>le(e[t]??""))}function pe(n){let e=document.createElement("div");return e.innerHTML=ce(n.trim()),e.firstElementChild||e}function z(n,e,a,t,o,l,s){let d=se(e,s),u=oe(n,d);u=de(u,d);let i=pe(u),m=S(s||e.product_url||"#",{shopId:t,productId:e.id,query:a});return i.querySelectorAll('[data-xtal-action="view-product"]').forEach(r=>{r.tagName==="A"?(r.href=m,r.target="_blank",r.rel="noopener noreferrer"):(r.style.cursor="pointer",r.addEventListener("click",c=>{c.preventDefault(),o.onViewProduct(e)}))}),i.querySelectorAll('[data-xtal-action="add-to-cart"]').forEach(r=>{l==="fallback"&&(r.textContent="View Product"),r.addEventListener("click",async c=>{c.preventDefault(),c.stopPropagation();let x=r.textContent;r.textContent="Adding...",r.style.opacity="0.7",r.style.pointerEvents="none";try{await o.onAddToCart(e)}finally{r.textContent=x,r.style.opacity="",r.style.pointerEvents=""}})}),i}function me(n){if(Array.isArray(n)){let e=[...n].sort((a,t)=>a-t);return e.length===0?"N/A":e.length===1||e[0]===e[e.length-1]?`$${e[0].toFixed(2)}`:`$${e[0].toFixed(2)} \u2013 $${e[e.length-1].toFixed(2)}`}return`$${n.toFixed(2)}`}function Z(n,e,a,t,o,l){if(t&&o)return z(t.html,n,e,a,o);let s=n.image_url||n.featured_image||n.images&&n.images[0]?.src,d=document.createElement("a");d.className="xtal-card",d.href=S(l||n.product_url||"#",{shopId:a,productId:n.id,query:e}),d.target="_blank",d.rel="noopener noreferrer";let u=document.createElement("div");if(u.className="xtal-card-image",s){let c=document.createElement("img");c.src=s,c.alt=n.title,c.loading="lazy",u.appendChild(c)}else{let c=document.createElement("span");c.className="xtal-card-image-placeholder",c.textContent="No image",u.appendChild(c)}d.appendChild(u);let i=document.createElement("div");if(i.className="xtal-card-body",n.vendor){let c=document.createElement("div");c.className="xtal-card-vendor",c.textContent=n.vendor,i.appendChild(c)}let m=document.createElement("div");m.className="xtal-card-title",m.textContent=n.title,i.appendChild(m);let r=document.createElement("div");return r.className="xtal-card-price",r.textContent=me(n.price),i.appendChild(r),d.appendChild(i),d}function Y(n,e,a){let t=null,o=null,l=[];function s(i){let m=i.closest("form");if(m){let c=x=>{x.preventDefault(),x.stopImmediatePropagation();let g=i.value.trim();g.length>=1&&e(g)};m.addEventListener("submit",c,!0),l.push(()=>m.removeEventListener("submit",c,!0))}let r=c=>{if(c.key==="Enter"){c.preventDefault(),c.stopImmediatePropagation();let x=i.value.trim();x.length>=1&&e(x)}};i.addEventListener("keydown",r,!0),l.push(()=>i.removeEventListener("keydown",r,!0))}let d=document.querySelector(n);if(d)return s(d),()=>l.forEach(i=>i());t=new MutationObserver(i=>{for(let m of i)for(let r of Array.from(m.addedNodes)){if(!(r instanceof HTMLElement))continue;let c=r.matches(n)?r:r.querySelector(n);if(c){s(c),t?.disconnect(),t=null,o&&clearTimeout(o),o=null;return}}}),t.observe(document.body,{childList:!0,subtree:!0});let u=a??1e4;return o=setTimeout(()=>{t?.disconnect(),t=null,console.warn(`[xtal.js] Could not find input matching "${n}" after ${u/1e3}s`)},u),()=>{l.forEach(i=>i()),t?.disconnect(),t=null,o&&clearTimeout(o)}}function ue(n){return typeof n=="string"&&n.includes("/")?n.split("/").pop():n}var U=class{constructor(){this.name="shopify"}async addToCart(e,a=1){let t=e.variants?.[0]?.id;if(!t)return{success:!1,message:"No variant available"};if(!e.available)return{success:!1,message:"Product unavailable"};let o=ue(t);try{let l=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o,quantity:a})});return l.ok?{success:!0,message:"Added to cart"}:l.status===422?{success:!1,message:(await l.json().catch(()=>({}))).description||"Could not add to cart"}:{success:!1,message:`Cart error (${l.status})`}}catch(l){return{success:!1,message:l instanceof Error?l.message:"Network error"}}}};var D=class{constructor(e,a,t){this.name="fallback";this.shopId=e,this.queryFn=a,this.resolveUrl=t}async addToCart(e){let a=this.resolveUrl?.(e)??e.product_url??"#",t=S(a,{shopId:this.shopId,productId:e.id,query:this.queryFn()});return window.open(t,"_blank","noopener,noreferrer"),{success:!0,message:"Opening product page..."}}};function ee(n,e,a){return window.Shopify?new U:new D(n,e,a)}var he=new Set(["body","html","head","*"]);function fe(n,e){return n.replace(/\/\*[\s\S]*?\*\//g,"").replace(/([^{}@][^{}]*)\{([^{}]*)\}/g,(t,o,l)=>{let s=o.trim();if(!s||/^(from|to|\d[\d.]*%)/.test(s))return t;let d=s.split(",").map(u=>{let i=u.trim();return i?`${e} ${i}`:""}).filter(Boolean).join(", ");return d?`${d} { ${l} }`:t})}function W(n,e,a,t){try{let o=`${n}/api/xtal/events`,l=JSON.stringify({action:"error",collection:e,error:a,context:t,ts:Date.now()});navigator.sendBeacon?.(o,l)||fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:l,keepalive:!0}).catch(()=>{})}catch{}}function ge(){if(document.getElementById("xtal-filter-styles"))return;let n=document.createElement("style");n.id="xtal-filter-styles",n.textContent=`
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
`,document.head.appendChild(n)}function te(){try{let n=document.querySelector("script[data-shop-id]"),e=window.XTAL_CONFIG,a=n?.getAttribute("data-shop-id")||e?.shopId||"";if(!a){console.warn("[xtal.js] No shopId found \u2014 need <script data-shop-id> or window.XTAL_CONFIG = { shopId: '...' }");return}let t="",o=n?.getAttribute("src");if(o)try{t=new URL(o,window.location.href).origin}catch{}t||(t=e?.apiBase||"https://www.xtalsearch.com");let l=new B(t,a);l.fetchConfig().then(s=>{if(!s.enabled){console.log(`[xtal.js] Snippet disabled for ${a}`);return}let d=s.cardTemplate??null;if(d?.css){let g=document.getElementById("xtal-card-styles");g&&g.remove();let p=document.createElement("style");p.id="xtal-card-styles",p.textContent=fe(d.css,".xtal-layout"),document.head.appendChild(p)}function u(g){if(s.productUrlPattern){let y=g.variants?.[0]?.sku||"";if(y){let v=s.productUrlPattern.replace("{sku}",encodeURIComponent(y)).replace("{id}",g.id||"");if(!/^javascript:/i.test(v)&&!/^data:/i.test(v))return v}}let p=g.product_url||"#";return!p||p==="#"?"#":p.startsWith("http://")||p.startsWith("https://")?p:s.siteUrl?s.siteUrl.replace(/\/$/,"")+p:p}let i="",m=ee(a,()=>i,u);console.log(`[xtal.js] Cart adapter: ${m.name}`);let r=s.resultsSelector??"",c=!!r&&!he.has(r.trim().toLowerCase());if(!(s.displayMode==="inline"&&c)){!c&&r&&console.warn(`[xtal.js] resultsSelector "${r}" is blocked \u2014 SDK disabled`),window.XTAL={destroy(){let g=document.getElementById("xtal-card-styles");g&&g.remove(),window.XTAL=void 0}};return}{let g=document.querySelector(r),p=g?new A(g):null,y=null,v=()=>p||(g=document.querySelector(r),g&&(p=new A(g),L&&p.initLayout()),p),L=s.features?.filters===!0,k=null,b={},E=null,w=null,M=0,T={},C=null;L&&(ge(),p?.initLayout());let H=()=>{if(w||!L||!p)return;let f=p.initLayout();w=new O(f,(h,_)=>{b[h]||(b[h]=[]);let G=b[h].indexOf(_);G>=0?(b[h].splice(G,1),b[h].length===0&&delete b[h]):b[h].push(_),q()},h=>{E=h,q()},()=>{b={},E=null,q()},s.pricePresets)},I={onViewProduct(f){let h=S(u(f),{shopId:a,productId:f.id,query:i});window.open(h,"_blank","noopener,noreferrer")},async onAddToCart(f){let h=await m.addToCart(f);console.log(`[xtal.js] Add to cart: ${h.success?"OK":"FAIL"} \u2014 ${h.message}`),h.success&&fetch(`${t}/api/xtal/events`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product_id:f.id,action:"add_to_cart",collection:a,query:i})}).catch(()=>{})}},V=f=>f.map(h=>d?z(d.html,h,i,a,I,m.name,u(h)):Z(h,i,a,null,I,u(h))),q=()=>{!k||!p||(C&&clearTimeout(C),C=setTimeout(()=>{p?.showLoading(i),l.searchFiltered(i,k,{facetFilters:b,priceRange:E,limit:s.resultsPerPage??24}).then(f=>{M=f.total,T=f.computed_facets||{},f.results.length===0?p?.renderEmpty(i):p?.renderCards(V(f.results)),w?.update(T,b,E,M)}).catch(f=>{f instanceof DOMException&&f.name==="AbortError"||(console.error("[xtal.js] Filter error:",f),W(t,a,String(f),"filter"))})},150))},F=s.siteUrl&&(s.siteUrl.startsWith("https://")||s.siteUrl.startsWith("http://"))?s.siteUrl.replace(/\/$/,""):"",R=f=>{if(i=f,!v()){F&&(console.log("[xtal.js] No results container \u2014 navigating to search page"),window.location.href=`${F}/shop/?Search=${encodeURIComponent(f)}`);return}k=null,b={},E=null,w?.closeDrawer(),w?.resetState(),p.showLoading(f),l.searchFull(f,s.resultsPerPage??24).then(h=>{if(M=h.total,T=h.computed_facets||{},k=h.search_context||null,H(),h.results.length===0){p?.renderEmpty(f),w?.update({},{},null,0);return}p?.renderCards(V(h.results)),w?.update(T,b,E,M)}).catch(h=>{h instanceof DOMException&&h.name==="AbortError"||(console.error("[xtal.js] Search error:",h),W(t,a,String(h),"search"),p?.restore(),F&&i&&(window.location.href=`${F}/shop/?Search=${encodeURIComponent(i)}`))})},N=null,K=f=>{N&&clearTimeout(N),N=setTimeout(()=>R(f),200)},j=s.searchSelector||'input[type="search"]';y=Y(j,K,s.observerTimeoutMs);let P=null;g||(console.log(`[xtal.js] Inline mode: "${r}" not found \u2014 watching`),P=new MutationObserver(()=>{v()&&(P?.disconnect(),P=null,i&&R(i))}),P.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{P?.disconnect(),P=null},s.observerTimeoutMs??1e4));let J=document.querySelector(j);if(J?.value?.trim())R(J.value.trim());else{let f=new URLSearchParams(window.location.search),h=f.get("Search")||f.get("search");if(h?.trim()){let _=document.querySelector(j);_&&(_.value=h.trim()),R(h.trim())}}window.XTAL={search(f){f?.trim()&&K(f.trim())},destroy(){N&&clearTimeout(N),C&&clearTimeout(C),l.abort(),y?.(),P?.disconnect(),w?.destroy(),p?.destroy();let f=document.getElementById("xtal-card-styles");f&&f.remove();let h=document.getElementById("xtal-filter-styles");h&&h.remove(),window.XTAL=void 0}},console.log(`[xtal.js] Initialized INLINE for ${a}. Search: ${j}, Grid: ${s.resultsSelector}${g?"":" (deferred)"}${L?", Filters: ON":""}`)}}).catch(s=>{console.error("[xtal.js] Failed to fetch config:",s),W(t,a,String(s),"config")})}catch(n){console.error("[xtal.js] Boot error:",n)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",te):te();})();
