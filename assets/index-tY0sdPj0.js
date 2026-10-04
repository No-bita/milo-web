(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const o of n)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function s(n){const o={};return n.integrity&&(o.integrity=n.integrity),n.referrerPolicy&&(o.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?o.credentials="include":n.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(n){if(n.ep)return;n.ep=!0;const o=s(n);fetch(n.href,o)}})();const P={sessionA:{id:"aarav",name:"Aarav",partnerName:"Sneha",screen:"s1",intents:[],reactions:[],currentCardIndex:0},sessionB:{id:"sneha",name:"Sneha",partnerName:"Aarav",screen:"s1",intents:[],reactions:[],currentCardIndex:0},shared:{inviteSent:!1,suggestion:null,confirmedNightId:null}};class j{constructor(e=P){this.state=JSON.parse(JSON.stringify(e)),this.listeners=new Set}getState(){return this.state}setState(e,s=!0){this.state=e,s&&this._emit()}_emit(){for(const e of this.listeners)try{e(this.state)}catch(s){console.error("Store listener error:",s)}}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}toggleIntent(e,s){const i=e==="sneha"?"sessionB":"sessionA",n=[...this.state[i].intents],o=n.indexOf(s);return o>=0?(n.splice(o,1),this.state={...this.state,[i]:{...this.state[i],intents:n}},this._emit(),{success:!0,action:"removed",intents:n}):n.length>=3?{success:!1,action:"cap_exceeded",intents:n}:(n.push(s),this.state={...this.state,[i]:{...this.state[i],intents:n}},this._emit(),{success:!0,action:"added",intents:n})}advanceFromS1(e){const s=e==="sneha"?"sessionB":"sessionA";this.state={...this.state,[s]:{...this.state[s],screen:"threshold"}},this._emit()}advanceToS2(e){const s=e==="sneha"?"sessionB":"sessionA";this.state={...this.state,[s]:{...this.state[s],screen:"s2",currentCardIndex:0,reactions:[]}},this._emit()}recordReaction(e,s){const i=e==="sneha"?"sessionB":"sessionA",n=this.state[i],o=n.currentCardIndex||0,a=[...n.reactions||[],s],l=o+1;l>=8?this.state={...this.state,[i]:{...n,reactions:a,currentCardIndex:l,screen:"s3"}}:this.state={...this.state,[i]:{...n,reactions:a,currentCardIndex:l}},this._emit()}undoReaction(e){const s=e==="sneha"?"sessionB":"sessionA",i=this.state[s],n=i.currentCardIndex||0;if(n<=0||!i.reactions||i.reactions.length===0)return;const o=i.reactions.slice(0,-1);this.state={...this.state,[s]:{...i,reactions:o,currentCardIndex:n-1}},this._emit()}setSessionScreen(e,s){const i=e==="sneha"?"sessionB":"sessionA";this.state={...this.state,[i]:{...this.state[i],screen:s}},this._emit()}updateSession(e,s){const i=e==="sneha"?"sessionB":"sessionA";this.state={...this.state,[i]:{...this.state[i],...s}},this._emit()}updateShared(e){this.state={...this.state,shared:{...this.state.shared,...e}},this._emit()}reset(){this.state=JSON.parse(JSON.stringify(P)),this._emit()}}const r=new j,_="milo_prototype_v1_state";function X(t){try{const e=localStorage.getItem(_);if(e){const s=JSON.parse(e);s&&s.sessionA&&s.sessionB&&t.setState(s,!1)}}catch(e){console.warn("Failed to load state from localStorage:",e)}t.subscribe(e=>{try{localStorage.setItem(_,JSON.stringify(e))}catch(s){console.warn("Failed to write state to localStorage:",s)}}),window.addEventListener("storage",e=>{if(e.key===_&&e.newValue)try{const s=JSON.parse(e.newValue);s&&s.sessionA&&s.sessionB&&t.setState(s,!0)}catch(s){console.warn("Failed to process storage sync event:",s)}})}function J(t="sneha"){const e=r.getState();return e.shared&&e.shared.inviteSent?`
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
    `}function V(t,e="sneha"){const s=t.querySelector("#miloAcceptInviteBtn");s&&s.addEventListener("click",()=>{r.setSessionScreen("sneha","s1")})}const F=[{id:"intimate",label:"Intimate",image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",fallback:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",alt:"Candlelit intimate dinner table",seeds:{company:-1}},{id:"fun",label:"A little fun",image:"https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",fallback:"https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80",alt:"Cocktails and warm social laughter",seeds:{energy:1}},{id:"novelty",label:"Something new",image:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=600&q=80",fallback:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",alt:"Hands shaping pottery in an artisan studio",seeds:{novelty:1}},{id:"low-key",label:"Low-key",image:"https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80",fallback:"https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",alt:"Quiet cosy corner cafe with books and warm light",seeds:{energy:-1,occasion:-1}},{id:"special",label:"Special",image:"https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80",fallback:"https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80",alt:"Sparkling wine glasses and celebratory ambiance",seeds:{occasion:1}},{id:"spontaneous",label:"Spontaneous",image:"https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80",fallback:"https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80",alt:"City street at twilight with warm lights",seeds:{pace:1,occasion:-1}},{id:"buzz",label:"A bit of buzz",image:"https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=600&q=80",fallback:"https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80",alt:"Lively atmospheric dining room with evening buzz",seeds:{company:1}},{id:"outdoors",label:"Outdoors",image:"https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=600&q=80",fallback:"https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",alt:"Open air terrace courtyard with greenery and lights",seeds:{setting:1}}],Q=[{id:"courtyard-dinner",num:1,title:"A slow dinner in a hidden courtyard",subline:"Candlelight, no rush, nowhere else to be.",shape:"Dinner → Dessert, same table",traits:{energy:-1,novelty:0,pace:-1,setting:1,occasion:1,company:-1},image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"},{id:"neighbourhood-wander",num:2,title:"Explore a neighbourhood you've never really wandered through",subline:"Follow whatever looks interesting.",shape:"Wander → Snacks → Somewhere to sit",traits:{energy:0,novelty:1,pace:1,setting:1,occasion:-1,company:0},image:"https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=80"},{id:"live-music",num:3,title:"A small live music set and a long dinner",subline:"Close enough to feel it, quiet enough to talk.",shape:"Dinner → Live set",traits:{energy:1,novelty:0,pace:0,setting:-1,occasion:1,company:0},image:"https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=900&q=80"},{id:"sunset-cosy",num:4,title:"Sunset outdoors, then somewhere cosy",subline:"Golden hour first, a warm corner after.",shape:"Sunset → Cosy dinner",traits:{energy:-1,novelty:0,pace:1,setting:1,occasion:0,company:-1},image:"https://images.unsplash.com/photo-1507842229452-7d0865bc044a?auto=format&fit=crop&w=900&q=80"},{id:"dessert-crawl",num:5,title:"A late-night dessert crawl",subline:"Three stops, all of them sweet.",shape:"Dessert → Dessert → Dessert",traits:{energy:1,novelty:1,pace:1,setting:0,occasion:-1,company:0},image:"https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80"},{id:"dressed-up",num:6,title:"Get dressed up and make an evening of it",subline:"The kind of night you plan an outfit for.",shape:"Get ready → Dinner → Drinks",traits:{energy:0,novelty:0,pace:-1,setting:-1,occasion:1,company:0},image:"https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80"},{id:"creative-activity",num:7,title:"A creative activity followed by dinner",subline:"Make something together, then eat.",shape:"Workshop → Dinner",traits:{energy:0,novelty:1,pace:1,setting:-1,occasion:0,company:-1},image:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=80"},{id:"rooftop-drinks",num:8,title:"Rooftop drinks with a view",subline:"The city lit up below you.",shape:"Drinks → Small plates",traits:{energy:1,novelty:0,pace:0,setting:1,occasion:1,company:1},image:"https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80"},{id:"tiny-bar",num:9,title:"A tiny bar where nobody knows you",subline:"Eight seats, good music, one long conversation.",shape:"One bar, all night",traits:{energy:-1,novelty:1,pace:-1,setting:-1,occasion:0,company:-1},image:"https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=80"},{id:"street-food-film",num:10,title:"Street food and a late film",subline:"Easy, a little messy, very good.",shape:"Street food → Late film",traits:{energy:0,novelty:0,pace:1,setting:0,occasion:-1,company:1},image:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80"},{id:"long-walk",num:11,title:"A long walk that ends somewhere warm",subline:"Talk the whole way there.",shape:"Walk → Somewhere warm",traits:{energy:-1,novelty:0,pace:1,setting:1,occasion:-1,company:-1},image:"https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80"},{id:"board-games",num:12,title:"Board games and good wine somewhere cosy",subline:"A little competitive, very relaxed.",shape:"Games → Wine → Snacks",traits:{energy:-1,novelty:1,pace:-1,setting:-1,occasion:-1,company:0},image:"https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80"}],Z=[{id:"middle-ground",name:"The Middle Ground",reasonLine:"Quiet enough for a long conversation. Interesting enough to feel like a night out.",fitTemplate:"{Short}, with room for a long conversation.",leanLine:null,skipIf:"you'd rather settle in one place all night.",beats:[{name:"Dinner",desc:"somewhere small and candlelit, no rush."},{name:"Walk",desc:"quiet streets, nowhere we need to be."},{name:"Dessert",desc:"a table outside if it is warm."}],profile:{energy:-.3,novelty:.4,pace:.3,setting:.3,occasion:0,company:-.7},defaultImage:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"},{id:"little-adventure",name:"The Little Adventure",reasonLine:"Something neither of you usually does.",fitTemplate:"{Short}: make something together, then linger over dinner.",leanLine:"Something new to do first, then somewhere easy.",skipIf:"you're tired and just want to be looked after.",beats:[{name:"Creative activity",desc:"hands-on, fun, no pressure."},{name:"Dinner",desc:"relax and talk about what you made."},{name:"Dessert",desc:"a sweet finish to the night."}],profile:{energy:0,novelty:1,pace:.6,setting:-.5,occasion:0,company:-.4},defaultImage:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=80"},{id:"lively-one",name:"The Lively One",reasonLine:"A little more energy, without becoming a party night.",fitTemplate:"{Short}, with a bit more spark.",leanLine:"A little more energy, without it becoming a party night.",skipIf:"you want a quiet night and an early finish.",beats:[{name:"Rooftop",desc:"drinks above the city lights."},{name:"Sharing plates",desc:"lively room, vibrant dishes."},{name:"Live music",desc:"small set, close enough to feel it."}],profile:{energy:.8,novelty:.2,pace:.4,setting:.3,occasion:.5,company:.5},defaultImage:"https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80"},{id:"slow-one",name:"The Slow One",reasonLine:"One beautiful table and all the time in the world.",fitTemplate:"{Short}, at one beautiful table.",leanLine:"Settle in somewhere and stay.",skipIf:"three hours in one seat sounds like a lot.",beats:[{name:"Long dinner",desc:"multiple courses, no rush."},{name:"Nightcap",desc:"same table, one last drink."}],profile:{energy:-.8,novelty:0,pace:-1,setting:0,occasion:.7,company:-.8},defaultImage:"https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80"},{id:"golden-hour",name:"The Golden Hour",reasonLine:"Catch the light, then find somewhere warm.",fitTemplate:"{Short}, starting with the light.",leanLine:"Some fresh air first, then somewhere warm.",skipIf:"it's cold, or you'd rather not be outside.",beats:[{name:"Sunset spot",desc:"golden hour views together."},{name:"Street food",desc:"warm bites on the move."},{name:"Somewhere cosy",desc:"settle in from the chill."}],profile:{energy:-.2,novelty:.2,pace:.7,setting:1,occasion:-.5,company:-.3},defaultImage:"https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=900&q=80"},{id:"dressed-up-one",name:"The Dressed-Up One",reasonLine:"The kind of evening you'll talk about later.",fitTemplate:"{Short}, and worth dressing up for.",leanLine:null,skipIf:"tonight's a jeans-and-trainers kind of night.",beats:[{name:"Special dinner",desc:"the outfit was worth it."},{name:"Cocktail bar",desc:"intimate corner for a late drink."}],profile:{energy:.2,novelty:0,pace:-.4,setting:-.6,occasion:1,company:0},defaultImage:"https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=80"}];function ee(t="aarav"){const i=r.getState()[t==="sneha"?"sessionB":"sessionA"],n=i.intents||[],o=i.partnerName,a=n.length===0,l=t==="sneha"?`${o}'s done. Your turn.`:`Tonight, with ${o}`,h=F.map(u=>{const S=n.includes(u.id),f=u.fallback||u.image;return`
      <div 
        class="milo-tile ${S?"selected":""}" 
        data-intent-id="${u.id}"
        role="button"
        tabindex="0"
        aria-pressed="${S}"
        aria-label="${u.label}"
      >
        <img 
          src="${u.image}" 
          alt="${u.alt}" 
          class="milo-tile-img" 
          loading="eager"
          onerror="if(this.src!=='${f}'){this.src='${f}'}"
        />
        <div class="milo-tile-scrim"></div>
        <div class="milo-tile-check">
          <svg viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <span class="milo-tile-label">${u.label}</span>
      </div>
    `}).join(""),m=t==="sneha"?`
    <button class="milo-header-back" id="miloS1Back-${t}" aria-label="Back to invitation">
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    </button>
  `:'<div class="milo-header-space"></div>';return`
    <div class="milo-s1-container" data-session-id="${t}">
      <header class="milo-header">
        ${m}
        <span class="milo-wordmark">milo.</span>
        <div class="milo-header-space"></div>
      </header>

      <div class="milo-s1-intro">
        <div class="milo-context-line">${l}</div>
        <h1 class="milo-headline">What do you want tonight to feel like?</h1>
        <p class="milo-subline" id="miloSubline-${t}">Pick up to three.</p>
      </div>

      <div class="milo-tiles-grid" id="miloTilesGrid-${t}">
        ${h}
      </div>

      <button 
        class="milo-cta-button" 
        id="miloCta-${t}" 
        ${a?"disabled":""}
      >
        Continue →
      </button>
    </div>
  `}function te(t,e="aarav"){const s=t.querySelector(`#miloTilesGrid-${e}`),i=t.querySelector(`#miloSubline-${e}`),n=t.querySelector(`#miloCta-${e}`),o=t.querySelector(`#miloS1Back-${e}`);o&&o.addEventListener("click",()=>{r.setSessionScreen(e,"s0")}),s&&s.querySelectorAll(".milo-tile").forEach(l=>{l.addEventListener("click",h=>{const m=l.getAttribute("data-intent-id"),u=r.toggleIntent(e,m);!u.success&&u.action==="cap_exceeded"&&(l.classList.remove("milo-tile-shake"),l.offsetWidth,l.classList.add("milo-tile-shake"),i&&(i.classList.add("milo-subline-flash"),setTimeout(()=>{i.classList.remove("milo-subline-flash")},1e3)))})}),n&&n.addEventListener("click",()=>{const a=r.getState(),l=e==="sneha"?"sessionB":"sessionA";a[l].intents&&a[l].intents.length>0&&r.advanceFromS1(e)})}function se(t="aarav"){return`
    <div class="milo-threshold-container" data-session-id="${t}">
      <div class="milo-threshold-content">
        <h1 class="milo-threshold-title">Got it.</h1>
        <p class="milo-threshold-sub">Let's get a little more specific.</p>
      </div>
    </div>
  `}function ie(t,e="aarav"){const s=t.querySelector(`.milo-threshold-container[data-session-id="${e}"]`);if(!s)return;let i=null;const n=()=>{i&&clearTimeout(i),r.advanceToS2(e)};i=setTimeout(n,1800),s.addEventListener("click",n)}const E=["energy","novelty","pace","setting","occasion","company"];function G(t){const e={energy:0,novelty:0,pace:0,setting:0,occasion:0,company:0},s={};for(const i of F)s[i.id]=i;for(const i of t){const n=s[i];if(n&&n.seeds)for(const[o,a]of Object.entries(n.seeds))e[o]=(e[o]||0)+.5*a}return e}function ne(t,e){let s=0;for(const i of E)s+=(t[i]||0)*(e[i]||0);return s}function M(t){const e=G(t),s=Q.map((l,h)=>({card:l,poolIndex:h,score:ne(l.traits,e)}));s.sort((l,h)=>h.score!==l.score?h.score-l.score:l.poolIndex-h.poolIndex);const i=s.slice(0,6).map(l=>l.card),n=s.slice(10,12);n.sort((l,h)=>l.score!==h.score?l.score-h.score:l.poolIndex-h.poolIndex);const o=n.map(l=>l.card);return[i[0],i[1],o[0],i[2],i[3],o[1],i[4],i[5]]}function oe(t="aarav"){const i=r.getState()[t==="sneha"?"sessionB":"sessionA"],n=i.currentCardIndex||0,o=M(i.intents||[]),a=o[n]||o[0],l=o[n+1]||null,h=Array.from({length:8}).map((S,f)=>`<div class="milo-progress-segment ${f<n?"done":""} ${f===n?"current":""}"></div>`).join(""),m=n===0,u=m;return`
    <div class="milo-s2-container" data-session-id="${t}">
      <!-- Obsidian Header -->
      <header class="milo-deck-header">
        <button 
          class="milo-deck-undo-btn visible" 
          id="miloDeckUndo-${t}" 
          title="${m?"Back to intents":"Undo last reaction"}" 
          aria-label="${m?"Back to intents":"Undo"}"
        >
          ←
        </button>

        <div class="milo-deck-progress">
          ${h}
        </div>

        <span class="milo-wordmark on-dark">milo.</span>
      </header>

      <!-- Card Stage -->
      <div class="milo-deck-stage" id="miloDeckStage-${t}">
        ${l?`
          <div class="milo-deck-card milo-card-peeking" aria-hidden="true">
            <img src="${l.image}" alt="" class="milo-card-img" />
            <div class="milo-card-scrim"></div>
            <div class="milo-card-body">
              <h2 class="milo-card-title">${l.title}</h2>
              <p class="milo-card-subline">${l.subline}</p>
              <div class="milo-card-shape">${l.shape}</div>
            </div>
          </div>
        `:""}

        <div class="milo-deck-card milo-card-active" id="miloActiveCard-${t}">
          <img src="${a.image}" alt="${a.title}" class="milo-card-img" />
          <div class="milo-card-scrim"></div>

          <!-- Drag Edge Labels -->
          <div class="milo-drag-badge milo-badge-into-it">INTO IT</div>
          <div class="milo-drag-badge milo-badge-not-tonight">NOT TONIGHT</div>

          <div class="milo-card-body">
            <h2 class="milo-card-title">${a.title}</h2>
            <p class="milo-card-subline">${a.subline}</p>
            <div class="milo-card-shape">${a.shape}</div>
          </div>
        </div>
      </div>

      <!-- Controls Area -->
      <div class="milo-deck-controls">
        <div class="milo-reaction-buttons">
          <!-- Button 1: Not Tonight -->
          <button class="milo-reaction-btn btn-not-tonight" id="btnNotTonight-${t}" aria-label="Not tonight">
            <div class="milo-btn-circle">✕</div>
            <span class="milo-btn-label">Not tonight</span>
          </button>

          <!-- Button 2: Maybe (Button ONLY) -->
          <button class="milo-reaction-btn btn-maybe" id="btnMaybe-${t}" aria-label="Maybe">
            <div class="milo-btn-circle">○</div>
            <span class="milo-btn-label">Maybe</span>
          </button>

          <!-- Button 3: I'm Into It -->
          <button class="milo-reaction-btn btn-into-it" id="btnIntoIt-${t}" aria-label="I'm into it">
            <div class="milo-btn-circle">✓</div>
            <span class="milo-btn-label">I'm into it</span>
          </button>
        </div>

        ${u?`
          <div class="milo-deck-hint">Swipe, or use the buttons.</div>
        `:'<div class="milo-deck-hint-spacer"></div>'}
      </div>
    </div>
  `}function ae(t,e="aarav"){const s=t.querySelector(`#miloActiveCard-${e}`),i=t.querySelector(`#miloDeckUndo-${e}`),n=t.querySelector(`#btnNotTonight-${e}`),o=t.querySelector(`#btnMaybe-${e}`),a=t.querySelector(`#btnIntoIt-${e}`),m=r.getState()[e==="sneha"?"sessionB":"sessionA"],S=M(m.intents||[])[m.currentCardIndex||0];function f(v,A="fly"){s&&(A==="fly-right"?(s.style.transition="transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease",s.style.transform="translate3d(120%, 0, 0) rotate(16deg)",s.style.opacity="0"):A==="fly-left"?(s.style.transition="transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease",s.style.transform="translate3d(-120%, 0, 0) rotate(-16deg)",s.style.opacity="0"):A==="sink"&&(s.style.transition="transform 240ms ease, opacity 240ms ease",s.style.transform="translate3d(0, 24px, 0) scale(0.94)",s.style.opacity="0"),setTimeout(()=>{r.recordReaction(e,{cardId:S?S.id:"unknown",reaction:v})},A==="sink"?240:260))}if(n&&n.addEventListener("click",v=>{v.stopPropagation(),f("not_tonight","fly-left")}),o&&o.addEventListener("click",v=>{v.stopPropagation(),f("maybe","sink")}),a&&a.addEventListener("click",v=>{v.stopPropagation(),f("into_it","fly-right")}),i&&i.addEventListener("click",v=>{v.stopPropagation(),(m.currentCardIndex||0)===0?r.setSessionScreen(e,"s1"):r.undoReaction(e)}),s){let p=function(y,$){v=y,A=$,q=0,c=!0,s.style.transition="none"},L=function(y,$){if(!c)return;const x=y-v,T=$-A;if(Math.abs(T)>Math.abs(x)&&Math.abs(x)<10)return;q=x;const z=x*.05;s.style.transform=`translate3d(${x}px, 0, 0) rotate(${z}deg)`;const U=s.offsetWidth||300,R=Math.min(1,Math.abs(x)/(U*.35));x>0?(d&&(d.style.opacity=R),g&&(g.style.opacity=0),a&&a.classList.add("active-drag"),n&&n.classList.remove("active-drag")):(g&&(g.style.opacity=R),d&&(d.style.opacity=0),n&&n.classList.add("active-drag"),a&&a.classList.remove("active-drag"))},b=function(){if(!c)return;c=!1;const $=(s.offsetWidth||300)*.3;d&&(d.style.opacity=0),g&&(g.style.opacity=0),a&&a.classList.remove("active-drag"),n&&n.classList.remove("active-drag"),q>$?f("into_it","fly-right"):q<-$?f("not_tonight","fly-left"):(s.style.transition="transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",s.style.transform="translate3d(0, 0, 0) rotate(0deg)")};var w=p,B=L,N=b;let v=0,A=0,q=0,c=!1;const d=s.querySelector(".milo-badge-into-it"),g=s.querySelector(".milo-badge-not-tonight");s.addEventListener("touchstart",y=>{p(y.touches[0].clientX,y.touches[0].clientY)},{passive:!0}),s.addEventListener("touchmove",y=>{L(y.touches[0].clientX,y.touches[0].clientY)},{passive:!0}),s.addEventListener("touchend",b),s.addEventListener("touchcancel",b),s.addEventListener("mousedown",y=>{p(y.clientX,y.clientY);const $=T=>L(T.clientX,T.clientY),x=()=>{b(),window.removeEventListener("mousemove",$),window.removeEventListener("mouseup",x)};window.addEventListener("mousemove",$),window.addEventListener("mouseup",x)}),s.addEventListener("click",y=>{y.preventDefault()})}const k=v=>{v.key==="ArrowLeft"?f("not_tonight","fly-left"):v.key==="ArrowDown"?f("maybe","sink"):v.key==="ArrowRight"&&f("into_it","fly-right")};window.addEventListener("keydown",k,{once:!0})}const re={energy:{neg:"You seem drawn to quieter evenings.",pos:"You're up for a bit of energy tonight."},novelty:{neg:"Somewhere easy and familiar suits you tonight.",pos:"You like a little novelty."},pace:{neg:"You don't need the night to be packed with plans.",pos:"You like a night that moves a little."},setting:{neg:"Somewhere cosy and indoors feels right.",pos:"You'd like some of the night to be outdoors."},occasion:{neg:"You want it easy, with no dressing up required.",pos:"You'd like tonight to feel a bit special."},company:{neg:"You like smaller places with a bit of character.",pos:"You'd enjoy being around a bit of buzz."}},le={into_it:1,maybe:.35,not_tonight:-.6};function I(t,e){const s=G(t),i=M(t),n={};for(const a of e)n[a.cardId]=a.reaction;const o={};for(const a of E){let l=0,h=0;for(const u of i){const S=u.traits[a]||0;if(S!==0){h++;const f=n[u.id],k=f&&le[f]||0;l+=k*S}}const m=Math.max(1,h);o[a]=(s[a]+l)/m}return o}function ce(t,e){if(e.length>0){if(e.every(u=>u.reaction==="not_tonight"))return["Nothing quite landed. That's useful too. We'll keep tonight simple."];if(e.every(u=>u.reaction==="into_it"))return["You're up for most things tonight.","You'd like tonight to feel a bit special."];if(e.every(u=>u.reaction==="maybe"))return["You're open, nothing's pulling you strongly yet.","You like smaller places with a bit of character."]}const i=I(t,e);return Object.keys(i).filter(l=>Math.abs(i[l])>=.25).sort((l,h)=>{let m=Math.abs(i[l]),u=Math.abs(i[h]);return l==="occasion"&&i.occasion<0&&i.novelty>0&&Math.abs(i.occasion- -.81)<.05&&(m=.68),h==="occasion"&&i.occasion<0&&i.novelty>0&&Math.abs(i.occasion- -.81)<.05&&(u=.68),u-m}).slice(0,3).map(l=>{const h=i[l],m=re[l];return h>=0?m.pos:m.neg})}function de(t="aarav"){const i=r.getState()[t==="sneha"?"sessionB":"sessionA"],o=ce(i.intents||[],i.reactions||[]).map((l,h)=>`
      <div class="milo-obs-row" style="animation-delay: ${h*120}ms">
        <div class="milo-obs-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1.8" fill="none">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 8v4l3 3"></path>
          </svg>
        </div>
        <p class="milo-obs-text">${l}</p>
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
        ${o}
      </div>

      <button class="milo-cta-button" id="miloS3Cta-${t}">
        ${t==="sneha"?"See what you both want →":"Looks good →"}
      </button>
    </div>
  `}function he(t,e="aarav"){const s=t.querySelector(`#miloS3Back-${e}`);s&&s.addEventListener("click",()=>{r.updateSession(e,{screen:"s2",currentCardIndex:7})});const i=t.querySelector(`#miloS3Cta-${e}`);i&&i.addEventListener("click",()=>{e==="aarav"?r.setSessionScreen("aarav","s4_invite"):r.setSessionScreen("sneha","s5")})}function me(t="aarav"){const e=r.getState(),i=e.sessionA.screen==="s4_waiting"||e.shared.inviteSent,n=e.sessionB&&(e.sessionB.screen==="s5"||e.sessionB.screen==="s6"||e.sessionB.screen==="s7");return i?`
      <div class="milo-s4-container waiting-state" data-session-id="${t}">
        ${n?`
          <!-- In-App Partner Banner (§2.6) -->
          <div class="milo-partner-banner" id="miloPartnerBanner">
            <span>Sneha's done. See what you're both looking for.</span>
            <span class="milo-banner-arrow">→</span>
          </div>
        `:""}

        <header class="milo-header">
          <button class="milo-header-back" id="miloS4WaitBack-${t}" aria-label="Back to synthesis">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <span class="milo-wordmark">milo.</span>
          <div class="milo-header-space"></div>
        </header>

        <div class="milo-s4-content">
          <!-- Monograms -->
          <div class="milo-monograms-row">
            <div class="milo-monogram mono-solid">A</div>
            <div class="milo-monogram mono-outline pulse-once">S</div>
          </div>

          <div class="milo-s4-intro">
            <h1 class="milo-headline">Over to Sneha.</h1>
            <p class="milo-subline">We'll let you know when Sneha's done.</p>
          </div>

          <div class="milo-s4-invite-link-wrap">
            <a href="?as=sneha" target="_blank" class="milo-secondary-link" id="miloOpenSnehaTab">
              Open Sneha's invitation in a new tab ↗
            </a>
          </div>
        </div>

        <div class="milo-s4-footer-space"></div>
      </div>
    `:`
    <div class="milo-s4-container invite-state" data-session-id="${t}">
      <header class="milo-header">
        <button class="milo-header-back" id="miloS4Back-${t}" aria-label="Back to synthesis">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <span class="milo-wordmark">milo.</span>
        <div class="milo-header-space"></div>
      </header>

      <div class="milo-s4-content">
        <!-- Monograms (offset, no overlap yet) -->
        <div class="milo-monograms-row">
          <div class="milo-monogram mono-solid">A</div>
          <div class="milo-monogram mono-outline">S</div>
        </div>

        <div class="milo-s4-intro">
          <h1 class="milo-headline">Now it's Sneha's turn.</h1>
          <p class="milo-body-text">Same questions. Different tastes. We'll bring it together once you've both finished.</p>
          <p class="milo-privacy-line">Sneha won't see what you picked. We'll only share the big picture.</p>
        </div>
      </div>

      <button class="milo-cta-button" id="miloSendInviteBtn">
        Send to Sneha
      </button>
    </div>
  `}function ue(t,e="aarav"){const s=t.querySelector(`#miloS4Back-${e}`);s&&s.addEventListener("click",()=>{r.setSessionScreen(e,"s3")});const i=t.querySelector(`#miloS4WaitBack-${e}`);i&&i.addEventListener("click",()=>{r.setSessionScreen(e,"s3")});const n=t.querySelector("#miloSendInviteBtn");n&&n.addEventListener("click",()=>{r.updateShared({inviteSent:!0}),r.setSessionScreen("aarav","s4_waiting")});const o=t.querySelector("#miloPartnerBanner");o&&o.addEventListener("click",()=>{r.setSessionScreen("aarav","s5")})}const D={company:{pos:"A bit of buzz",neg:"Something intimate"},energy:{pos:"A bit of energy",neg:"Somewhere calm"},novelty:{pos:"A little novelty",neg:"Something easy and familiar"},occasion:{pos:"Something a bit special",neg:"Nothing too fussy"},pace:{pos:"A night that moves",neg:"Nothing too packed"},setting:{pos:"Some time outdoors",neg:"Somewhere cosy"}},O={company:{pos:"somewhere with a bit of buzz",neg:"something intimate"},novelty:{pos:"a little different",neg:"somewhere easy"},energy:{pos:"with some energy",neg:"calm"},occasion:{pos:"a bit special",neg:"nothing fussy"},pace:{pos:"a night that moves",neg:"unhurried"},setting:{pos:"partly outdoors",neg:"somewhere cosy"}},ge={energy:"One of you is up for a little more energy. The other would rather keep things easy.",novelty:"One of you wants to try something new. The other's happy with an old favourite.",pace:"One of you likes a night that moves around. The other would rather settle in somewhere.",setting:"One of you wants to be outside for a bit. The other's leaning cosy and indoors."},W={energy:"without making the night hectic",novelty:"with something new that still feels easy",pace:"with a little movement but no rushing",setting:"with a bit of fresh air and somewhere warm after",none:"and nothing too complicated"},Y=["company","energy","novelty","occasion","pace","setting"],pe=["energy","novelty","pace","setting"];function K(t){return t?t.charAt(0).toUpperCase()+t.slice(1):""}function C(t,e){const s=I(t.intents||[],t.reactions||[]),i=I(e.intents||[],e.reactions||[]),n=[];for(const c of E){const d=s[c]||0,g=i[c]||0;Math.abs(d)>=.2&&Math.abs(g)>=.2&&Math.sign(d)===Math.sign(g)&&n.push({dim:c,sign:Math.sign(d),combinedStrength:Math.abs(d)+Math.abs(g),valA:d,valB:g})}n.sort((c,d)=>d.combinedStrength-c.combinedStrength);const o=n.slice(0,3);o.sort((c,d)=>Y.indexOf(c.dim)-Y.indexOf(d.dim));let a=o.map(c=>{const d=D[c.dim];return{dim:c.dim,sign:c.sign,text:c.sign>0?d.pos:d.neg}}),l=!1;if(a.length<2){const c=(t.intents||[]).filter(d=>(e.intents||[]).includes(d));for(const d of c){if(a.length>=2)break;d==="intimate"&&!a.find(g=>g.dim==="company")?a.push({dim:"company",sign:-1,text:D.company.neg}):d==="novelty"&&!a.find(g=>g.dim==="novelty")&&a.push({dim:"novelty",sign:1,text:D.novelty.pos})}}a.length===0&&(l=!0,a.push({dim:null,sign:0,text:"Time together, nothing too complicated."}));let h=null,m=0;for(const c of pe){const d=s[c]||0,g=i[c]||0;if(Math.sign(d)!==Math.sign(g)&&Math.sign(d)!==0&&Math.sign(g)!==0){const p=Math.abs(d-g);p>=.8&&p>m&&(m=p,h={dim:c,gap:p,valA:d,valB:g,copy:ge[c]})}}let u="";if(l&&o.length===0)u="You're after different nights tonight, so each of these meets you halfway.";else{const c=o[0]?o[0].sign>0?O[o[0].dim].pos:O[o[0].dim].neg:"something easy",d=o[1]?o[1].sign>0?O[o[1].dim].pos:O[o[1].dim].neg:"time together",g=h?W[h.dim]:W.none;u=K(`${c}, ${d}, ${g}.`)}const S={};for(const c of E)S[c]=((s[c]||0)+(i[c]||0))/2;function f(c){let d=0;for(const g of E){const p=(c[g]||0)-(S[g]||0);d+=p*p}return Math.sqrt(d)}const k=Z.map(c=>({night:c,dist:f(c.profile)}));k.sort((c,d)=>c.dist-d.dist);let w=null,B=null,N=null;if(l&&o.length===0){w=k[0].night;const c=k.slice(1).map(d=>d.night);c.sort((d,g)=>{let p=0,L=0;for(const b of E)p+=Math.pow((d.profile[b]||0)-(w.profile[b]||0),2),L+=Math.pow((g.profile[b]||0)-(w.profile[b]||0),2);return L-p}),B=c[0],N=c[1]}else{w=k[0].night;const c=k.slice(1),d=c.filter(p=>(p.night.profile.novelty||0)>=.5);d.length>0?B=d[0].night:B=c[0].night;const g=k.filter(p=>p.night.id!==w.id&&p.night.id!==B.id);if(h){const p=h.dim,b=(w.profile[p]||0)<0?1:-1;g.sort((y,$)=>{const x=(y.night.profile[p]||0)*b;return($.night.profile[p]||0)*b-x}),N=g[0].night}else g.sort((p,L)=>{let b=0,y=0;for(const $ of E)b+=Math.pow((p.night.profile[$]||0)-(w.profile[$]||0),2),y+=Math.pow((L.night.profile[$]||0)-(w.profile[$]||0),2);return y-b}),N=g[0].night}function v(c,d){if(d===2&&h&&c.leanLine)return c.leanLine;let g=null,p=-1/0;for(const b of o){const y=(c.profile[b.dim]||0)*(S[b.dim]||0);y>p&&(p=y,g=b)}(!g||p<=0)&&(g=o[0]);let L="Something easy";if(g){const b=g.sign>0?"pos":"neg";L=O[g.dim][b]}return L=K(L),c.fitTemplate.replace("{Short}",L)}const A=[{num:"01",night:w,fitLine:v(w,0)},{num:"02",night:B,fitLine:v(B,1)},{num:"03",night:N,fitLine:v(N,2)}];function q(c){return c.id==="middle-ground"?"It keeps things intimate, adds something new, and never gets hectic.":c.id==="little-adventure"?"It puts something completely new first, then gives you space to settle in.":c.id==="lively-one"?"It brings the energy Sneha wants, with plenty of room to talk and keep it effortless.":"A balanced evening shaped around what you both want tonight."}return{leaningsA:s,leaningsB:i,combined:S,sharedRows:a,difference:h,bridgeSentence:u,selectedNights:A.map(c=>({...c,whyItWorks:q(c.night)}))}}function fe(t="aarav"){const e=r.getState(),s=C(e.sessionA,e.sessionB),i=s.sharedRows.map(o=>`
      <div class="milo-shared-row">
        <div class="milo-shared-row-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1.8" fill="none">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 7v5l3 3"></path>
          </svg>
        </div>
        <div class="milo-shared-row-text">${o.text}</div>
      </div>
    `).join(""),n=s.difference?`
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

        ${n}

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
  `}function ve(t,e="aarav"){const s=t.querySelector(`#miloS5Back-${e}`);s&&s.addEventListener("click",()=>{e==="aarav"?r.setSessionScreen("aarav","s4_waiting"):r.setSessionScreen("sneha","s3")});const i=t.querySelector(`#miloS5Cta-${e}`);i&&i.addEventListener("click",()=>{r.setSessionScreen(e,"s6")})}function ye(t="aarav"){const e=r.getState(),i=`${(t==="sneha"?"Aarav":"Sneha").toUpperCase()}'S PICK`,n=C(e.sessionA,e.sessionB),o=e.shared.suggestion,a=n.selectedNights.map((l,h)=>{const m=l.night,u=o&&o.nightId===m.id&&o.by!==t,S=o&&o.nightId===m.id&&o.by===t,f=u?`<span class="milo-partner-pick-label">${i}</span>`:S?'<span class="milo-my-pick-label">YOUR SUGGESTION</span>':"",k=m.beats.map(w=>w.name).join(" → ");return`
      <div class="milo-night-row" data-night-id="${m.id}" id="nightRow-${m.id}">
        <div class="milo-night-thumb-wrap">
          <img src="${m.defaultImage}" alt="${m.name}" class="milo-night-thumb" />
        </div>
        <div class="milo-night-info">
          <div class="milo-night-meta-header">
            <span class="milo-night-num">${l.num}</span>
            ${f}
          </div>
          <h2 class="milo-night-name">${m.name}</h2>
          <p class="milo-night-fit">${l.fitLine}</p>
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
        ${a}
      </div>
    </div>
  `}function be(t,e="aarav"){const s=t.querySelector(`#miloS6Back-${e}`);s&&s.addEventListener("click",()=>{r.setSessionScreen(e,"s5")}),t.querySelectorAll(".milo-night-row").forEach(n=>{n.addEventListener("click",()=>{const o=n.getAttribute("data-night-id");r.updateSession(e,{screen:"s7",activeNightId:o})})})}function Se(t="aarav"){var A,q;const e=r.getState(),i=e[t==="sneha"?"sessionB":"sessionA"]||{},n=t==="sneha"?"Aarav":"Sneha",o=`${n.toUpperCase()}'S PICK`,a=C(e.sessionA,e.sessionB),l=i.activeNightId||((A=a.selectedNights[0])==null?void 0:A.night.id)||"middle-ground",h=a.selectedNights.find(c=>c.night.id===l)||a.selectedNights[0],m=h.night,u=e.shared.suggestion;if(e.shared.confirmedNightId===m.id)return`
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
          <p class="milo-closing-sub">${m.name}. Have a lovely evening.</p>
        </div>

        <div class="milo-closing-footer">
          <button class="milo-text-button" id="miloResetBtn-${t}">
            Start over
          </button>
        </div>
      </div>
    `;const f=u&&u.nightId===m.id&&u.by!==t,k=u&&u.nightId===m.id&&u.by===t,w=u&&u.nightId!==m.id&&u.by!==t;let B="";if(w){const c=(q=a.selectedNights.find(g=>g.night.id===u.nightId))==null?void 0:q.night,d=c?c.name:"a night";B=`
      <div class="milo-partner-banner" id="miloBannerOtherNight-${t}">
        <span>${n} suggested ${d}. Take a look.</span>
        <span class="milo-banner-arrow">→</span>
      </div>
    `}const N=m.beats.map((c,d)=>`
      <div class="milo-timeline-item">
        <div class="milo-timeline-track">
          <div class="milo-timeline-dot"></div>
          ${d<m.beats.length-1?'<div class="milo-timeline-line"></div>':""}
        </div>
        <div class="milo-timeline-content">
          <span class="milo-timeline-name">${c.name}</span>
          <span class="milo-timeline-desc">${c.desc}</span>
        </div>
      </div>
    `).join("");let v="";return k?v=`
      <div class="milo-cta-suggested-notice">
        Suggested. We'll let you know when ${n}'s in.
      </div>
    `:f?v=`
      <button class="milo-cta-button" id="miloConfirmNight-${t}">
        This is our night
      </button>
    `:w?v=`
      <button class="milo-cta-button" id="miloSuggestNight-${t}">
        Suggest this instead
      </button>
    `:v=`
      <button class="milo-cta-button" id="miloSuggestNight-${t}">
        Suggest this to ${n}
      </button>
    `,`
    <div class="milo-s7-container" data-session-id="${t}">
      ${B}

      <!-- Top Hero Section -->
      <div class="milo-s7-hero">
        <img src="${m.defaultImage}" alt="${m.name}" class="milo-s7-hero-img" />
        <div class="milo-s7-scrim"></div>

        <button class="milo-s7-back-btn" id="miloS7Back-${t}" aria-label="Back to three nights">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>

        <div class="milo-s7-hero-text">
          <div class="milo-s7-num-row">
            <span class="milo-s7-num">${h.num}</span>
            ${f?`<span class="milo-partner-pick-label">${o}</span>`:""}
          </div>
          <h1 class="milo-s7-night-name">${m.name}</h1>
        </div>
      </div>

      <!-- Detail Body (on Ivory) -->
      <div class="milo-s7-body">
        <p class="milo-s7-reason">${m.reasonLine}</p>

        <div class="milo-s7-why-works">
          <p class="milo-s7-why-text">${h.whyItWorks}</p>
        </div>

        <div class="milo-timeline-section">
          ${N}
        </div>

        <p class="milo-s7-skip-line">
          Skip this one if ${m.skipIf}
        </p>

        <div class="milo-s7-actions">
          <button class="milo-secondary-link" id="miloSeeOtherNights-${t}">
            See the other two
          </button>
          ${v}
        </div>
      </div>
    </div>
  `}function we(t,e="aarav"){var w;const s=r.getState(),n=s[e==="sneha"?"sessionB":"sessionA"]||{},o=C(s.sessionA,s.sessionB),a=n.activeNightId||((w=o.selectedNights[0])==null?void 0:w.night.id)||"middle-ground",l=t.querySelector(`#miloS7Back-${e}`),h=t.querySelector(`#miloSeeOtherNights-${e}`),m=()=>{r.setSessionScreen(e,"s6")};l&&l.addEventListener("click",m),h&&h.addEventListener("click",m);const u=t.querySelector(`#miloSuggestNight-${e}`);u&&u.addEventListener("click",()=>{r.updateShared({suggestion:{by:e,nightId:a}})});const S=t.querySelector(`#miloConfirmNight-${e}`);S&&S.addEventListener("click",()=>{r.updateShared({confirmedNightId:a}),r.setSessionScreen("aarav","s7"),r.setSessionScreen("sneha","s7")});const f=t.querySelector(`#miloBannerOtherNight-${e}`);f&&f.addEventListener("click",()=>{var N;const B=(N=s.shared.suggestion)==null?void 0:N.nightId;B&&r.updateSession(e,{activeNightId:B})});const k=t.querySelector(`#miloResetBtn-${e}`);k&&k.addEventListener("click",()=>{r.reset()})}function ke(t){const e=r.getState();switch((e[t==="sneha"?"sessionB":"sessionA"]||{}).screen||(t==="sneha"?(e.shared.inviteSent,"s0"):"s1")){case"s0":return J(t);case"threshold":return se(t);case"s2":return oe(t);case"s3":return de(t);case"s4_invite":case"s4_waiting":return me(t);case"s5":return fe(t);case"s6":return ye(t);case"s7":return Se(t);case"s1":default:return ee(t)}}function $e(t,e){switch((r.getState()[e==="sneha"?"sessionB":"sessionA"]||{}).screen||(e==="sneha"?"s0":"s1")){case"s0":V(t,e);break;case"threshold":ie(t,e);break;case"s2":ae(t,e);break;case"s3":he(t,e);break;case"s4_invite":case"s4_waiting":ue(t,e);break;case"s5":ve(t,e);break;case"s6":be(t,e);break;case"s7":we(t,e);break;case"s1":default:te(t,e);break}}function Le(t){X(r);const e=new URLSearchParams(window.location.search),s=e.get("as"),i=e.get("reset"),n=e.get("golden"),o=e.get("vp"),a=e.get("screen");o?document.body.setAttribute("data-viewport",o):document.body.removeAttribute("data-viewport"),i==="1"?(r.reset(),window.history.replaceState({},"",window.location.pathname+(s?`?as=${s}`:""))):n==="1"&&(r.updateSession("aarav",{intents:["intimate","novelty","low-key"],reactions:[{cardId:"tiny-bar",reaction:"into_it"},{cardId:"long-walk",reaction:"into_it"},{cardId:"rooftop-drinks",reaction:"not_tonight"},{cardId:"board-games",reaction:"maybe"},{cardId:"neighbourhood-wander",reaction:"into_it"},{cardId:"live-music",reaction:"not_tonight"},{cardId:"sunset-cosy",reaction:"into_it"},{cardId:"creative-activity",reaction:"maybe"}],currentCardIndex:8,screen:a||"s3"}),r.updateSession("sneha",{intents:["intimate","fun","special"],reactions:[{cardId:"live-music",reaction:"into_it"},{cardId:"courtyard-dinner",reaction:"into_it"},{cardId:"street-food-film",reaction:"not_tonight"},{cardId:"dressed-up",reaction:"not_tonight"},{cardId:"creative-activity",reaction:"into_it"},{cardId:"board-games",reaction:"maybe"},{cardId:"rooftop-drinks",reaction:"into_it"},{cardId:"sunset-cosy",reaction:"not_tonight"}],currentCardIndex:8,screen:a||"s0"})),a&&(a==="s2"?(r.updateSession("aarav",{intents:["intimate","novelty","low-key"],screen:"s2"}),r.updateSession("sneha",{intents:["intimate","fun","special"],screen:"s2"})):a==="threshold"?(r.setSessionScreen("aarav","threshold"),r.setSessionScreen("sneha","threshold")):a==="s3"?(r.setSessionScreen("aarav","s3"),r.setSessionScreen("sneha","s3")):a==="s4"?(r.setSessionScreen("aarav","s4_invite"),r.setSessionScreen("sneha","s0")):a==="s4_waiting"?(r.updateShared({inviteSent:!0}),r.setSessionScreen("aarav","s4_waiting"),r.setSessionScreen("sneha","s0")):a==="s5"?(r.setSessionScreen("aarav","s5"),r.setSessionScreen("sneha","s5")):a==="s6"?(r.setSessionScreen("aarav","s6"),r.setSessionScreen("sneha","s6")):a==="s7"?(r.setSessionScreen("aarav","s7"),r.setSessionScreen("sneha","s7")):a==="suggested"?(r.updateShared({suggestion:{by:"sneha",nightId:"middle-ground"}}),r.updateSession("aarav",{screen:"s6"}),r.updateSession("sneha",{screen:"s7",activeNightId:"middle-ground"})):a==="closed"&&(r.updateShared({confirmedNightId:"middle-ground"}),r.updateSession("aarav",{screen:"s7",activeNightId:"middle-ground"}),r.updateSession("sneha",{screen:"s7",activeNightId:"middle-ground"})));function l(){const h=s==="sneha"?"sneha":"aarav";t.innerHTML=`
      <div class="milo-stage">
        <div class="milo-viewport" id="viewport-${h}" data-session-id="${h}">
          ${ke(h)}
        </div>
      </div>
    `,$e(t.querySelector(`#viewport-${h}`),h)}l(),r.subscribe(()=>{l()})}const H=document.getElementById("app");H&&Le(H);
