# Developer Interview Prep

Offline-first interview reference for SQL, .NET, JavaScript, and behavioral questions.

## Features

- Left-side question navigation
- Search across titles, keywords, summaries, and full answers
- Clickable keyword filters
- Category filters
- Bookmarks
- Device-local notes
- Dark mode
- Adjustable text size
- Mobile layout
- Offline caching through a service worker
- Installable as a PWA when served over HTTPS or localhost

## Run locally

From this folder:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Install on iPhone/iPad

The app must first be hosted on HTTPS.

1. Open the hosted URL in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Launch from the home-screen icon.
5. After the first successful load, the app works offline.

## Install on Android/Desktop Chrome

1. Open the hosted HTTPS URL.
2. Use Install App / Add to Home Screen.
3. After the first load, it works offline.

## Add more questions

Edit `data.js`. Each item has:

- `id`
- `category`
- `subcategory`
- `title`
- `keywords`
- `short`
- `answer`

Change the cache name in `service-worker.js` after a major update so installed copies refresh.
