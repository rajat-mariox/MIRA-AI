# Deploying MIRAI on AWS EC2 (Ubuntu)

One EC2 instance runs everything:

| Part | How it runs | Public URL (replace with yours) |
|---|---|---|
| `mirai-backend` | Node.js under PM2 on port 5000, behind Nginx | `https://api.miraiastro.com/api/v1` |
| `mirai-admin-panel` | static build served by Nginx | `https://admin.miraiastro.com` |
| `mirai-react` (website) | static build served by Nginx | `https://miraiastro.com` |
| MongoDB | MongoDB Atlas (recommended) or MongoDB on the same server | — |

The mobile app is not hosted on AWS: build an APK / store build; it calls the API URL above
(`mirai-app/src/config.ts` → `PROD_API_BASE_URL`).

If you use different domains, change them in: `deploy/nginx/mirai.conf`, `mirai-backend/.env`
(`PUBLIC_BASE_URL`, `CORS_ORIGINS`), `mirai-admin-panel/.env`, `mirai-react/.env.production` and
`mirai-app/src/config.ts`.

---

## 1. AWS setup (once)

1. **Elastic IP**: EC2 → Elastic IPs → Allocate → Associate with the instance (the IP then never changes).
2. **Security group** (instance → Security → inbound rules): allow **22** (SSH), **80** (HTTP), **443** (HTTPS).
   Do **not** open 5000 or 27017.
3. **DNS** (where your domains are managed): add an **A record** for each domain → the Elastic IP:
   `api.miraiastro.com`, `admin.miraiastro.com`, `miraiastro.com`, `www.miraiastro.com`.

## 2. Install the software (once)

```bash
sudo apt update && sudo apt upgrade -y
# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx rsync git
sudo npm install -g pm2
node -v && nginx -v && pm2 -v
```

Small instance (1–2 GB RAM)? Builds need memory — add 2 GB swap once:
```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 3. Database

**Option A — MongoDB Atlas (recommended, managed backups):** create a free/paid cluster at
https://cloud.mongodb.com, add the EC2 Elastic IP to *Network Access*, create a DB user, and use
its connection string as `MONGODB_URI` (e.g. `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/mirai`).

**Option B — MongoDB on this server:**
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
```
`MONGODB_URI=mongodb://127.0.0.1:27017/mirai`

**Copy your local data (optional)** — admin, plans, CMS, banners, users… On your PC:
`mongodump --db mirai --out mirai-dump`, upload the folder, then on the server
`mongorestore --uri "<MONGODB_URI>" --db mirai mirai-dump/mirai`.
(Without it the backend seeds the admin, plans, CMS, FAQs and the banner on first start.)

## 4. Backend

```bash
cd ~/MIRA-AI/mirai-backend
cp .env.example .env
nano .env
```
Fill `.env` (copy the keys from your local `mirai-backend/.env`). Production values:
```env
NODE_ENV=production
PORT=5000
PUBLIC_BASE_URL=https://api.miraiastro.com
CORS_ORIGINS=https://admin.miraiastro.com,https://miraiastro.com,https://www.miraiastro.com
TRUST_PROXY=1
MONGODB_URI=...                      # from step 3
JWT_ACCESS_SECRET=...                # NEW long random strings for production:
JWT_REFRESH_SECRET=...               #   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_ADMIN_SECRET=...
ADMIN_SEED_EMAIL=admin@yourdomain.com
ADMIN_SEED_PASSWORD=<strong password>
SMTP_HOST=... SMTP_PORT=587 SMTP_USER=... SMTP_PASS=... SMTP_FROM="MIRAI <no-reply@yourdomain.com>"
DIVINE_API_KEY=...  DIVINE_AUTH_TOKEN=...
AI_PROVIDER=openai  OPENAI_API_KEY=...
GOOGLE_CALENDAR_API_KEY=...
FIREBASE_SERVICE_ACCOUNT_PATH=secrets/firebase-service-account.json
```
Important:
- **SMTP is required in production.** With `NODE_ENV=production` the dev OTP (1234) is disabled,
  so users can only log in with the OTP emailed to them.
- Firebase push: put the service-account JSON at `~/MIRA-AI/mirai-backend/secrets/firebase-service-account.json`
  (upload it with `scp`; never commit it).

Start it:
```bash
npm ci && npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup          # run the sudo command it prints, so the API starts after a reboot
curl http://127.0.0.1:5000/api/v1/health
```
Logs: `pm2 logs mirai-api` · restart: `pm2 reload mirai-api`.

## 5. Admin panel and website

`mirai-admin-panel/.env` and `mirai-react/.env.production` already point to
`https://api.miraiastro.com/api/v1` (change them if your API domain differs).
```bash
cd ~/MIRA-AI/mirai-admin-panel && npm ci && npm run build
sudo mkdir -p /var/www/mirai-admin && sudo rsync -a --delete dist/ /var/www/mirai-admin/

cd ~/MIRA-AI/mirai-react && npm ci && npm run build
sudo mkdir -p /var/www/mirai-site && sudo rsync -a --delete dist/ /var/www/mirai-site/
```

## 6. Nginx + HTTPS

```bash
sudo cp ~/MIRA-AI/deploy/nginx/mirai.conf /etc/nginx/sites-available/mirai.conf
sudo nano /etc/nginx/sites-available/mirai.conf      # set your 3 domains
sudo ln -sf /etc/nginx/sites-available/mirai.conf /etc/nginx/sites-enabled/mirai.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.miraiastro.com -d admin.miraiastro.com -d miraiastro.com -d www.miraiastro.com
```
Certbot adds HTTPS and auto-renews. Check: `https://api.miraiastro.com/api/v1/health`.

## 7. Updating later

Push from your PC, then on the server:
```bash
cd ~/MIRA-AI && bash deploy/deploy.sh
```
It pulls, rebuilds the backend (PM2 reload), the admin panel and the website.

## 8. Mobile app release

`mirai-app/src/config.ts` uses `PROD_API_BASE_URL` in release builds. Build:
```bash
cd mirai-app/android
./gradlew assembleRelease        # APK: app/build/outputs/apk/release/
./gradlew bundleRelease          # AAB for Google Play
```
For Google Play you need your own release keystore (signingConfigs.release in
`android/app/build.gradle`) — keep it safe and out of git.
