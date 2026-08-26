# Kwun's Dollhouse — Interactive Portfolio

A one-page interactive portfolio built as a Sylvanian-style dollhouse. Click the
house on the landing scene to zoom into a cutaway interior with four rooms,
each holding an interactive object:

- **Study** — the notebook opens a paged journal (experience, projects, education, languages).
- **Living room** — the vase opens a bouquet builder; the record player opens an Apple Music embed.
- **Kitchen** — the fridge opens a 4-cut photo booth (camera or upload, frame colours, stickers, PNG download).
- **Porch** — the mailbox opens a contact postcard with copy-to-clipboard buttons.

## Stack

Vite + React + Tailwind CSS + [lucide-react](https://lucide.dev/) icons. No
backend — everything (photo booth, bouquet SVG export) runs client-side with
the Canvas/File APIs.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## Swapping in real artwork

Every clickable object lives inside a `<Hotspot>` in `src/DollhousePortfolio.jsx`,
each with a comment naming what to replace:

```jsx
<Hotspot top="52%" left="42%" width="24%" label="Open my journal" onClick={...}>
  <NotebookArt />   {/* swap for <img src="/notebook.png" alt="" className="w-full" /> */}
</Hotspot>
```

Positions are percentages of the parent room, so a PNG cut-out lands in the
same spot at any screen size. Replace `NotebookArt`, `VaseArt`, `FridgeArt`,
`MailboxArt`, and `KwunFigure` with your own artwork the same way.
