# Codebase Map Generator

A simple utility to generate a visual directory tree of the project. This helps AI agents and developers quickly understand the project structure and navigate the codebase.

## How to use

Run the following command from the project root:

```bash
npm run map
```

This will execute the script located at `tools/map-generator/generate.js` and update the `REPO_MAP.md` file in the root of the project.

## Configuration

The script is configured to ignore common directories and files that clutter the output:
- `node_modules`
- `.git`
- `.next`
- `.factory`
- `dist`
- `build`
- lock files (`package-lock.json`, `pnpm-lock.yaml`, etc.)

To customize the ignore list, edit the `IGNORE_DIRS` and `IGNORE_FILES` constants in `tools/map-generator/generate.js`.

## Output

The output is saved to **`REPO_MAP.md`** at the project root. It includes a timestamp and a formatted text block containing the directory tree.
