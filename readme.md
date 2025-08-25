# Deploy the Pulsechain-369 Terminal Server (Free options)


This codebase is already TypeScript + Express. Choose a host below and follow steps.


---
## Option A — Render (Free Web Service)
1. Push this repo to GitHub.
2. Create service at https://render.com → **New +** → **Web Service** → connect repo.
3. Settings:
- Build Command: `npm install && npm run build`
- Start Command: `node dist/server.js`
- Environment: **Node**
4. Add env vars (from `.env.example`). At minimum set `PORT=3000`, `HOST=0.0.0.0`.
5. Deploy → visit `https://<your-app>.onrender.com/docs`.


Notes:
- Free tier sleeps after idle; first request cold-starts.
- Add `API_TOKEN` if you plan to protect `/api/im/*` etc.


---
## Option B — fly.io (Free container)
Prereqs: install Fly CLI (`curl -L https://fly.io/install.sh | sh`) and login (`fly auth login`).


1. `fly launch` → accept Dockerfile, set internal port 3000, pick a region.
2. `fly secrets set PUBLIC_BASE_URL=https://<your-app>.fly.dev PLS_RPC=https://rpc.pulsechain.com`
3. `fly deploy` → after success, open `https://<your-app>.fly.dev/docs`.


Notes:
- Scale-to-zero is enabled in `fly.toml` (auto_stop_machines=true). Disable if you want always-on.


---
## Option C — Railway / Glitch / Any Docker Host
- **Railway**: Create a project, connect repo → it will detect Node. Set start command `node dist/server.js` and add env vars.
- **Glitch**: Create a new project, import from GitHub. Ensure `PORT` is used; Glitch sets it automatically. (Cold sleeps often.)
- **Generic Docker**: `docker build -t pulse369 . && docker run -it -p 3000:3000 --env-file .env pulse369`


---
## Verify after deploy
- Open `/docs` (Swagger UI) and `/openapi.json`.
- Test IM bus:
```bash
curl -X POST "$PUBLIC_BASE_URL/api/im/send" \
-H 'content-type: application/json' \
${API_TOKEN:+-H "authorization: Bearer $API_TOKEN"} \
-d '{"roomId":"general","from":"SigmaGPT","text":"hello from the cloud"}'


curl "$PUBLIC_BASE_URL/api/im/history?roomId=general&sinceTs=0&limit=10"
```
- Test chain read:
```bash
curl "$PUBLIC_BASE_URL/api/chain/info"
```


---
## Hardening (optional)
- Set `API_TOKEN` and require it on IM endpoints (extend middleware later).
- If you enable writes later (`WRITE_ENABLED=1` + `PRIVATE_KEY`), prefer **send-raw** with client-side signing.
- Add logging/metrics (Render logs page or fly logs).


---
## Troubleshooting
- **Port in use / wrong port**: host must expose `$PORT`=3000; do not hardcode other ports.
- **Cold starts**: free tiers sleep; hit `/openapi.json` to wake.
- **Build fails**: ensure Node 20+; Render and Fly images use Node 20.
