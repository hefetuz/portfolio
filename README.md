# Portfolio

Static portfolio site for Halim Efe Tuzlu.

## Local Development

```bash
npm run dev
```

Site: `http://127.0.0.1:4174/`

Local CMS panel: `http://127.0.0.1:4174/cms.html`

CMS media uploads are stored locally in `assets/cms/`.

## Deployment Build

```bash
npm run build
```

The static deployment output is generated in `dist/`. The build creates:

- SEO-ready root page metadata
- Static project routes under `work/<project-slug>/`
- `sitemap.xml`
- `robots.txt`
- `site.webmanifest`

Set `SITE_URL` or `BASE_PATH` when deploying somewhere other than GitHub Pages:

```bash
SITE_URL=https://hefetuz.github.io/portfolio npm run build
```
