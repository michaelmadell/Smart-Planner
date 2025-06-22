Deployment:

Install Linux
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

nvm install --lts
```
```bash
node -v
npm -v
```

update
install git nginx

```bash
npm install -g firebase-tools

cd ~

git clone [https://](https://github.com/michaelmadell/Smart-Planner.git)

cd Smart-Planner

npm install

nano .env
```
```bash
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""

VITE_GOOGLE_CLIENT_ID=""
```
```bash
npm run build
```
```bash
sudo nano /etc/nginx/sites-available/Smart-Planner
```
```bash
server {
    listen 80;
    listen [::]:80;

    # Replace with the full path to your app's build directory
    root /home/your_user/YourRepoName/dist;
    index index.html;

    server_name your_domain.com www.your_domain.com; # Or your server's IP address

    location / {
        # This is the magic for Single Page Apps like React
        try_files $uri /index.html;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/Smart-Planner /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```
