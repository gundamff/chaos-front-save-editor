# Maintainer: How to release

[中文](RELEASE.md) | **English**

For maintainers. Pushing a `v*` tag runs GitHub Actions to test, build the portable exe, and create a Release.

## First time

1. Open the repo → **Actions**
2. Enable workflows if prompted
3. Pushes to `main` run **CI**; tags like `v1.2.0` run **Release**

## Ship a new version (e.g. 1.2.0)

1. Add `## [1.2.0] - date` (and notes) at the top of `CHANGELOG.md` and `CHANGELOG.en.md`
2. Set `version` in `package.json` / `package-lock.json` to `1.2.0` (optional; CI also syncs from the tag)
3. Commit and push `main`
4. Tag and push (triggers the release):

```bash
git tag v1.2.0
git push origin v1.2.0
```

5. Watch **Actions → Release** until green, then download `ChaosFrontSaveEditor-1.2.0.exe` from **Releases**

## Notes

- Tag format: `v` + semver, e.g. `v1.2.0`
- Release body is generated from the Chinese `CHANGELOG.md` section (`scripts/changelog-for-version.mjs`)
- On failure, check the red step in the Actions log
