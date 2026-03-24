# Hello Platform Plugin

Minimal Angular 16 MEF.DEV UI plugin using:

- `@natec/mef-dev-ui-kit`
- `@natec/mef-dev-platform-connector`

## Local development

```bash
npm start
```

Open `http://localhost:4200`.

## Build plugin artifact

```bash
npm run generate-version-file
npm run build:plugin
```

The production artifact is generated in `dist/ai-llm-ui`.

## Publish to MEF.DEV

Set `bauth` and optionally `alias` in `src/environments/environment.ts`, or pass them as CLI arguments.

```bash
npm run publish:mef -- bauth=YOUR_NAME:YOUR_PASSWORD alias=YOUR_ALIAS
```

`metadata.json` contains the plugin menu route configuration used during publication.
