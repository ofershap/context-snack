# Publishing Context Snack to marketplaces

Plan for shipping updates to Cursor users. **Not yet published** to Open VSX or the VS Code Marketplace at the time this doc was written; verify release status on [GitHub Releases](https://github.com/ofershap/context-snack/releases) and [open-vsx.org](https://open-vsx.org).

## Why Open VSX first for Cursor

Cursor installs extensions from **[Open VSX](https://open-vsx.org)**, not the Microsoft Visual Studio Marketplace, for most built-in extension flows. VSIX from GitHub Releases remains the reliable fallback until listing and Cursor's proxy cache catch up.

## Step 1: Claim the `ofershap` namespace on Open VSX

1. Sign in to [open-vsx.org](https://open-vsx.org) with GitHub.
2. Claim or create the publisher namespace **`ofershap`** (must match `package.json` `"publisher"`).
3. Create an **Personal Access Token** in Open VSX profile settings. Store it as `OPENVSX_TOKEN` (never commit it).

Update `package.json` before publish:

- `"publisher": "ofershap"`
- `"repository.url": "https://github.com/ofershap/context-snack"`
- `"author"` as appropriate

## Step 2: Build the VSIX

```bash
npm install
npm run compile
npm i -g @vscode/vsce ovsx   # or use npx
vsce package --allow-star-activation
```

Produces `context-snack-<version>.vsix`. Star activation (`activationEvents: ["*"]`) requires `--allow-star-activation` for vsce.

Ensure `.vscodeignore` excludes dev-only files but keeps `out/`, hook script, README, LICENSE.

## Step 3: Publish to Open VSX

```bash
ovsx publish context-snack-*.vsix -p "$OPENVSX_TOKEN"
```

For updates, bump `version` in `package.json`, rebuild VSIX, publish again.

## Step 4: Cursor visibility

After Open VSX publish:

- Search in Cursor Extensions for `context-snack` or `@id:ofershap.context-snack`.
- Cursor's marketplace mirror may **lag** minutes to hours; if users cannot install, point them to **Install from VSIX** on GitHub Releases.

Attach the same VSIX to each GitHub Release for parity.

## Verification badge (defer)

Open VSX / marketplace "verified publisher" flows often require proving domain ownership. A GitHub README link alone is usually insufficient. Defer until `context-snack` has a stable project domain; use unverified listing until then.

## Optional: VS Code Marketplace (Microsoft)

VS Code users on microsoft.com marketplace can be reached separately:

1. Create a [Visual Studio Marketplace publisher](https://marketplace.visualstudio.com/manage).
2. Use `vsce publish` with a Microsoft PAT (different from Open VSX).

Maintaining two stores doubles release steps; prioritize Open VSX + GitHub VSIX for Cursor-first audience.

## Release checklist

- [ ] Version bumped in `package.json`
- [ ] `npm test` and feed judges pass
- [ ] `vsce package --allow-star-activation`
- [ ] GitHub Release with VSIX asset
- [ ] `ovsx publish` with new VSIX
- [ ] Smoke install in Cursor (Open VSX or VSIX)
