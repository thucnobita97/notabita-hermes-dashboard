# notabita-hermes-dashboard

Hermes Agent host state dashboard — auto-updated from host machine.

## Access

Password protected (JS gate). URL is not indexed (`robots.txt` + `noindex`).

## Manual update

```bash
bash ~/.hermes/scripts/update-dashboard.sh
```

## Auto-update

Runs automatically when `sync-all.sh` is executed (git-sync + stack + fork sync).

## Change password

Edit `src/template.html` — find the SHA-256 hash and replace with new one:
```bash
echo -n "NEW_PASSWORD" | sha256sum
```
