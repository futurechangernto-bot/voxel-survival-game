# Voxel Survival Game

A polished single-page voxel survival game built with Three.js, ES modules, and PeerJS for multiplayer. It is designed for static hosting on Netlify.

## Features
- First-person voxel exploration
- Hidden in-browser multiplayer support via PeerJS
- Mining and block placement
- Inventory with stack limits and hotbar
- Crafting system with 2x2 and 3x3 grids
- Health and fall damage
- Item drops and auto-pickup
- Animal AI state machine
- Host-authoritative time sync and admin commands

## Run locally

From the project root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deploy to Netlify

1. Push this project to GitHub.
2. Import the repository in Netlify.
3. Use the default settings for a static site.
4. Deploy.

## Controls
- `WASD`: Move
- `Space`: Jump
- `Left click`: Mine / punch
- `Right click`: Place selected block
- `I`: Open inventory
- `1-0`: Hotbar selection
- `T`: Chat
- `Esc`: Unlock mouse

## Multiplayer
- Host a room using the same game flow in the browser UI or by opening the PeerJS host mode if embedded.
- Use `/kick <peerId>` and `/ban <peerId>` from chat while hosting.

## Notes
- This project is intentionally static-site friendly for Netlify.
- No build step is required.
