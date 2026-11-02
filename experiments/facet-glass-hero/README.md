# Facet — "Designed in glass" hero

A one-screen WebGL hero for **Facet**, a fictional real-time material studio. A dark
website is cut into thick smoked-glass shards floating on black. All content is
printed on the shards and drawn in code (no images, no build step).

## Run

Any static file server works, for example:

```sh
npx serve experiments/facet-glass-hero
# or
python3 -m http.server -d experiments/facet-glass-hero 8080
```

Dependencies load from jsDelivr: three.js 0.169.0 (import map, plus
`RoomEnvironment` from the addons) and Inter (variable woff2).

## Files

- `index.html` — markup. The DOM text is the source of truth for selection, links and
  the static fallback.
- `style.css` — static styled version (reduced motion, no WebGL, no JS) and the
  `.gl` overrides that turn the DOM into a transparent, selectable text layer.
- `main.js` — layout, printed canvases, glass pieces, live cut pattern, tilt and
  hover springs, shatter / reassemble, the "← Back" sliver.

## Notes

- 1 world unit = 1 CSS px at z = 0 (fov 30°, camera at `(H/2) / tan(15°)`).
- Layout scale `S = blockWidth / 1730`. On phones the geometry scale is floored at
  0.42 and type uses its own scale, so corners, gaps and text stay legible.
- The transparent DOM copy is mapped onto the tilted panel and nav with a
  `matrix3d` homography built from their four projected corners.
- Escape also returns from the definitions view.
