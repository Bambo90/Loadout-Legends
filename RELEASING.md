# Releasing

Single source for release procedure.

## Versioning

- Follow semantic versioning: `MAJOR.MINOR.PATCH`.
- Bump `package.json` version first.

## Pre-Release Checklist

1. Run local smoke checks:
   - app boots
   - save/load works
   - coast combat loop works
   - workshop drag/rotate/drop works
2. Update docs:
   - `CHANGELOG.md`
   - `docs/releases/RELEASE_NOTES_vX.Y.Z.md`
   - `docs/verification/VERIFICATION_vX.Y.Z.md`
3. Ensure `NEXT.md` reflects post-release priorities.

## Release Steps

1. Commit release metadata:
```bash
git add package.json CHANGELOG.md docs/releases docs/verification NEXT.md
git commit -m "release: vX.Y.Z"
```
2. Tag:
```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
```
3. Push:
```bash
git push origin main
git push origin vX.Y.Z
```
4. Create GitHub release and attach builds/artifacts.

## Hotfix Flow

1. Create hotfix branch from `main`.
2. Apply minimal fix and re-run smoke checks.
3. Bump patch version, update release docs, tag, and publish.

## References

- Changelog: `CHANGELOG.md`
- Detailed notes: `docs/releases/`
- Verification checklist: `docs/verification/`
