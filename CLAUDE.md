# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run docs:dev      # Start dev server (hot reload, accessible at localhost + uk.frp.one)
npm run docs:build    # Build for production into src/.vitepress/dist/
npm run docs:preview  # Preview production build locally
```

There are no tests or linting configured — this is a personal blog, not a library.

## Architecture Overview

ZMdocs is a VitePress v2 (alpha) site. The source root is `src/` (unlike the VitePress default of `docs/`).

### Content = Sidebar

All `.md` files under `src/` automatically appear in the sidebar. A custom filesystem-driven sidebar generator (`src/.vitepress/theme/utils/sidebarGenerator.js`) runs at build/config time via `config.ts`. It recursively scans `src/`, reads `gray-matter` frontmatter from each file, and builds the sidebar structure.

**Frontmatter fields that control sidebar behavior:**
- `SideBar` / `title` — menu display text (priority: `SideBar` → `title` → filename)
- `Order` — sort position for files; lower = earlier. Items without `Order` sort by file birth time after all ordered items.
- `Hidden: true` — hide from sidebar. On a folder's `index.md`, hides the entire group.
- `SideBarTitle` — folder group display name (only meaningful in a folder's `index.md`)
- `GroupOrder` — sort position for folder groups; same semantics as `Order`
- `collapsed` — folders at depth ≥ 1 default to collapsed; `src/` root-level folders default to expanded.

Folders become collapsible sidebar groups. The `public/` and `.vitepress/` directories are always excluded.

### Theme = Default VitePress Theme + Custom Overrides

`src/.vitepress/theme/index.ts` extends `vitepress/theme` and adds four runtime behaviors via route-aware lifecycle hooks:

1. **Hero image tilt effect** (`heroImageTilt.ts`) — Mouse-follow parallax on the home page hero image. Tracks mouse relative to image center for translate + box-shadow animation. Auto-disables below 960px. Watches for dark/light theme changes to adjust shadow color.

2. **Dynamic navbar CSS swapping** (`Navbar-and-404-Style.ts`) — Imports different navbar CSS files at runtime based on route:
   - Home page + 404 → `navbar-home.css` (dynamically imported, `?raw` import)
   - Document pages → `navbar-document.css`
   - 404 page → additionally injects `pages/404.css`

3. **Sidebar accordion height animation** (`useSidebarHeight.ts`) — Calculates visible height of sidebar group children and applies `max-height` transitions on expand/collapse.

4. **Auto-scale** (`autoScale.ts`) — Vue composable that scales `.VPContent` to fit viewports narrower than 1280px. Not currently wired into theme setup (available for opt-in use).

### CSS Organization

Styles live in `src/.vitepress/theme/styles/` with a three-tier structure:

```
styles/
├── index.css              # Single import hub — all globals imported here
├── global/                # Always loaded, applies everywhere
│   ├── var.css            # CSS custom properties (brand colors, backdrop blurs, backgrounds)
│   ├── basic.css          # Base element overrides
│   ├── background.css     # Light/dark background images per theme
│   ├── liquid-glass.css   # The "frosted glass" design system — blur, border, shadow combos
│   ├── navbar.css         # Navbar base styles
│   └── search.css         # Local search modal styling
├── home/                  # Home page only
│   ├── hero.css           # Hero name gradient, brand button gradient, hero image
│   └── features.css       # Features grid cards
├── docs/                  # Document/markdown pages
│   ├── sidebar.css        # Sidebar panel styling
│   └── document.css       # Content area, prev/next pagers, edit-info
└── dynamic/               # NOT in index.css — injected at runtime via JS
    ├── navbar/
    │   ├── navbar-home.css
    │   └── navbar-document.css
    └── pages/
        └── 404.css
```

**Key design token:** Two backdrop-blur levels defined as CSS variables (`--zm-backdrop-blur-low`, `--zm-backdrop-blur-medium`) and three background opacity levels (`--zm-background-low/medium/high`). The "liquid glass" aesthetic uses these with `backdrop-filter`, translucent borders, rounded corners, and box-shadows. For globally-loaded CSS, do NOT write `-webkit-` prefixed properties — Vite's build handles prefixing. For dynamically-injected CSS (`dynamic/` folder), include both prefixed and unprefixed versions.

### Vite Config Notes

- Dev server binds to `0.0.0.0` with `strictPort: true` — needed for `uk.frp.one` reverse proxy access
- `allowedHosts` includes `uk.frp.one` and `*.frp.one` wildcard for the proxy tunnel

### Dependencies

- **vitepress** `^2.0.0-alpha.18` — VitePress v2 alpha; APIs may differ from v1.x stable
- **sass-embedded** `^1.100.0` — SCSS compiler (not actually used in current CSS; all styles are plain CSS)
- **gray-matter** `^4.0.3` — Frontmatter parser, used by the sidebar generator at build time
