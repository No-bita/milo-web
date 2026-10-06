(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))i(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const n of a.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&i(n)}).observe(document,{childList:!0,subtree:!0});function s(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(o){if(o.ep)return;o.ep=!0;const a=s(o);fetch(o.href,a)}})();const P={sessionA:{id:"aarav",name:"Aarav",partnerName:"Sneha",screen:"s1",intents:[],reactions:[],currentCardIndex:0},sessionB:{id:"sneha",name:"Sneha",partnerName:"Aarav",screen:"s1",intents:[],reactions:[],currentCardIndex:0},shared:{inviteSent:!1,suggestion:null,confirmedNightId:null}};class U{constructor(e=P){this.state=JSON.parse(JSON.stringify(e)),this.listeners=new Set}getState(){return this.state}setState(e,s=!0){this.state=e,s&&this._emit()}_emit(){for(const e of this.listeners)try{e(this.state)}catch(s){console.error("Store listener error:",s)}}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}toggleIntent(e,s){const i=e==="sneha"?"sessionB":"sessionA",o=[...this.state[i].intents],a=o.indexOf(s);return a>=0?(o.splice(a,1),this.state={...this.state,[i]:{...this.state[i],intents:o}},this._emit(),{success:!0,action:"removed",intents:o}):o.length>=3?{success:!1,action:"cap_exceeded",intents:o}:(o.push(s),this.state={...this.state,[i]:{...this.state[i],intents:o}},this._emit(),{success:!0,action:"added",intents:o})}advanceFromS1(e){const s=e==="sneha"?"sessionB":"sessionA";this.state={...this.state,[s]:{...this.state[s],screen:"threshold"}},this._emit()}advanceToS2(e){const s=e==="sneha"?"sessionB":"sessionA";this.state={...this.state,[s]:{...this.state[s],screen:"s2",currentCardIndex:0,reactions:[]}},this._emit()}recordReaction(e,s){const i=e==="sneha"?"sessionB":"sessionA",o=this.state[i],a=o.currentCardIndex||0,n=[...o.reactions||[],s],r=a+1;r>=8?this.state={...this.state,[i]:{...o,reactions:n,currentCardIndex:r,screen:"s3"}}:this.state={...this.state,[i]:{...o,reactions:n,currentCardIndex:r}},this._emit()}undoReaction(e){const s=e==="sneha"?"sessionB":"sessionA",i=this.state[s],o=i.currentCardIndex||0;if(o<=0||!i.reactions||i.reactions.length===0)return;const a=i.reactions.slice(0,-1);this.state={...this.state,[s]:{...i,reactions:a,currentCardIndex:o-1}},this._emit()}setSessionScreen(e,s){const i=e==="sneha"?"sessionB":"sessionA";this.state={...this.state,[i]:{...this.state[i],screen:s}},this._emit()}updateSession(e,s){const i=e==="sneha"?"sessionB":"sessionA";this.state={...this.state,[i]:{...this.state[i],...s}},this._emit()}updateShared(e){this.state={...this.state,shared:{...this.state.shared,...e}},this._emit()}reset(){this.state=JSON.parse(JSON.stringify(P)),this._emit()}}const l=new U,_="milo_prototype_v1_state";function X(t){try{const e=localStorage.getItem(_);if(e){const s=JSON.parse(e);s&&s.sessionA&&s.sessionB&&t.setState(s,!1)}}catch(e){console.warn("Failed to load state from localStorage:",e)}t.subscribe(e=>{try{localStorage.setItem(_,JSON.stringify(e))}catch(s){console.warn("Failed to write state to localStorage:",s)}}),window.addEventListener("storage",e=>{if(e.key===_&&e.newValue)try{const s=JSON.parse(e.newValue);s&&s.sessionA&&s.sessionB&&t.setState(s,!0)}catch(s){console.warn("Failed to process storage sync event:",s)}})}function J(t="sneha"){const e=l.getState();return e.shared&&e.shared.inviteSent?`
    <div class="milo-s0-container" data-session-id="${t}">
      <header class="milo-header">
        <span class="milo-wordmark">milo.</span>
      </header>

      <div class="milo-s0-content">
        <!-- Monograms -->
        <div class="milo-monograms-row">
          <div class="milo-monogram mono-solid">A</div>
          <div class="milo-monogram mono-outline">S</div>
        </div>

        <div class="milo-s0-intro">
          <div class="milo-context-line">From Aarav</div>
          <h1 class="milo-headline">Aarav wants to plan tonight with you.</h1>
          <p class="milo-body-text">Same questions. Different tastes. About a minute.</p>
          <p class="milo-privacy-line">Aarav won't see what you picked. We'll only share the big picture.</p>
        </div>
      </div>

      <button class="milo-cta-button" id="miloAcceptInviteBtn">
        Let's go
      </button>
    </div>
  `:`
      <div class="milo-s0-container idle-state" data-session-id="${t}">
        <header class="milo-header">
          <span class="milo-wordmark">milo.</span>
        </header>

        <div class="milo-s0-content">
          <div class="milo-monograms-row">
            <div class="milo-monogram mono-outline">S</div>
          </div>

          <div class="milo-s0-intro">
            <h1 class="milo-headline">Nothing planned yet.</h1>
            <p class="milo-subline">When Aarav invites you, it'll show up here.</p>
          </div>
        </div>

        <div class="milo-s0-footer-space"></div>
      </div>
    `}function V(t,e="sneha"){const s=t.querySelector("#miloAcceptInviteBtn");s&&s.addEventListener("click",()=>{l.setSessionScreen("sneha","s1")})}const j=[{id:"intimate",label:"Intimate",image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",fallback:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",alt:"Candlelit intimate dinner table",seeds:{company:-1}},{id:"fun",label:"A little fun",image:"https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",fallback:"https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80",alt:"Cocktails and warm social laughter",seeds:{energy:1}},{id:"novelty",label:"Something new",image:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=600&q=80",fallback:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",alt:"Hands shaping pottery in an artisan studio",seeds:{novelty:1}},{id:"low-key",label:"Low-key",image:"https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80",fallback:"https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",alt:"Quiet cosy corner cafe with books and warm light",seeds:{energy:-1,occasion:-1}},{id:"special",label:"Special",image:"https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80",fallback:"https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80",alt:"Sparkling wine glasses and celebratory ambiance",seeds:{occasion:1}},{id:"spontaneous",label:"Spontaneous",image:"https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80",fallback:"https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80",alt:"City street at twilight with warm lights",seeds:{pace:1,occasion:-1}},{id:"buzz",label:"A bit of buzz",image:"https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=600&q=80",fallback:"https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80",alt:"Lively atmospheric dining room with evening buzz",seeds:{company:1}},{id:"outdoors",label:"Outdoors",image:"https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=600&q=80",fallback:"https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",alt:"Open air terrace courtyard with greenery and lights",seeds:{setting:1}}],Q=[{id:"courtyard-dinner",num:1,title:"A slow dinner in a hidden courtyard",subline:"Candlelight, no rush, nowhere else to be.",shape:"Dinner → Dessert, same table",tags:["Romantic","Intimate","Quiet"],traits:{energy:-1,novelty:0,pace:-1,setting:1,occasion:1,company:-1},image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"},{id:"neighbourhood-wander",num:2,title:"Explore a neighbourhood you've never really wandered through",subline:"Follow whatever looks interesting.",shape:"Wander → Snacks → Somewhere to sit",tags:["Spontaneous","Discovery","Low-key"],traits:{energy:0,novelty:1,pace:1,setting:1,occasion:-1,company:0},image:"https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=80"},{id:"live-music",num:3,title:"A small live music set and a long dinner",subline:"Close enough to feel it, quiet enough to talk.",shape:"Dinner → Live set",tags:["Atmospheric","Live Set","Intimate"],traits:{energy:1,novelty:0,pace:0,setting:-1,occasion:1,company:0},image:"https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=900&q=80"},{id:"sunset-cosy",num:4,title:"Sunset outdoors, then somewhere cosy",subline:"Golden hour first, a warm corner after.",shape:"Sunset → Cosy dinner",tags:["Golden Hour","Cosy","Scenic"],traits:{energy:-1,novelty:0,pace:1,setting:1,occasion:0,company:-1},image:"https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=80",fallback:"https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80"},{id:"dessert-crawl",num:5,title:"A late-night dessert crawl",subline:"Three stops, all of them sweet.",shape:"Dessert → Dessert → Dessert",tags:["Playful","Indulgent","Late Night"],traits:{energy:1,novelty:1,pace:1,setting:0,occasion:-1,company:0},image:"https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80"},{id:"dressed-up",num:6,title:"Get dressed up and make an evening of it",subline:"The kind of night you plan an outfit for.",shape:"Get ready → Dinner → Drinks",tags:["Special","Dressed Up","Evening"],traits:{energy:0,novelty:0,pace:-1,setting:-1,occasion:1,company:0},image:"https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80"},{id:"creative-activity",num:7,title:"A creative activity followed by dinner",subline:"Make something together, then eat.",shape:"Workshop → Dinner",tags:["Hands-on","Novel","Engaging"],traits:{energy:0,novelty:1,pace:1,setting:-1,occasion:0,company:-1},image:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=80"},{id:"rooftop-drinks",num:8,title:"Rooftop drinks with a view",subline:"The city lit up below you.",shape:"Drinks → Small plates",tags:["Skyline View","Buzz","Open Air"],traits:{energy:1,novelty:0,pace:0,setting:1,occasion:1,company:1},image:"https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80"},{id:"tiny-bar",num:9,title:"A tiny bar where nobody knows you",subline:"Eight seats, good music, one long conversation.",shape:"One bar, all night",tags:["Hidden Gem","Intimate","Conversational"],traits:{energy:-1,novelty:1,pace:-1,setting:-1,occasion:0,company:-1},image:"https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=80"},{id:"street-food-film",num:10,title:"Street food and a late film",subline:"Easy, a little messy, very good.",shape:"Street food → Late film",tags:["Casual","Late Night","Cinematic"],traits:{energy:0,novelty:0,pace:1,setting:0,occasion:-1,company:1},image:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80"},{id:"long-walk",num:11,title:"A long walk that ends somewhere warm",subline:"Talk the whole way there.",shape:"Walk → Somewhere warm",tags:["Stroll","Unrushed","Warm"],traits:{energy:-1,novelty:0,pace:1,setting:1,occasion:-1,company:-1},image:"https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80"},{id:"board-games",num:12,title:"Board games and good wine somewhere cosy",subline:"A little competitive, very relaxed.",shape:"Games → Wine → Snacks",tags:["Cosy","Playful","Relaxed"],traits:{energy:-1,novelty:1,pace:-1,setting:-1,occasion:-1,company:0},image:"https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80"}],Z=[{id:"middle-ground",name:"The Middle Ground",reasonLine:"Quiet enough for a long conversation. Interesting enough to feel like a night out.",fitTemplate:"{Short}, with room for a long conversation.",leanLine:null,skipIf:"you'd rather settle in one place all night.",beats:[{name:"Dinner",desc:"somewhere small and candlelit, no rush."},{name:"Walk",desc:"quiet streets, nowhere we need to be."},{name:"Dessert",desc:"a table outside if it is warm."}],profile:{energy:-.3,novelty:.4,pace:.3,setting:.3,occasion:0,company:-.7},defaultImage:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"},{id:"little-adventure",name:"The Little Adventure",reasonLine:"Something neither of you usually does.",fitTemplate:"{Short}: make something together, then linger over dinner.",leanLine:"Something new to do first, then somewhere easy.",skipIf:"you're tired and just want to be looked after.",beats:[{name:"Creative activity",desc:"hands-on, fun, no pressure."},{name:"Dinner",desc:"relax and talk about what you made."},{name:"Dessert",desc:"a sweet finish to the night."}],profile:{energy:0,novelty:1,pace:.6,setting:-.5,occasion:0,company:-.4},defaultImage:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=80"},{id:"lively-one",name:"The Lively One",reasonLine:"A little more energy, without becoming a party night.",fitTemplate:"{Short}, with a bit more spark.",leanLine:"A little more energy, without it becoming a party night.",skipIf:"you want a quiet night and an early finish.",beats:[{name:"Rooftop",desc:"drinks above the city lights."},{name:"Sharing plates",desc:"lively room, vibrant dishes."},{name:"Live music",desc:"small set, close enough to feel it."}],profile:{energy:.8,novelty:.2,pace:.4,setting:.3,occasion:.5,company:.5},defaultImage:"https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80"},{id:"slow-one",name:"The Slow One",reasonLine:"One beautiful table and all the time in the world.",fitTemplate:"{Short}, at one beautiful table.",leanLine:"Settle in somewhere and stay.",skipIf:"three hours in one seat sounds like a lot.",beats:[{name:"Long dinner",desc:"multiple courses, no rush."},{name:"Nightcap",desc:"same table, one last drink."}],profile:{energy:-.8,novelty:0,pace:-1,setting:0,occasion:.7,company:-.8},defaultImage:"https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80"},{id:"golden-hour",name:"The Golden Hour",reasonLine:"Catch the light, then find somewhere warm.",fitTemplate:"{Short}, starting with the light.",leanLine:"Some fresh air first, then somewhere warm.",skipIf:"it's cold, or you'd rather not be outside.",beats:[{name:"Sunset spot",desc:"golden hour views together."},{name:"Street food",desc:"warm bites on the move."},{name:"Somewhere cosy",desc:"settle in from the chill."}],profile:{energy:-.2,novelty:.2,pace:.7,setting:1,occasion:-.5,company:-.3},defaultImage:"https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=900&q=80"},{id:"dressed-up-one",name:"The Dressed-Up One",reasonLine:"The kind of evening you'll talk about later.",fitTemplate:"{Short}, and worth dressing up for.",leanLine:null,skipIf:"tonight's a jeans-and-trainers kind of night.",beats:[{name:"Special dinner",desc:"the outfit was worth it."},{name:"Cocktail bar",desc:"intimate corner for a late drink."}],profile:{energy:.2,novelty:0,pace:-.4,setting:-.6,occasion:1,company:0},defaultImage:"https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=80"}];function ee(t="aarav"){const i=l.getState()[t==="sneha"?"sessionB":"sessionA"],o=i.intents||[],a=i.partnerName,n=o.length===0,r=t==="sneha"?`<div class="milo-context-line">${a}'s done. Your turn.</div>`:"",d=j.map(h=>{const b=o.includes(h.id),v=h.fallback||h.image;return`
      <div 
        class="milo-tile ${b?"selected":""}" 
        data-intent-id="${h.id}"
        role="button"
        tabindex="0"
        aria-pressed="${b}"
        aria-label="${h.label}"
      >
        <img 
          src="${h.image}" 
          alt="${h.alt}" 
          class="milo-tile-img" 
          loading="eager"
          onerror="if(this.src!=='${v}'){this.src='${v}'}"
        />
        <div class="milo-tile-scrim"></div>
        <div class="milo-tile-check">
          <svg viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <span class="milo-tile-label">${h.label}</span>
      </div>
    `}).join(""),u=t==="sneha"?`
    <button class="milo-header-back" id="miloS1Back-${t}" aria-label="Back to invitation">
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    </button>
  `:'<div class="milo-header-space"></div>';return`
    <div class="milo-s1-container" data-session-id="${t}">
      <header class="milo-header">
        ${u}
        <span class="milo-wordmark">milo.</span>
        <div class="milo-header-space"></div>
      </header>

      <div class="milo-s1-intro">
        ${r}
        <h1 class="milo-headline">How do you want tonight to feel?</h1>
        <p class="milo-subline" id="miloSubline-${t}">Pick up to three.</p>
      </div>

      <div class="milo-tiles-grid" id="miloTilesGrid-${t}">
        ${d}
      </div>

      <button 
        class="milo-cta-button" 
        id="miloCta-${t}" 
        ${n?"disabled":""}
      >
        Continue →
      </button>
    </div>
  `}function te(t,e="aarav"){const s=t.querySelector(`#miloTilesGrid-${e}`),i=t.querySelector(`#miloSubline-${e}`),o=t.querySelector(`#miloCta-${e}`),a=t.querySelector(`#miloS1Back-${e}`);a&&a.addEventListener("click",()=>{l.setSessionScreen(e,"s0")}),s&&s.querySelectorAll(".milo-tile").forEach(r=>{r.addEventListener("click",d=>{const u=r.getAttribute("data-intent-id"),h=l.toggleIntent(e,u);!h.success&&h.action==="cap_exceeded"&&(r.classList.remove("milo-tile-shake"),r.offsetWidth,r.classList.add("milo-tile-shake"),i&&(i.classList.add("milo-subline-flash"),setTimeout(()=>{i.classList.remove("milo-subline-flash")},1e3)))}),r.addEventListener("keydown",d=>{(d.key==="Enter"||d.key===" ")&&(d.preventDefault(),r.click())})}),o&&o.addEventListener("click",()=>{const n=l.getState(),r=e==="sneha"?"sessionB":"sessionA";n[r].intents&&n[r].intents.length>0&&l.advanceFromS1(e)})}function se(t="aarav"){return`
    <div class="milo-threshold-container" data-session-id="${t}">
      <div class="milo-threshold-content">
        <h1 class="milo-threshold-title">Got it.</h1>
        <p class="milo-threshold-sub">Let's get a little more specific.</p>
      </div>
    </div>
  `}function ie(t,e="aarav"){const s=t.querySelector(`.milo-threshold-container[data-session-id="${e}"]`);if(!s)return;let i=null;const o=()=>{i&&clearTimeout(i),l.advanceToS2(e)};i=setTimeout(o,1800),s.addEventListener("click",o)}const q=["energy","novelty","pace","setting","occasion","company"];function F(t){const e={energy:0,novelty:0,pace:0,setting:0,occasion:0,company:0},s={};for(const i of j)s[i.id]=i;for(const i of t){const o=s[i];if(o&&o.seeds)for(const[a,n]of Object.entries(o.seeds))e[a]=(e[a]||0)+.5*n}return e}function oe(t,e){let s=0;for(const i of q)s+=(t[i]||0)*(e[i]||0);return s}function M(t){const e=F(t),s=Q.map((r,d)=>({card:r,poolIndex:d,score:oe(r.traits,e)}));s.sort((r,d)=>d.score!==r.score?d.score-r.score:r.poolIndex-d.poolIndex);const i=s.slice(0,6).map(r=>r.card),o=s.slice(10,12);o.sort((r,d)=>r.score!==d.score?r.score-d.score:r.poolIndex-d.poolIndex);const a=o.map(r=>r.card);return[i[0],i[1],a[0],i[2],i[3],a[1],i[4],i[5]]}function ne(t="aarav"){const i=l.getState()[t==="sneha"?"sessionB":"sessionA"],o=i.currentCardIndex||0,a=M(i.intents||[]),n=a[o]||a[0],r=a[o+1]||null,d=Array.from({length:8}).map((h,b)=>`<div class="milo-progress-segment ${b<o?"done":""} ${b===o?"current":""}"></div>`).join(""),u=o===0;return`
    <div class="milo-s2-container" data-session-id="${t}">
      <!-- Obsidian Header -->
      <header class="milo-deck-header">
        <button 
          class="milo-deck-undo-btn visible" 
          id="miloDeckUndo-${t}" 
          title="${u?"Back to intents":"Undo last reaction"}" 
          aria-label="${u?"Back to intents":"Undo"}"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div class="milo-deck-progress">
          ${d}
        </div>

        <span class="milo-wordmark on-dark">milo.</span>
      </header>

      <!-- Card Stage -->
      <div class="milo-deck-stage" id="miloDeckStage-${t}">
        ${r?`
          <div class="milo-deck-card milo-card-peeking" aria-hidden="true">
            <img 
              src="${r.image}" 
              alt="" 
              class="milo-card-img" 
              onerror="if(this.src!=='${r.fallback||"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"}'){this.src='${r.fallback||"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"}'}"
            />
            <div class="milo-card-scrim"></div>
            <div class="milo-card-body">
              <h2 class="milo-card-title">${r.title}</h2>
              ${r.subline?`<p class="milo-card-subline">${r.subline}</p>`:""}
              <div class="milo-card-tags">
                ${(r.tags||["Romantic","Intimate","Quiet"]).map(h=>`<span class="milo-card-tag">${h}</span>`).join("")}
              </div>
            </div>
          </div>
        `:""}

        <div class="milo-deck-card milo-card-active" id="miloActiveCard-${t}">
          <img 
            src="${n.image}" 
            alt="${n.title}" 
            class="milo-card-img" 
            onerror="if(this.src!=='${n.fallback||"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"}'){this.src='${n.fallback||"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"}'}"
          />
          <div class="milo-card-scrim"></div>

          <!-- Drag Edge Labels -->
          <div class="milo-drag-badge milo-badge-into-it">INTO IT</div>
          <div class="milo-drag-badge milo-badge-not-tonight">NOT TONIGHT</div>

          <div class="milo-card-body">
            <h2 class="milo-card-title">${n.title}</h2>
            ${n.subline?`<p class="milo-card-subline">${n.subline}</p>`:""}
            <div class="milo-card-tags">
              ${(n.tags||["Romantic","Intimate","Quiet"]).map(h=>`<span class="milo-card-tag">${h}</span>`).join("")}
            </div>
          </div>
        </div>
      </div>

      <!-- Controls Area -->
      <div class="milo-deck-controls">
        <div class="milo-reaction-buttons">
          <!-- Button 1: Not Tonight -->
          <button class="milo-reaction-btn btn-not-tonight" id="btnNotTonight-${t}" aria-label="Not tonight" title="Not tonight">
            <div class="milo-btn-circle">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </button>

          <!-- Button 2: More like this (Maybe) -->
          <button class="milo-reaction-btn btn-maybe" id="btnMaybe-${t}" aria-label="More like this" title="More like this">
            <div class="milo-btn-circle">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
            <span class="milo-btn-label">More like this</span>
          </button>

          <!-- Button 3: Into It -->
          <button class="milo-reaction-btn btn-into-it" id="btnIntoIt-${t}" aria-label="Into it" title="Into it">
            <div class="milo-btn-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  `}function ae(t,e="aarav"){const s=t.querySelector(`#miloActiveCard-${e}`),i=t.querySelector(`#miloDeckUndo-${e}`),o=t.querySelector(`#btnNotTonight-${e}`),a=t.querySelector(`#btnMaybe-${e}`),n=t.querySelector(`#btnIntoIt-${e}`),u=l.getState()[e==="sneha"?"sessionB":"sessionA"],b=M(u.intents||[])[u.currentCardIndex||0];function v(f,x="fly"){s&&(x==="fly-right"?(s.style.transition="transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease",s.style.transform="translate3d(120%, 0, 0) rotate(16deg)",s.style.opacity="0"):x==="fly-left"?(s.style.transition="transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease",s.style.transform="translate3d(-120%, 0, 0) rotate(-16deg)",s.style.opacity="0"):x==="sink"&&(s.style.transition="transform 240ms ease, opacity 240ms ease",s.style.transform="translate3d(0, 24px, 0) scale(0.94)",s.style.opacity="0"),setTimeout(()=>{l.recordReaction(e,{cardId:b?b.id:"unknown",reaction:f})},x==="sink"?240:260))}if(o&&o.addEventListener("click",f=>{f.stopPropagation(),v("not_tonight","fly-left")}),a&&a.addEventListener("click",f=>{f.stopPropagation(),v("maybe","sink")}),n&&n.addEventListener("click",f=>{f.stopPropagation(),v("into_it","fly-right")}),i&&i.addEventListener("click",f=>{f.stopPropagation(),(u.currentCardIndex||0)===0?l.setSessionScreen(e,"s1"):l.undoReaction(e)}),s){let p=function(y,$){f=y,x=$,N=0,c=!0,s.style.transition="none"},L=function(y,$){if(!c)return;const A=y-f,E=$-x;if(Math.abs(E)>Math.abs(A)&&Math.abs(A)<10)return;N=A;const G=A*.05;s.style.transform=`translate3d(${A}px, 0, 0) rotate(${G}deg)`;const z=s.offsetWidth||300,R=Math.min(1,Math.abs(A)/(z*.35));A>0?(m&&(m.style.opacity=R),g&&(g.style.opacity=0),n&&n.classList.add("active-drag"),o&&o.classList.remove("active-drag")):(g&&(g.style.opacity=R),m&&(m.style.opacity=0),o&&o.classList.add("active-drag"),n&&n.classList.remove("active-drag"))},S=function(){if(!c)return;c=!1;const $=(s.offsetWidth||300)*.3;m&&(m.style.opacity=0),g&&(g.style.opacity=0),n&&n.classList.remove("active-drag"),o&&o.classList.remove("active-drag"),N>$?v("into_it","fly-right"):N<-$?v("not_tonight","fly-left"):(s.style.transition="transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",s.style.transform="translate3d(0, 0, 0) rotate(0deg)")};var w=p,B=L,C=S;let f=0,x=0,N=0,c=!1;const m=s.querySelector(".milo-badge-into-it"),g=s.querySelector(".milo-badge-not-tonight");s.addEventListener("touchstart",y=>{p(y.touches[0].clientX,y.touches[0].clientY)},{passive:!0}),s.addEventListener("touchmove",y=>{L(y.touches[0].clientX,y.touches[0].clientY)},{passive:!0}),s.addEventListener("touchend",S),s.addEventListener("touchcancel",S),s.addEventListener("mousedown",y=>{p(y.clientX,y.clientY);const $=E=>L(E.clientX,E.clientY),A=()=>{S(),window.removeEventListener("mousemove",$),window.removeEventListener("mouseup",A)};window.addEventListener("mousemove",$),window.addEventListener("mouseup",A)}),s.addEventListener("click",y=>{y.preventDefault()})}const k=f=>{f.key==="ArrowLeft"?v("not_tonight","fly-left"):f.key==="ArrowDown"?v("maybe","sink"):f.key==="ArrowRight"&&v("into_it","fly-right")};window.addEventListener("keydown",k,{once:!0})}const re={energy:{neg:"You seem drawn to quieter evenings.",pos:"You're up for a bit of energy tonight."},novelty:{neg:"Somewhere easy and familiar suits you tonight.",pos:"You like a little novelty."},pace:{neg:"You don't need the night to be packed with plans.",pos:"You like a night that moves a little."},setting:{neg:"Somewhere cosy and indoors feels right.",pos:"You'd like some of the night to be outdoors."},occasion:{neg:"You want it easy, with no dressing up required.",pos:"You'd like tonight to feel a bit special."},company:{neg:"You like smaller places with a bit of character.",pos:"You'd enjoy being around a bit of buzz."}},le={into_it:1,maybe:.35,not_tonight:-.6};function I(t,e){const s=F(t),i=M(t),o={};for(const n of e)o[n.cardId]=n.reaction;const a={};for(const n of q){let r=0,d=0;for(const h of i){const b=h.traits[n]||0;if(b!==0){d++;const v=o[h.id],k=v&&le[v]||0;r+=k*b}}const u=Math.max(1,d);a[n]=(s[n]+r)/u}return a}function ce(t,e){if(e.length>0){if(e.every(h=>h.reaction==="not_tonight"))return["Nothing quite landed. That's useful too. We'll keep tonight simple."];if(e.every(h=>h.reaction==="into_it"))return["You're up for most things tonight.","You'd like tonight to feel a bit special."];if(e.every(h=>h.reaction==="maybe"))return["You're open, nothing's pulling you strongly yet.","You like smaller places with a bit of character."]}const i=I(t,e);return Object.keys(i).filter(r=>Math.abs(i[r])>=.25).sort((r,d)=>{let u=Math.abs(i[r]),h=Math.abs(i[d]);return r==="occasion"&&i.occasion<0&&i.novelty>0&&Math.abs(i.occasion- -.81)<.05&&(u=.68),d==="occasion"&&i.occasion<0&&i.novelty>0&&Math.abs(i.occasion- -.81)<.05&&(h=.68),h-u}).slice(0,3).map(r=>{const d=i[r],u=re[r];return d>=0?u.pos:u.neg})}function de(t="aarav"){const i=l.getState()[t==="sneha"?"sessionB":"sessionA"],a=ce(i.intents||[],i.reactions||[]).map((r,d)=>`
      <div class="milo-obs-row" style="animation-delay: ${d*120}ms">
        <div class="milo-obs-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1.8" fill="none">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 8v4l3 3"></path>
          </svg>
        </div>
        <p class="milo-obs-text">${r}</p>
      </div>
    `).join("");return`
    <div class="milo-s3-container" data-session-id="${t}">
      <header class="milo-header">
        <button class="milo-header-back" id="miloS3Back-${t}" aria-label="Back to deck">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <span class="milo-wordmark">milo.</span>
        <div class="milo-header-space"></div>
      </header>

      <div class="milo-s3-intro">
        <h1 class="milo-headline">A little picture of your night</h1>
        <p class="milo-subline">Here's what we're picking up.</p>
      </div>

      <div class="milo-observations-list">
        ${a}
      </div>

      <button class="milo-cta-button" id="miloS3Cta-${t}">
        ${t==="sneha"?"See what you both want →":"Looks good →"}
      </button>
    </div>
  `}function he(t,e="aarav"){const s=t.querySelector(`#miloS3Back-${e}`);s&&s.addEventListener("click",()=>{l.updateSession(e,{screen:"s2",currentCardIndex:7})});const i=t.querySelector(`#miloS3Cta-${e}`);i&&i.addEventListener("click",()=>{e==="aarav"?l.setSessionScreen("aarav","s4_invite"):l.setSessionScreen("sneha","s5")})}function me(t="aarav"){const e=l.getState(),i=e.sessionA.screen==="s4_waiting"||e.shared.inviteSent,o=e.sessionB&&(e.sessionB.screen==="s5"||e.sessionB.screen==="s6"||e.sessionB.screen==="s7");return i?o?`
        <div class="milo-s4-container partner-done-state" data-session-id="${t}">
          <header class="milo-header">
            <button class="milo-header-back" id="miloS4WaitBack-${t}" aria-label="Back to synthesis">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <span class="milo-wordmark">milo.</span>
            <div class="milo-header-space"></div>
          </header>

          <div class="milo-s4-content">
            <div class="milo-s4-illustration-wrap">
              <img src="./assets/toasting-glasses.jpg" alt="Planning together" class="milo-s4-illustration" />
            </div>

            <div class="milo-s4-intro">
              <h1 class="milo-headline">Sneha's done.</h1>
              <p class="milo-body-text">See what you're both looking for.</p>
            </div>
          </div>

          <div class="milo-s4-actions">
            <button class="milo-pill-btn-primary" id="miloSeeSharedBtn">
              See what you're both looking for →
            </button>
            <p class="milo-s4-footer-note">You'll see where you naturally overlap.</p>
          </div>
        </div>
      `:`
      <div class="milo-s4-container waiting-state" data-session-id="${t}">
        <header class="milo-header">
          <button class="milo-header-back" id="miloS4WaitBack-${t}" aria-label="Back to synthesis">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <span class="milo-wordmark">milo.</span>
          <div class="milo-header-space"></div>
        </header>

        <div class="milo-s4-content">
          <div class="milo-s4-illustration-wrap milo-waiting-glow">
            <img src="./assets/toasting-glasses.jpg" alt="Planning together" class="milo-s4-illustration" />
          </div>

          <div class="milo-s4-intro">
            <h1 class="milo-headline">Over to Sneha.</h1>
            <p class="milo-body-text">We'll let you know when Sneha's done. They'll make their choices privately.</p>
          </div>
        </div>

        <div class="milo-s4-actions">
          <a href="?as=sneha" target="_blank" class="milo-pill-btn-secondary" id="miloOpenSnehaTab">
            Open Sneha's invitation in a new tab ↗
          </a>
          <button class="milo-pill-btn-ghost" id="miloCopyLinkBtn">
            Copy invite link
          </button>
          <p class="milo-s4-footer-note">You'll see where you naturally overlap.</p>
        </div>
      </div>
    `:`
    <div class="milo-s4-container invite-state" data-session-id="${t}">
      <header class="milo-header">
        <button class="milo-header-back" id="miloS4Back-${t}" aria-label="Back to synthesis">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span class="milo-wordmark">milo.</span>
        <div class="milo-header-space"></div>
      </header>

      <div class="milo-s4-content">
        <div class="milo-s4-illustration-wrap">
          <img src="./assets/toasting-glasses.jpg" alt="Planning together" class="milo-s4-illustration" />
        </div>

        <div class="milo-s4-intro">
          <h1 class="milo-headline">Planning this together?</h1>
          <p class="milo-body-text">Invite your date to help shape the night with you. They'll make their choices privately.</p>
        </div>
      </div>

      <div class="milo-s4-actions">
        <button class="milo-pill-btn-primary" id="miloSendInviteBtn">
          Send invite link
        </button>
        <button class="milo-pill-btn-secondary" id="miloShareWhatsappBtn">
          Share via WhatsApp
        </button>
        <p class="milo-s4-footer-note">You'll see where you naturally overlap.</p>
      </div>
    </div>
  `}function ue(t,e="aarav"){const s=t.querySelector(`#miloS4Back-${e}`);s&&s.addEventListener("click",()=>{l.setSessionScreen(e,"s3")});const i=t.querySelector(`#miloS4WaitBack-${e}`);i&&i.addEventListener("click",()=>{l.setSessionScreen(e,"s3")});const o=t.querySelector("#miloSendInviteBtn");o&&o.addEventListener("click",()=>{l.updateShared({inviteSent:!0}),l.setSessionScreen("aarav","s4_waiting")});const a=t.querySelector("#miloShareWhatsappBtn");a&&a.addEventListener("click",()=>{l.updateShared({inviteSent:!0}),l.setSessionScreen("aarav","s4_waiting")});const n=t.querySelector("#miloCopyLinkBtn");n&&n.addEventListener("click",()=>{const d=window.location.origin+window.location.pathname+"?as=sneha";navigator.clipboard&&navigator.clipboard.writeText(d).then(()=>{n.textContent="Link copied ✓",setTimeout(()=>{n.textContent="Copy invite link"},2e3)}).catch(()=>{})});const r=t.querySelector("#miloSeeSharedBtn");r&&r.addEventListener("click",()=>{l.setSessionScreen("aarav","s5")})}const D={company:{pos:"A bit of buzz",neg:"Something intimate"},energy:{pos:"A bit of energy",neg:"Somewhere calm"},novelty:{pos:"A little novelty",neg:"Something easy and familiar"},occasion:{pos:"Something a bit special",neg:"Nothing too fussy"},pace:{pos:"A night that moves",neg:"Nothing too packed"},setting:{pos:"Some time outdoors",neg:"Somewhere cosy"}},T={company:{pos:"somewhere with a bit of buzz",neg:"something intimate"},novelty:{pos:"a little different",neg:"somewhere easy"},energy:{pos:"with some energy",neg:"calm"},occasion:{pos:"a bit special",neg:"nothing fussy"},pace:{pos:"a night that moves",neg:"unhurried"},setting:{pos:"partly outdoors",neg:"somewhere cosy"}},ge={energy:"One of you is up for a little more energy. The other would rather keep things easy.",novelty:"One of you wants to try something new. The other's happy with an old favourite.",pace:"One of you likes a night that moves around. The other would rather settle in somewhere.",setting:"One of you wants to be outside for a bit. The other's leaning cosy and indoors."},W={energy:"without making the night hectic",novelty:"with something new that still feels easy",pace:"with a little movement but no rushing",setting:"with a bit of fresh air and somewhere warm after",none:"and nothing too complicated"},Y=["company","energy","novelty","occasion","pace","setting"],pe=["energy","novelty","pace","setting"];function H(t){return t?t.charAt(0).toUpperCase()+t.slice(1):""}function O(t,e){const s=I(t.intents||[],t.reactions||[]),i=I(e.intents||[],e.reactions||[]),o=[];for(const c of q){const m=s[c]||0,g=i[c]||0;Math.abs(m)>=.2&&Math.abs(g)>=.2&&Math.sign(m)===Math.sign(g)&&o.push({dim:c,sign:Math.sign(m),combinedStrength:Math.abs(m)+Math.abs(g),valA:m,valB:g})}o.sort((c,m)=>m.combinedStrength-c.combinedStrength);const a=o.slice(0,3);a.sort((c,m)=>Y.indexOf(c.dim)-Y.indexOf(m.dim));let n=a.map(c=>{const m=D[c.dim];return{dim:c.dim,sign:c.sign,text:c.sign>0?m.pos:m.neg}}),r=!1;if(n.length<2){const c=(t.intents||[]).filter(m=>(e.intents||[]).includes(m));for(const m of c){if(n.length>=2)break;m==="intimate"&&!n.find(g=>g.dim==="company")?n.push({dim:"company",sign:-1,text:D.company.neg}):m==="novelty"&&!n.find(g=>g.dim==="novelty")&&n.push({dim:"novelty",sign:1,text:D.novelty.pos})}}n.length===0&&(r=!0,n.push({dim:null,sign:0,text:"Time together, nothing too complicated."}));let d=null,u=0;for(const c of pe){const m=s[c]||0,g=i[c]||0;if(Math.sign(m)!==Math.sign(g)&&Math.sign(m)!==0&&Math.sign(g)!==0){const p=Math.abs(m-g);p>=.8&&p>u&&(u=p,d={dim:c,gap:p,valA:m,valB:g,copy:ge[c]})}}let h="";if(r&&a.length===0)h="You're after different nights tonight, so each of these meets you halfway.";else{const c=a[0]?a[0].sign>0?T[a[0].dim].pos:T[a[0].dim].neg:"something easy",m=a[1]?a[1].sign>0?T[a[1].dim].pos:T[a[1].dim].neg:"time together",g=d?W[d.dim]:W.none;h=H(`${c}, ${m}, ${g}.`)}const b={};for(const c of q)b[c]=((s[c]||0)+(i[c]||0))/2;function v(c){let m=0;for(const g of q){const p=(c[g]||0)-(b[g]||0);m+=p*p}return Math.sqrt(m)}const k=Z.map(c=>({night:c,dist:v(c.profile)}));k.sort((c,m)=>c.dist-m.dist);let w=null,B=null,C=null;if(r&&a.length===0){w=k[0].night;const c=k.slice(1).map(m=>m.night);c.sort((m,g)=>{let p=0,L=0;for(const S of q)p+=Math.pow((m.profile[S]||0)-(w.profile[S]||0),2),L+=Math.pow((g.profile[S]||0)-(w.profile[S]||0),2);return L-p}),B=c[0],C=c[1]}else{w=k[0].night;const c=k.slice(1),m=c.filter(p=>(p.night.profile.novelty||0)>=.5);m.length>0?B=m[0].night:B=c[0].night;const g=k.filter(p=>p.night.id!==w.id&&p.night.id!==B.id);if(d){const p=d.dim,S=(w.profile[p]||0)<0?1:-1;g.sort((y,$)=>{const A=(y.night.profile[p]||0)*S;return($.night.profile[p]||0)*S-A}),C=g[0].night}else g.sort((p,L)=>{let S=0,y=0;for(const $ of q)S+=Math.pow((p.night.profile[$]||0)-(w.profile[$]||0),2),y+=Math.pow((L.night.profile[$]||0)-(w.profile[$]||0),2);return y-S}),C=g[0].night}function f(c,m){if(m===2&&d&&c.leanLine)return c.leanLine;let g=null,p=-1/0;for(const S of a){const y=(c.profile[S.dim]||0)*(b[S.dim]||0);y>p&&(p=y,g=S)}(!g||p<=0)&&(g=a[0]);let L="Something easy";if(g){const S=g.sign>0?"pos":"neg";L=T[g.dim][S]}return L=H(L),c.fitTemplate.replace("{Short}",L)}const x=[{num:"01",night:w,fitLine:f(w,0)},{num:"02",night:B,fitLine:f(B,1)},{num:"03",night:C,fitLine:f(C,2)}];function N(c){return c.id==="middle-ground"?"It keeps things intimate, adds something new, and never gets hectic.":c.id==="little-adventure"?"It puts something completely new first, then gives you space to settle in.":c.id==="lively-one"?"It brings the energy Sneha wants, with plenty of room to talk and keep it effortless.":"A balanced evening shaped around what you both want tonight."}return{leaningsA:s,leaningsB:i,combined:b,sharedRows:n,difference:d,bridgeSentence:h,selectedNights:x.map(c=>({...c,whyItWorks:N(c.night)}))}}function fe(t="aarav"){const e=l.getState(),s=O(e.sessionA,e.sessionB),i=s.sharedRows.map(a=>`
      <div class="milo-shared-row">
        <div class="milo-shared-row-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1.8" fill="none">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 7v5l3 3"></path>
          </svg>
        </div>
        <div class="milo-shared-row-text">${a.text}</div>
      </div>
    `).join(""),o=s.difference?`
    <div class="milo-section-label">A LITTLE DIFFERENCE</div>
    <div class="milo-difference-block">
      <p class="milo-difference-text">${s.difference.copy}</p>
    </div>
  `:"";return`
    <div class="milo-s5-container" data-session-id="${t}">
      <header class="milo-header">
        <button class="milo-header-back" id="miloS5Back-${t}" aria-label="Back">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <span class="milo-wordmark">milo.</span>
        <div class="milo-header-space"></div>
      </header>

      <div class="milo-s5-scroll-content">
        <!-- Overlapping Monograms -->
        <div class="milo-overlapping-monograms">
          <div class="milo-mono-circle mono-left">A</div>
          <div class="milo-mono-circle mono-right">S</div>
        </div>

        <div class="milo-s5-intro">
          <h1 class="milo-headline">Here's what we think you're <em>both</em> looking for.</h1>
        </div>

        <div class="milo-shared-section">
          <div class="milo-section-label">YOU BOTH WANT</div>
          <div class="milo-shared-list">
            ${i}
          </div>
        </div>

        ${o}

        <div class="milo-bridge-section">
          <div class="milo-section-label">SO WE'RE LOOKING FOR…</div>
          <div class="milo-bridge-block">
            <p class="milo-bridge-text">${s.bridgeSentence}</p>
          </div>
        </div>
      </div>

      <div class="milo-s5-footer">
        <button class="milo-cta-button" id="miloS5Cta-${t}">
          See your nights →
        </button>
      </div>
    </div>
  `}function ve(t,e="aarav"){const s=t.querySelector(`#miloS5Back-${e}`);s&&s.addEventListener("click",()=>{e==="aarav"?l.setSessionScreen("aarav","s4_waiting"):l.setSessionScreen("sneha","s3")});const i=t.querySelector(`#miloS5Cta-${e}`);i&&i.addEventListener("click",()=>{l.setSessionScreen(e,"s6")})}function ye(t="aarav"){const e=l.getState(),i=`${(t==="sneha"?"Aarav":"Sneha").toUpperCase()}'S PICK`,o=O(e.sessionA,e.sessionB),a=e.shared.suggestion,n=o.selectedNights.map((r,d)=>{const u=r.night,h=a&&a.nightId===u.id&&a.by!==t,b=a&&a.nightId===u.id&&a.by===t,v=h?`<span class="milo-partner-pick-label">${i}</span>`:b?'<span class="milo-my-pick-label">YOUR SUGGESTION</span>':"",k=u.beats.map(w=>w.name).join(" → ");return`
      <div class="milo-night-row" data-night-id="${u.id}" id="nightRow-${u.id}">
        <div class="milo-night-thumb-wrap">
          <img src="${u.defaultImage}" alt="${u.name}" class="milo-night-thumb" />
        </div>
        <div class="milo-night-info">
          <div class="milo-night-meta-header">
            <span class="milo-night-num">${r.num}</span>
            ${v}
          </div>
          <h2 class="milo-night-name">${u.name}</h2>
          <p class="milo-night-fit">${r.fitLine}</p>
          <div class="milo-night-beats">${k}</div>
        </div>
        <div class="milo-night-chevron">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    `}).join("");return`
    <div class="milo-s6-container" data-session-id="${t}">
      <header class="milo-header">
        <button class="milo-header-back" id="miloS6Back-${t}" aria-label="Back to shared picture">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <span class="milo-wordmark">milo.</span>
        <div class="milo-header-space"></div>
      </header>

      <div class="milo-s6-intro">
        <h1 class="milo-headline">Three nights for the two of you</h1>
        <p class="milo-subline">Different vibes, all a good fit.</p>
      </div>

      <div class="milo-nights-list">
        ${n}
      </div>
    </div>
  `}function be(t,e="aarav"){const s=t.querySelector(`#miloS6Back-${e}`);s&&s.addEventListener("click",()=>{l.setSessionScreen(e,"s5")}),t.querySelectorAll(".milo-night-row").forEach(o=>{o.addEventListener("click",()=>{const a=o.getAttribute("data-night-id");l.updateSession(e,{screen:"s7",activeNightId:a})})})}function Se(t="aarav"){var x,N;const e=l.getState(),i=e[t==="sneha"?"sessionB":"sessionA"]||{},o=t==="sneha"?"Aarav":"Sneha",a=`${o.toUpperCase()}'S PICK`,n=O(e.sessionA,e.sessionB),r=i.activeNightId||((x=n.selectedNights[0])==null?void 0:x.night.id)||"middle-ground",d=n.selectedNights.find(c=>c.night.id===r)||n.selectedNights[0],u=d.night,h=e.shared.suggestion;if(e.shared.confirmedNightId===u.id)return`
      <div class="milo-s7-container milo-closing-state" data-session-id="${t}">
        <header class="milo-header">
          <span class="milo-wordmark">milo.</span>
        </header>

        <div class="milo-closing-content">
          <div class="milo-closing-monograms">
            <div class="milo-mono-circle mono-left">A</div>
            <div class="milo-mono-circle mono-right">S</div>
          </div>
          <h1 class="milo-headline">Tonight's sorted.</h1>
          <p class="milo-closing-sub">${u.name}. Have a lovely evening.</p>
        </div>

        <div class="milo-closing-footer">
          <button class="milo-text-button" id="miloResetBtn-${t}">
            Start over
          </button>
        </div>
      </div>
    `;const v=h&&h.nightId===u.id&&h.by!==t,k=h&&h.nightId===u.id&&h.by===t,w=h&&h.nightId!==u.id&&h.by!==t;let B="";if(w){const c=(N=n.selectedNights.find(g=>g.night.id===h.nightId))==null?void 0:N.night,m=c?c.name:"a night";B=`
      <div class="milo-partner-banner" id="miloBannerOtherNight-${t}">
        <span>${o} suggested ${m}. Take a look.</span>
        <span class="milo-banner-arrow">→</span>
      </div>
    `}const C=u.beats.map((c,m)=>`
      <div class="milo-timeline-item">
        <div class="milo-timeline-track">
          <div class="milo-timeline-dot"></div>
          ${m<u.beats.length-1?'<div class="milo-timeline-line"></div>':""}
        </div>
        <div class="milo-timeline-content">
          <span class="milo-timeline-name">${c.name}</span>
          <span class="milo-timeline-desc">${c.desc}</span>
        </div>
      </div>
    `).join("");let f="";return k?f=`
      <div class="milo-cta-suggested-notice">
        Suggested. We'll let you know when ${o}'s in.
      </div>
    `:v?f=`
      <button class="milo-cta-button" id="miloConfirmNight-${t}">
        This is our night
      </button>
    `:w?f=`
      <button class="milo-cta-button" id="miloSuggestNight-${t}">
        Suggest this instead
      </button>
    `:f=`
      <button class="milo-cta-button" id="miloSuggestNight-${t}">
        Suggest this to ${o}
      </button>
    `,`
    <div class="milo-s7-container" data-session-id="${t}">
      ${B}

      <!-- Top Hero Section -->
      <div class="milo-s7-hero">
        <img src="${u.defaultImage}" alt="${u.name}" class="milo-s7-hero-img" />
        <div class="milo-s7-scrim"></div>

        <button class="milo-s7-back-btn" id="miloS7Back-${t}" aria-label="Back to three nights">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>

        <div class="milo-s7-hero-text">
          <div class="milo-s7-num-row">
            <span class="milo-s7-num">${d.num}</span>
            ${v?`<span class="milo-partner-pick-label">${a}</span>`:""}
          </div>
          <h1 class="milo-s7-night-name">${u.name}</h1>
        </div>
      </div>

      <!-- Detail Body (on Ivory) -->
      <div class="milo-s7-body">
        <p class="milo-s7-reason">${u.reasonLine}</p>

        <div class="milo-s7-why-works">
          <p class="milo-s7-why-text">${d.whyItWorks}</p>
        </div>

        <div class="milo-timeline-section">
          ${C}
        </div>

        <p class="milo-s7-skip-line">
          Skip this one if ${u.skipIf}
        </p>

        <div class="milo-s7-actions">
          <button class="milo-secondary-link" id="miloSeeOtherNights-${t}">
            See the other two
          </button>
          ${f}
        </div>
      </div>
    </div>
  `}function we(t,e="aarav"){var w;const s=l.getState(),o=s[e==="sneha"?"sessionB":"sessionA"]||{},a=O(s.sessionA,s.sessionB),n=o.activeNightId||((w=a.selectedNights[0])==null?void 0:w.night.id)||"middle-ground",r=t.querySelector(`#miloS7Back-${e}`),d=t.querySelector(`#miloSeeOtherNights-${e}`),u=()=>{l.setSessionScreen(e,"s6")};r&&r.addEventListener("click",u),d&&d.addEventListener("click",u);const h=t.querySelector(`#miloSuggestNight-${e}`);h&&h.addEventListener("click",()=>{l.updateShared({suggestion:{by:e,nightId:n}})});const b=t.querySelector(`#miloConfirmNight-${e}`);b&&b.addEventListener("click",()=>{l.updateShared({confirmedNightId:n}),l.setSessionScreen("aarav","s7"),l.setSessionScreen("sneha","s7")});const v=t.querySelector(`#miloBannerOtherNight-${e}`);v&&v.addEventListener("click",()=>{var C;const B=(C=s.shared.suggestion)==null?void 0:C.nightId;B&&l.updateSession(e,{activeNightId:B})});const k=t.querySelector(`#miloResetBtn-${e}`);k&&k.addEventListener("click",()=>{l.reset()})}function ke(t){const e=l.getState();switch((e[t==="sneha"?"sessionB":"sessionA"]||{}).screen||(t==="sneha"?(e.shared.inviteSent,"s0"):"s1")){case"s0":return J(t);case"threshold":return se(t);case"s2":return ne(t);case"s3":return de(t);case"s4_invite":case"s4_waiting":return me(t);case"s5":return fe(t);case"s6":return ye(t);case"s7":return Se(t);case"s1":default:return ee(t)}}function $e(t,e){switch((l.getState()[e==="sneha"?"sessionB":"sessionA"]||{}).screen||(e==="sneha"?"s0":"s1")){case"s0":V(t,e);break;case"threshold":ie(t,e);break;case"s2":ae(t,e);break;case"s3":he(t,e);break;case"s4_invite":case"s4_waiting":ue(t,e);break;case"s5":ve(t,e);break;case"s6":be(t,e);break;case"s7":we(t,e);break;case"s1":default:te(t,e);break}}function Le(t){X(l);const e=new URLSearchParams(window.location.search),s=e.get("as"),i=e.get("reset"),o=e.get("golden"),a=e.get("vp"),n=e.get("screen");a?document.body.setAttribute("data-viewport",a):document.body.removeAttribute("data-viewport"),i==="1"?(l.reset(),window.history.replaceState({},"",window.location.pathname+(s?`?as=${s}`:""))):o==="1"&&(l.updateSession("aarav",{intents:["intimate","novelty","low-key"],reactions:[{cardId:"tiny-bar",reaction:"into_it"},{cardId:"long-walk",reaction:"into_it"},{cardId:"rooftop-drinks",reaction:"not_tonight"},{cardId:"board-games",reaction:"maybe"},{cardId:"neighbourhood-wander",reaction:"into_it"},{cardId:"live-music",reaction:"not_tonight"},{cardId:"sunset-cosy",reaction:"into_it"},{cardId:"creative-activity",reaction:"maybe"}],currentCardIndex:8,screen:n||"s3"}),l.updateSession("sneha",{intents:["intimate","fun","special"],reactions:[{cardId:"live-music",reaction:"into_it"},{cardId:"courtyard-dinner",reaction:"into_it"},{cardId:"street-food-film",reaction:"not_tonight"},{cardId:"dressed-up",reaction:"not_tonight"},{cardId:"creative-activity",reaction:"into_it"},{cardId:"board-games",reaction:"maybe"},{cardId:"rooftop-drinks",reaction:"into_it"},{cardId:"sunset-cosy",reaction:"not_tonight"}],currentCardIndex:8,screen:n||"s0"})),n&&(n==="s2"?(l.updateSession("aarav",{intents:["intimate","novelty","low-key"],screen:"s2"}),l.updateSession("sneha",{intents:["intimate","fun","special"],screen:"s2"})):n==="threshold"?(l.setSessionScreen("aarav","threshold"),l.setSessionScreen("sneha","threshold")):n==="s3"?(l.setSessionScreen("aarav","s3"),l.setSessionScreen("sneha","s3")):n==="s4"?(l.setSessionScreen("aarav","s4_invite"),l.setSessionScreen("sneha","s0")):n==="s4_waiting"?(l.updateShared({inviteSent:!0}),l.setSessionScreen("aarav","s4_waiting"),l.setSessionScreen("sneha","s0")):n==="s5"?(l.setSessionScreen("aarav","s5"),l.setSessionScreen("sneha","s5")):n==="s6"?(l.setSessionScreen("aarav","s6"),l.setSessionScreen("sneha","s6")):n==="s7"?(l.setSessionScreen("aarav","s7"),l.setSessionScreen("sneha","s7")):n==="suggested"?(l.updateShared({suggestion:{by:"sneha",nightId:"middle-ground"}}),l.updateSession("aarav",{screen:"s6"}),l.updateSession("sneha",{screen:"s7",activeNightId:"middle-ground"})):n==="closed"&&(l.updateShared({confirmedNightId:"middle-ground"}),l.updateSession("aarav",{screen:"s7",activeNightId:"middle-ground"}),l.updateSession("sneha",{screen:"s7",activeNightId:"middle-ground"})));function r(){const d=s==="sneha"?"sneha":"aarav";t.innerHTML=`
      <div class="milo-stage">
        <div class="milo-viewport" id="viewport-${d}" data-session-id="${d}">
          ${ke(d)}
        </div>
      </div>
    `,$e(t.querySelector(`#viewport-${d}`),d)}r(),l.subscribe(()=>{r()})}const K=document.getElementById("app");K&&Le(K);
