# Publishing Context Snack to marketplaces

Plan for shipping updates to Cursor users. **Not yet published** to Open VSX or the VS Code Marketplace at the time this doc was written; verify release status on [GitHub Releases](https://github.com/ofershap/context-snack/releases) and [open-vsx.org](https://open-vsx.org).

## Why Open VSX first for Cursor

Cursor installs extensions from **[Open VSX](https://open-vsx.org)**, not the Microsoft Visual Studio Marketplace, for most built-in extension flows. VSIX from GitHub Releases remains the reliable fallback until listing and Cursor's proxy cache catch up.

## Step 1: Publisher namespace

Context Snack uses **`ofershap`** (same Open VSX namespace as [Cursor Office](https://open-vsx.org/extension/ofershap/cursor-office)).

Note: older Dirt Manager was published under **`ofer-shapira`**. Both namespaces are yours; keep Context Snack on `ofershap` so it matches GitHub and Cursor Office.

1. Sign in to [open-vsx.org](https://open-vsx.org) with GitHub (already done if you see your extensions).
2. Confirm namespace **`ofershap`** exists under User Settings → Namespaces.
3. Access token: [User Settings → Access Tokens](https://open-vsx.org/user-settings/tokens). Export as `OPENVSX_TOKEN` (or reuse `OPEN-VSX-API-TOKEN` from local dirt-manager `.env` if still valid). Never commit tokens.

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
