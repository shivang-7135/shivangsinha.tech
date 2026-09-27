# shivangsinha.tech

Personal site for Shivang Sinha, showcasing two live AI products and explaining how they work:

| Product | Live | Source | Deep dive |
| --- | --- | --- | --- |
| **Lensr**: intent-aware AI search | [lensr.studio](https://lensr.studio) | [lensr-shivang @ production](https://github.com/shivang-7135/lensr-shivang/tree/production) | `lensr.html` |
| **DailyAI**: AI news, summarised once | [dailyai.site](https://dailyai.site) | [shivang-7135/aiNews](https://github.com/shivang-7135/aiNews) | `dailyai.html` |

A plain static site with no build step, no framework and no dependencies (Google Fonts only).

```
index.html        Home: products, "two ways to spend a model call", shared engineering, stack, about
lensr.html        Lensr architecture diagram, step-through pipeline explorer (Deep/Fast), SSE replay, glossary
dailyai.html      DailyAI architecture diagram, pipeline explorer (rss/openai/full), cost calculator, glossary
practice.html     How I work: AI agents + MCP + skills, dev loop explorer, Phoenix eval layers, evaluator playground, safety
assets/styles.css Design tokens (light + dark), layout, components
assets/main.js    Theme toggle, pipeline explorer, SSE replay, cost calculator, evaluator playground
CNAME             Custom domain for GitHub Pages
vercel.json       Security headers + clean URLs for Vercel
```

Pipeline stage content lives in `window.PIPELINES` inside each product page, so it can be edited without touching JS.

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy

**GitHub Pages:** push to GitHub → Settings → Pages → *Deploy from branch* `main` / root.
`CNAME` already contains `shivangsinha.tech`. At your DNS provider add:
- `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- `CNAME` for `www` → `<your-github-username>.github.io`

**Vercel:** import the repo, framework preset *Other*, no build command, output directory `.`.
Add `shivangsinha.tech` under Project → Domains and follow the DNS instructions shown there.
(You can delete `CNAME` if you only use Vercel.)
