# MadeCreative Clone Rules — MANDATORY

These rules override ALL defaults. They apply to EVERY clone job.

## 1. Clone ALL pages AND subpages — the ENTIRE site
- Find EVERY link in the navigation menu (header, footer, hamburger, dropdowns)
- Crawl EVERY internal link recursively up to 3 levels deep
- Create Next.js routes for pages AND subpages with nested folders:
  - Top pages: src/app/team/page.tsx
  - Subpages: src/app/behandlungen/implantate/page.tsx
- Clone: service detail pages, blog posts, team profiles, FAQ pages, everything
- If original has 20 pages including subpages, clone MUST have 20 pages

## 2. Download ALL assets — EVERYTHING
- ALL images from EVERY page and subpage -> public/images/
- ALL videos -> public/videos/ or link to original CDN
- Logo -> public/images/logo.png (or .svg)
- Favicons -> public/seo/
- No placeholders. No stock photos. Only real images.

## 3. Video Hero
- If site has ANY video, use as hero background on homepage
- autoPlay muted loop playsInline with dark gradient overlay
- Use original image as poster fallback
- Include multiple source tags for different formats/resolutions

## 4. Content is sacred
- Copy ALL text verbatim — never rewrite, summarize, or translate
- Keep all menu items, navigation, page names identical
- Keep all contact info, team names, descriptions exact

## 5. Every link MUST work
- All nav links must point to real pages (no 404)
- All internal content links must work
- npm run build must show ALL routes as static pages
- Count routes — must match original site page count
