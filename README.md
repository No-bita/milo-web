# milo — Better dates. Less planning.

> *You picked the person. I'll handle the plans.*  
> *Not a dating app. Just better dates.*

Milo is an emotionally intelligent, conversational date planning web application designed mobile-first. Once you and your date have agreed to meet, Milo balances both preferences, handles Bangalore localities, checks venue availability, and locks in the evening without the planning fatigue.

---

## ✨ Features

- **Conversational Milo Voice**: Milo behaves like a thoughtful, observant friend who takes ownership of the logistics.
- **Option A Flexible Date & Time**: Quick anchors (`Tonight`, `Tomorrow`, `This Weekend`, `Next Week`), native date picker (`📅 Pick any date`), vibe time windows (`Afternoon`, `Sunset`, `Evening`, `Late Night`), exact time picker, and `±30m flexible` toggle.
- **Locality Matching**: Curated Bangalore areas (`Indiranagar`, `Koramangala`, `HSR Layout`, `Church Street / CBD`, `JP Nagar`, `Whitefield`, `Anywhere in Bangalore`) without false traffic promises.
- **Two-Sided Preference Matching**: Two people share preferences and hard no's independently.
- **Deterministic Recommendation Engine**: Filters dealbreakers and curates 3 distinct date concepts with personalized "Why I picked this" insights.
- **Booking & Day-of-Date Logistics**: Seamless confirmation, calendar integration, directions, and pre-date reminders.
- **Responsive Mobile-First Architecture**: 100% native mobile feel on smartphones (`< 768px`) with clean centered presentation on desktop, zero artificial phone bezels.
- **All 16 Screens Showcase Grid**: Includes a gallery view to inspect the entire end-to-end journey.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Run local development server
```bash
npm run dev
```

### 3. Build for production
```bash
npm run build
```

---

## 📁 Project Structure

```
milo-web/
├── index.html                  # HTML entry point
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite configuration
└── src/
    ├── main.js                 # App mounting entry point
    ├── v2-app.js               # Master screen router & navigation controller
    ├── state.js                # Central reactive state store
    ├── COPY.md                 # Complete conversational copy deck
    ├── styles/
    │   └── milo.css            # Responsive design tokens & styles
    ├── data/
    │   ├── venues.js           # Curated Bangalore venues dataset
    │   └── recommendations.js  # Recommendation engine & rationales
    ├── components/
    │   ├── mobile-shell.js     # Responsive container wrapper
    │   ├── nav-toolbar.js      # Developer controls & screen switcher
    │   └── all-screens-grid.js # 16-screen showcase gallery
    └── screens/
        ├── screen-01-welcome.js
        ├── screen-02-date-context.js
        ├── screen-03-location.js
        ├── screen-04-invite.js
        ├── screen-05-invitee-welcome.js
        ├── screen-06-preferences.js
        ├── screen-07-practical.js
        ├── screen-08-overlap.js
        ├── screen-09-options.js
        ├── screen-10-both-chosen.js
        ├── screen-11-confirmed.js
        ├── screen-12-details.js
        ├── screen-13-day-of-date.js
        ├── screen-14-reminders.js
        ├── screen-15-feedback.js
        └── screen-16-next-date.js
```
