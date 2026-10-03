# Running TakeoutLens in Docker

The image is built locally as `takeout-lens:latest`. The container needs two mounts:

| Mount | Container path | Mode | Purpose |
|---|---|---|---|
| Your extracted Takeout folder | `/takeout` | read-only | Source data. Never written to. |
| A Docker volume | `/data` | read-write | Index, thumbnails, password hash, sessions. |

## 1. Extract your Takeout

Unzip all Takeout archives into one folder. Point to either the folder that contains `Mail/`, `Drive/`, `Chat/`... directly, or its parent that contains `Takeout/`.

```
~/takeout-export/
└── Takeout/
    ├── Mail/
    ├── Drive/
    └── ...
```

## 2. Start the container

### Option A: docker compose (recommended)

```bash
cd /path/to/TakeoutLens
TAKEOUT_DIR=~/takeout-export docker compose up -d
```

Or put it in a `.env` file next to `compose.yaml`:

```
TAKEOUT_DIR=/Users/you/takeout-export
```

then `docker compose up -d`. Compose builds the image if needed, mounts the folder read-only, and publishes port 3000 on `127.0.0.1` only.

### Option B: plain `docker run` (uses the already-built image)

```bash
docker run -d --name takeout-lens \
  -p 127.0.0.1:3000:3000 \
  -v ~/takeout-export:/takeout:ro \
  -v takeout-lens-data:/data \
  takeout-lens:latest
```

## 3. Open the app and index

1. Visit <http://localhost:3000>.
2. First run: set a password.
3. Click **Reindex** in the sidebar to scan `/takeout` and build the index. This can take a while for large mailboxes. It is incremental and resumable.

## Accessing from another machine / hostname

Only `localhost`, `127.0.0.1` and `[::1]` are accepted by default. For a LAN name or reverse proxy:

```bash
ALLOWED_HOSTS=takeout.lan docker compose up -d
```

(and change the port mapping from `127.0.0.1:3000:3000` to e.g. `3000:3000` in `compose.yaml`). The app has a password, but do not expose it to the internet.

## Common tasks

```bash
docker compose logs -f viewer      # logs
docker compose down                # stop (keeps index and password)
docker compose down -v             # stop and wipe index + password
docker compose up -d --build       # rebuild after pulling changes
```

Rebuild the image by hand: `docker build -t takeout-lens:latest .`

## Troubleshooting

- **Empty modules after login**: run Reindex; check `docker logs takeout-lens` and that `/takeout` contains the module folders (`docker exec takeout-lens ls /takeout`).
- **macOS, no files visible**: Docker Desktop must be allowed to access the folder (Settings → Resources → File sharing, or macOS Privacy → Files and Folders).
- **"Invalid host" errors**: add the hostname to `ALLOWED_HOSTS`.
- **Reset everything**: remove the data volume (`docker compose down -v`, or `docker volume rm takeout-lens-data`).
- Only English Takeout folder names are supported.
