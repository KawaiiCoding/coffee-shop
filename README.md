# Coffee Shop

A cozy, mobile-first café game. Crocheted animal guests walk in, you seat them,
take their order, carry their latte from the counter and collect their tips.
Spend tips on upgrades and decorations. The café redresses itself for spring,
Christmas and Halloween.

Runs in any modern browser. Built with Vite and TypeScript, no game framework.

## Play locally

```bash
npm install
npm run dev        # open the printed URL on your phone (same Wi-Fi) or desktop
```

## How to play

| Tap | What happens |
| --- | --- |
| The guest at the door | Selects them |
| A free table | Seats the selected guest |
| A table with an order bubble | The waiter takes the order to the barista |
| The counter | The waiter picks up ready drinks and food (tray holds 2) |
| The guest's table | Serves it. More patience left means a bigger tip |
| Coins on a table | Collects the tip and frees the table |

A day lasts two minutes. After it, spend coins on upgrades (more tables, faster
machine, bigger tray, comfier cushions) and decorations. Decorations add charm,
which brings guests faster and raises tips.

## Add your jazz music

1. Put `.mp3` files in `public/music/`.
2. List them in `public/music/playlist.json`:
   ```json
   { "tracks": ["cozy-jazz-1.mp3", "rainy-cafe.mp3"] }
   ```
Music starts after the first tap (browser autoplay rules) and can be turned off
in Settings. Only use tracks you have the rights to publish.

## Project layout

| Folder | Contents |
| --- | --- |
| `src/types.ts`, `src/layout.ts` | Shared contract: game state, ids and scene positions |
| `src/art/` | All drawing (SVG): characters, café, furniture, decor, icons |
| `src/engine/` | Game rules, saving, and the scene renderer |
| `src/ui/` | Screens, menus, buttons, sound effects and music player |
| `tests/` | Engine tests (`npm test`) |

## Deploy to GitHub Pages

1. Create an empty repository on GitHub, for example `coffee-shop`.
2. From this folder:
   ```bash
   git init -b main
   git add .
   git commit -m "Coffee Shop"
   git remote add origin https://github.com/<you>/coffee-shop.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Source: GitHub Actions**.

Every push to `main` runs the tests, builds, and publishes to
`https://<you>.github.io/coffee-shop/`.

## Scripts

- `npm run dev` start the dev server
- `npm test` run engine tests
- `npm run build` typecheck and build to `dist/`
- `npm run preview` serve the built `dist/`
