# ROOK benchmark runtime

Public, reproducible container builder for the ROOK systems benchmark.

The image contains the published `@testmuai/rook` package plus the benchmark's
bounded JSON-RPC fixture client. It contains no benchmark corpus, hidden truth,
reviewer material, credentials, or private ROOK source.

The release workflow builds from protected `main`, pushes the exact image digest
to GHCR, generates an SPDX SBOM for each amd64 and arm64 child manifest, and
publishes GitHub provenance plus digest-bound per-platform SBOM attestations.
`runtime.json` is the canonical ROOK release identity.

## Local verification

```bash
npm ci --ignore-scripts --no-audit --no-fund
docker build --pull=false \
  --build-arg ROOK_VERSION=0.1.6 \
  --build-arg ROOK_NPM_INTEGRITY=sha512-xgDIHBBx8Amv1IJ72THIC85AzxIST96xTzOc9LcRw6Ik54eDn6sXwi8lwbpWG46ff0hb796Xshgigyt4m0cGKw== \
  --build-arg ROOK_GIT_HEAD=6e3598468dbd0c63cb598cd33dd0cf6087d01b70 \
  --build-arg ROOK_BUILD_ENV=prod \
  -t rook-benchmark-runtime:local .
docker run --rm --network none --read-only --tmpfs /tmp \
  rook-benchmark-runtime:local --version
```

Expected version: `0.1.6`.
