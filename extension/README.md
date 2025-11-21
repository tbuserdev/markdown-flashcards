# NotebookLM Quiz Exporter Extension

This extension extracts quiz data from NotebookLM pages.

## Development

The extension is written in TypeScript. You need to build it before loading it into Chrome.

### Build

Run the following command from the project root:

```bash
pnpm build:extension
```

(Or `npm run build:extension` if you use npm)

This will compile the TypeScript files to JavaScript in the `dist/` directory.

### Installation

1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** in the top right corner.
3.  Click **Load unpacked** in the top left.
4.  Select this `extension` folder (the folder containing `manifest.json`).

**Note:** Do not select the `dist` folder. The `manifest.json` is in the `extension` root and points to the files in `dist`.

### Updating

If you make changes to the code:
1.  Run `pnpm build:extension` again.
2.  Go to `chrome://extensions/` and click the reload icon on the extension card.
