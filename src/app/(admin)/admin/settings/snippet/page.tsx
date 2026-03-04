"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Save, Loader2, Copy, Check } from "lucide-react"
import SubPageHeader from "@/components/admin/SubPageHeader"
import { useCollection } from "@/lib/admin/CollectionContext"

export default function SnippetSettingsPage() {
  const { collection } = useCollection()
  const [origins, setOrigins] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [newOrigin, setNewOrigin] = useState("")
  const [inputError, setInputError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchOrigins = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/settings?collection=${collection}`)
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const data = await res.json()
      setOrigins(data.allowed_origins || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }, [collection])

  useEffect(() => {
    fetchOrigins()
  }, [fetchOrigins])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch(`/api/admin/settings?collection=${collection}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowed_origins: origins }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Failed: ${res.status}`)
      }
      setDirty(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  function normalizeOrigin(raw: string): string {
    let value = raw.trim()
    if (!value) return ""
    // Auto-prepend https:// if no scheme
    if (!value.startsWith("http://") && !value.startsWith("https://")) {
      value = `https://${value}`
    }
    return value
  }

  function validateOrigin(value: string): string | null {
    try {
      const url = new URL(value)
      // Origin = scheme + host (no path)
      if (url.pathname !== "/" && url.pathname !== "") {
        return "Origin should not include a path"
      }
      const origin = url.origin
      if (origins.includes(origin)) {
        return "This origin is already in the list"
      }
      return null
    } catch {
      return "Invalid URL format"
    }
  }

  function addOrigin() {
    setInputError(null)
    const normalized = normalizeOrigin(newOrigin)
    if (!normalized) return

    const validationError = validateOrigin(normalized)
    if (validationError) {
      setInputError(validationError)
      return
    }

    const origin = new URL(normalized).origin
    setOrigins((prev) => [...prev, origin])
    setNewOrigin("")
    setDirty(true)
  }

  function removeOrigin(index: number) {
    setOrigins((prev) => prev.filter((_, i) => i !== index))
    setDirty(true)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <SubPageHeader
          backHref="/admin/settings"
          backLabel="Settings"
          title="Snippet & Deployment"
          description="Manage SDK embedding and security settings."
        />
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shrink-0 ${
            dirty
              ? "bg-xtal-navy text-white hover:bg-xtal-navy/90"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Save
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          Allowed origins saved. Changes take effect within 60 seconds.
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse"
            >
              <div className="h-5 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-2">
            <h2 className="text-sm font-semibold text-slate-700">
              Allowed Origins
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Restrict which domains can use the XTAL search API for this
              collection. Leave empty to allow all domains.
            </p>
          </div>

          {/* Existing origins */}
          <div className="space-y-2 mb-4">
            {origins.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                <p className="text-sm text-slate-500">
                  No origins configured — API accepts requests from any domain.
                </p>
              </div>
            )}

            {origins.map((origin, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between"
              >
                <span className="text-sm font-mono text-slate-700">
                  {origin}
                </span>
                <button
                  onClick={() => removeOrigin(i)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Add origin form */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">
              Add Origin
            </h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={newOrigin}
                  onChange={(e) => {
                    setNewOrigin(e.target.value)
                    setInputError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addOrigin()
                    }
                  }}
                  placeholder="e.g. https://www.mystore.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-xtal-navy/20 focus:border-xtal-navy/40"
                />
                {inputError && (
                  <p className="text-xs text-red-500 mt-1">{inputError}</p>
                )}
              </div>
              <button
                onClick={addOrigin}
                disabled={!newOrigin.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg
                           bg-xtal-navy text-white hover:bg-xtal-navy/90 transition-colors
                           disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
          </div>

          {/* GTM Snippet */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">
                  GTM Snippet
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add as a Custom HTML tag in Google Tag Manager. Trigger: All Pages.
                </p>
              </div>
              <button
                onClick={() => {
                  const el = document.getElementById("gtm-snippet-content")
                  if (el) {
                    navigator.clipboard.writeText(el.textContent || "")
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                           bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
              <pre id="gtm-snippet-content" className="text-xs text-slate-100 font-mono whitespace-pre-wrap break-all">
{`<script src="https://www.xtalsearch.com/client/v1/xtal.js" data-shop-id="${collection}"></script>
<script>
(function(){
  if(document.getElementById('xtal-hero-banner')){return;}
  var s=document.createElement('style');
  s.id='xtal-hero-styles';
  s.textContent='.xtal-hero-wrapper{margin-top:40px;width:100%;background:#f8f6f2;padding:40px 64px 16px;font-family:"Manrope",sans-serif;box-sizing:border-box}.xtal-hero-wrapper *{box-sizing:border-box}.xtal-hero-container{display:grid;grid-template-columns:40% 1fr;gap:48px;align-items:end;margin:0 auto;max-width:1400px;text-align:left}.xtal-hero-left{margin-bottom:0}.xtal-hero-right{display:flex;flex-direction:column}.xtal-hero-headline{font-size:50px;font-weight:500;color:#1D1D1B;margin:0 0 8px 0;line-height:1.1;letter-spacing:-0.01em;font-family:"SpratFont",serif}.xtal-hero-subtext{font-size:16px;color:#545454;margin:0;line-height:1.5;font-family:"Manrope",sans-serif}.xtal-hero-form{margin:0 0 12px 0;position:relative}.xtal-hero-input-group{display:flex;align-items:center;background:#FFF;border:1.5px solid #2E4324;border-radius:8px;height:52px;position:relative;overflow:hidden;transition:box-shadow .2s ease}.xtal-hero-input-group:focus-within{box-shadow:0 0 0 3px rgba(46,67,36,.15);border-color:#2E4324}.xtal-hero-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:18px;height:18px;color:#5C5C5C;pointer-events:none}.xtal-hero-input{flex-grow:1;height:100%;border:none;background:transparent;padding:0 16px 0 44px;font-size:16px;font-family:"Manrope",sans-serif;color:#1D1D1B;outline:none;width:100%}.xtal-hero-input::placeholder{color:#5C5C5C}.xtal-hero-submit{background:#2E4324;color:#FFF;border:none;height:100%;padding:0 20px;font-size:15px;font-weight:400;cursor:pointer;transition:background .15s ease;font-family:"Manrope",sans-serif}.xtal-hero-submit:hover{background:#1F2E18}.xtal-hero-chips{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;padding-left:36px;padding-right:90px;margin-bottom:12px}.xtal-hero-chip{background:#FFF;color:#2E4324;border:1px solid #2E4324;border-radius:20px;font-size:13px;padding:6px 14px;cursor:pointer;transition:all .2s ease;font-family:"Manrope",sans-serif;white-space:nowrap;outline:none}.xtal-hero-chip:hover{background:#F2F4EF}.xtal-hero-chip.xtal-hero-chip-active{background:#2E4324;color:#FFF}.xtal-hero-powered-by{display:flex;justify-content:flex-end;align-items:center;gap:6px;margin:0;text-decoration:none;font-family:"Manrope",sans-serif;transition:opacity .2s ease}.xtal-hero-powered-by:hover{opacity:.7}.xtal-hero-powered-by::after{display:none!important;content:none!important}.xtal-hero-powered-label{font-size:11px;color:#787878}.xtal-hero-powered-logo{display:flex;align-items:center;gap:3px}.xtal-hero-powered-logo svg{width:12px;height:12px}.xtal-hero-powered-logo span{font-size:12px;font-weight:700;color:#1B2D5B;letter-spacing:0.25em}@media(max-width:992px){.xtal-hero-container{grid-template-columns:1fr;align-items:center;text-align:center;gap:24px}.xtal-hero-subtext{margin:0 auto;max-width:600px}.xtal-hero-chips{justify-content:center;padding-right:0}.xtal-hero-powered-by{justify-content:center}}@media(max-width:768px){.xtal-hero-wrapper{padding:32px 32px 16px;margin-top:32px}.xtal-hero-headline{font-size:40px}.xtal-hero-input-group{height:48px}}@media(max-width:480px){.xtal-hero-wrapper{padding:24px 16px 12px;margin-top:24px;overflow:hidden}.xtal-hero-headline{font-size:32px}.xtal-hero-subtext{font-size:14px}.xtal-hero-input-group{height:44px}.xtal-hero-submit{padding:0 16px}.xtal-hero-chips-wrap{position:relative}.xtal-hero-chips-wrap::after{content:"";position:absolute;right:0;top:0;bottom:0;width:40px;background:linear-gradient(to right,transparent,#f8f6f2);pointer-events:none;z-index:1}.xtal-hero-chips{flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px;scrollbar-width:none}.xtal-hero-chips::-webkit-scrollbar{display:none}.xtal-hero-chip{font-size:12px;padding:5px 12px}.xtal-hero-powered-by{justify-content:flex-end}}';
  document.head.appendChild(s);
  var html='<div class="xtal-hero-wrapper" role="search" aria-label="Product search" id="xtal-hero-banner"><div class="xtal-hero-container"><div class="xtal-hero-left"><h2 class="xtal-hero-headline">Try Our Intuitive Catalog Search:</h2><p class="xtal-hero-subtext">Search by SKU, keyword, or just describe what you need.</p></div><div class="xtal-hero-right"><form class="xtal-hero-form" role="search"><div class="xtal-hero-input-group"><svg class="xtal-hero-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/></svg><input type="text" class="xtal-hero-input" placeholder="Search our catalog..." aria-label="Search Willow Group products" autocomplete="off"><button type="submit" class="xtal-hero-submit">Search</button></div></form><div class="xtal-hero-chips-wrap"><div class="xtal-hero-chips" role="group" aria-label="Example search queries"></div></div><a href="https://www.xtalsearch.com" class="xtal-hero-powered-by" target="_blank" rel="noopener noreferrer"><span class="xtal-hero-powered-label">Powered by</span><span class="xtal-hero-powered-logo"><svg viewBox="0 0 100 100" fill="#1B2D5B" xmlns="http://www.w3.org/2000/svg"><rect x="42" y="10" width="16" height="35" rx="8" transform="rotate(45 50 50)"/><rect x="42" y="55" width="16" height="35" rx="8" transform="rotate(45 50 50)"/><rect x="10" y="42" width="35" height="16" rx="8" transform="rotate(45 50 50)"/><rect x="55" y="42" width="35" height="16" rx="8" transform="rotate(45 50 50)"/></svg><span>XTAL</span></span></a></div></div></div>';
  var target=document.querySelector('#pos_6829');
  if(target){target.insertAdjacentHTML('afterend',html);}
  else{console.warn('[xtal-hero] #pos_6829 not found');return;}
  var banner=document.getElementById('xtal-hero-banner');
  if(!banner)return;
  var queries=[{text:"what's new this spring",label:"New"},{text:"something to display wine bottles",label:"Display"},{text:"gift baskets and packaging for christmas",label:"Packaging"},{text:"small decorative pots",label:"Decor"},{text:"dried flower bouquets",label:"Garden & Floral"},{text:"Easter table decorations",label:"Seasonal"}];
  var chipsContainer=banner.querySelector('.xtal-hero-chips');
  var input=banner.querySelector('.xtal-hero-input');
  var form=banner.querySelector('.xtal-hero-form');
  queries.forEach(function(q,i){var btn=document.createElement('button');btn.type='button';btn.className='xtal-hero-chip';btn.setAttribute('aria-label','Try searching for: '+q.text);btn.textContent=q.label;btn.dataset.index=i;chipsContainer.appendChild(btn);});
  var chips=Array.from(chipsContainer.querySelectorAll('.xtal-hero-chip'));
  form.addEventListener('submit',function(e){e.preventDefault();var val=input.value.trim();if(val){window.location.href='/shop/?Referrer=AppSearch&Search='+encodeURIComponent(val)+'&orderBy=Featured,Id&context=shop&page=1';}});
  var queryIndex=0,charIndex=0,state='TYPING',delay=50,timer=0,lastTime=0,isPaused=false,rafId;
  function tick(time){if(!lastTime)lastTime=time;var dt=time-lastTime;lastTime=time;if(!isPaused){timer+=dt;if(timer>=delay){timer=0;var currentText=queries[queryIndex].text;if(state==='TYPING'){charIndex++;input.setAttribute('placeholder',currentText.substring(0,charIndex));chips.forEach(function(c,i){c.classList.toggle('xtal-hero-chip-active',i===queryIndex);});if(charIndex===currentText.length){state='PAUSING';delay=1500;}else{delay=50;}}else if(state==='PAUSING'){state='TYPING';charIndex=0;queryIndex=(queryIndex+1)%queries.length;input.setAttribute('placeholder','');delay=50;}}}rafId=requestAnimationFrame(tick);}
  rafId=requestAnimationFrame(tick);
  var resumeTimeout;
  input.addEventListener('focus',function(){isPaused=true;clearTimeout(resumeTimeout);input.setAttribute('placeholder','Search our catalog...');chips.forEach(function(c){c.classList.remove('xtal-hero-chip-active');});});
  input.addEventListener('blur',function(){if(!input.value){resumeTimeout=setTimeout(function(){isPaused=false;charIndex=0;input.setAttribute('placeholder','');},3000);}});
  chips.forEach(function(chip){chip.addEventListener('click',function(){var index=parseInt(chip.dataset.index,10);isPaused=true;clearTimeout(resumeTimeout);input.value=queries[index].text;chips.forEach(function(c){c.classList.remove('xtal-hero-chip-active');});chip.classList.add('xtal-hero-chip-active');input.focus();});});
  window.xtalHeroRemove=function(){cancelAnimationFrame(rafId);clearTimeout(resumeTimeout);banner.remove();var styleEl=document.getElementById('xtal-hero-styles');if(styleEl)styleEl.remove();delete window.xtalHeroRemove;};
})();
</script>`}
              </pre>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
