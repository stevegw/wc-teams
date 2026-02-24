
# Windchill Teams Assistant (Starter)

A tiny client‑side app that renders **step‑by‑step wizards** for common Windchill administration flows:
Participants → Licensing → Context Teams → Shared Teams → Team Templates/OIR → Role Resolution.

> **What this is:** guidance/UI scaffolding for admins and context managers.
> **What this is not:** it does not call server APIs or change your Windchill configuration.

## Quick start

1. Create a new GitHub repo (e.g. `wc-teams-assistant`).
2. Download this starter or copy the files into your repo.
3. Enable GitHub Pages (Settings → Pages → Branch: `main`, Folder: `/root`).
4. Open the site. You can host on Netlify/Vercel as well.

## Structure

```
/ (root)
  index.html       # App shell
  styles.css       # Light/dark theme
  app.js           # Renderer, routing, localStorage
  /flows           # JSON content that defines each wizard
    index.json
    participants.create-user.json
    licensing.assign-license-group.json
    teams.context-team-basics.json
    teams.shared-teams.json
    teams.team-template-oir.json
    role-resolution.explainer.json
```

## Authoring flows
Each flow is a JSON file with `id`, `title`, and an array of `steps`. A step supports:

```json
{
  "label": "Open Participant Administration",
  "where": "Navigator → Organizations → <Your Org> → Utilities → Participant Administration",
  "action": "Click ‘Create new user’.",
  "verify": "A new user creation dialog appears.",
  "inputs": { "Name": "jsmith", "Email": "jsmith@example.com" },
  "notes": ["Short hints and gotchas."]
}
```

Add the new flow to `flows/index.json` to show it in the left menu.

## Content provenance & trademarks
The wording in flows is **paraphrased** from Windchill enablement/training materials that you (the repository owner) provided. Please ensure your use complies with your organization’s terms. Windchill and PTC are trademarks of PTC Inc.

## License
- App code: MIT
- Flow content: As provided/owned by you; verify rights before redistribution.
