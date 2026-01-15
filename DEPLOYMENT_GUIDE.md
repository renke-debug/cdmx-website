# CDMX Website Deployment Guide
**Domeinnaam:** cdmx.be (via Combell)
**Datum:** January 2026

---

## 🚀 Deployment Opties

### **Optie 1: GitHub Pages + Cloudflare (AANBEVOLEN - Gratis & Secure)**

**Voordelen:**
- ✅ Volledig gratis
- ✅ Automatische HTTPS/SSL
- ✅ Cloudflare DDoS protection
- ✅ Wereldwijde CDN (super snel)
- ✅ Automatische deployments via git push
- ✅ Eenvoudig te beheren

**Stappen:**

#### 1. GitHub Repository Setup
```bash
cd "/Users/renkepieters/Documents/1. CDMX/3. Marketing"

# Initialiseer git repository
git init

# Voeg bestanden toe
git add cdmx-tesla.html
git add Brand/
git add 14240744_3840_2160_24fps.mp4
git add .gitignore

# Eerste commit
git commit -m "Initial CDMX website deployment"

# Maak GitHub repository aan (via GitHub website of CLI)
# Ga naar github.com → New Repository → "cdmx-website"

# Link local repository aan GitHub
git remote add origin https://github.com/[jouw-username]/cdmx-website.git
git branch -M main
git push -u origin main
```

#### 2. GitHub Pages Activeren
1. Ga naar je repository op GitHub.com
2. Klik op **Settings** → **Pages**
3. Bij "Source" selecteer: **main branch** / **root**
4. Hernoem `cdmx-tesla.html` naar `index.html` (dit is vereist voor GitHub Pages)
5. Klik op **Save**
6. Je website is nu live op: `https://[jouw-username].github.io/cdmx-website/`

#### 3. Custom Domain via Combell DNS
1. **Log in bij Combell**
2. Ga naar **DNS Management** voor cdmx.be
3. Voeg volgende records toe:

```
Type    Name    Content                         TTL
A       @       185.199.108.153                 3600
A       @       185.199.109.153                 3600
A       @       185.199.110.153                 3600
A       @       185.199.111.153                 3600
CNAME   www     [jouw-username].github.io.      3600
```

4. **Terug naar GitHub Pages Settings**
5. Voer in bij "Custom domain": `cdmx.be`
6. Wacht 15-30 minuten voor DNS propagation
7. Vink aan: **Enforce HTTPS** (voor SSL certificaat)

#### 4. Cloudflare Setup (Extra Security & Performance)
1. Ga naar [cloudflare.com](https://cloudflare.com) → Sign up
2. Klik op **Add a Site** → Voer `cdmx.be` in
3. Selecteer **Free plan**
4. Cloudflare scant je DNS records
5. Verifieer dat de A records kloppen (zie hierboven)
6. Cloudflare geeft je 2 nameservers, bijv.:
   ```
   arya.ns.cloudflare.com
   tim.ns.cloudflare.com
   ```
7. **Ga terug naar Combell** → DNS Management
8. Verander de **Nameservers** naar de Cloudflare nameservers
9. Wacht 24-48 uur voor volledige activatie

#### 5. Cloudflare Security Settings (na activatie)
1. **SSL/TLS** → Encryption mode: **Full (strict)**
2. **Security** → Security Level: **Medium**
3. **Speed** → Auto Minify: Vink aan **HTML, CSS, JavaScript**
4. **Caching** → Caching Level: **Standard**
5. **Firewall** → Managed Challenge: **Enabled**
6. **Page Rules** → Altijd HTTPS forceren:
   ```
   URL: http://*cdmx.be/*
   Setting: Always Use HTTPS
   ```

---

### **Optie 2: Combell Hosting (Betaald maar eenvoudig)**

**Voordelen:**
- ✅ Alles bij 1 provider (Combell)
- ✅ Support in Nederlands
- ✅ FTP/File Manager toegang
- ✅ Mogelijk al inbegrepen bij je domein pakket

**Nadelen:**
- ❌ Kosten: €5-15/maand
- ❌ Geen automatische deployments
- ❌ Langzamer dan CDN opties

**Stappen:**

#### 1. Check Combell Hosting
1. Log in op [my.combell.com](https://my.combell.com)
2. Check of je al een hosting pakket hebt bij cdmx.be
3. Zo niet → **Bestel webhosting** (Start/Pro pakket)

#### 2. Upload Bestanden via FTP
1. Download **FileZilla** ([filezilla-project.org](https://filezilla-project.org))
2. FTP gegevens vind je in Combell dashboard:
   - Host: `ftp.cdmx.be` of IP adres
   - Username: je FTP gebruikersnaam
   - Password: je FTP wachtwoord
   - Port: 21 (of 22 voor SFTP)

3. **Upload bestanden:**
   ```
   /public_html/
   ├── index.html (hernoem cdmx-tesla.html)
   ├── Brand/
   │   └── FullPackage/
   │       ├── LogoPackage/
   │       └── Fonts/
   └── 14240744_3840_2160_24fps.mp4
   ```

#### 3. SSL Certificaat (HTTPS)
1. Ga in Combell naar **SSL Certificaten**
2. Bestel **Let's Encrypt SSL** (gratis) of **Combell SSL** (betaald)
3. Activeer SSL voor cdmx.be
4. Forceer HTTPS redirect in `.htaccess`:

```apache
# Maak bestand: /public_html/.htaccess
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

### **Optie 3: Netlify (Modern & Developer Friendly)**

**Voordelen:**
- ✅ Gratis tot 100GB bandwidth
- ✅ Automatische HTTPS
- ✅ Continuous deployment via Git
- ✅ Zeer snel (Global CDN)
- ✅ Form handling (bonus feature)

**Stappen:**

#### 1. Netlify Setup
1. Ga naar [netlify.com](https://netlify.com) → Sign up met GitHub
2. Klik op **Add new site** → **Import from Git**
3. Selecteer je GitHub repository
4. Build settings:
   - Build command: (leeg laten)
   - Publish directory: `/`
5. Klik op **Deploy site**

#### 2. Custom Domain
1. Ga naar **Site settings** → **Domain management**
2. Klik op **Add custom domain**
3. Voer in: `cdmx.be`
4. Netlify geeft je DNS instructies

#### 3. DNS bij Combell
1. Log in bij Combell → DNS Management
2. Voeg toe:
```
Type    Name    Content                         TTL
A       @       75.2.60.5                       3600
CNAME   www     [jouw-site].netlify.app.        3600
```

#### 4. SSL activeren
1. Ga naar **Site settings** → **Domain management** → **HTTPS**
2. Klik op **Verify DNS configuration**
3. SSL wordt automatisch aangevraagd (Let's Encrypt)
4. Vink aan: **Force HTTPS**

---

## 🔒 Security Checklist

### 1. HTTPS/SSL (Verplicht)
- [ ] SSL certificaat geïnstalleerd
- [ ] HTTP → HTTPS redirect actief
- [ ] HSTS header enabled (via Cloudflare of .htaccess)

### 2. Security Headers
Voeg toe aan je hosting (via `.htaccess` of Cloudflare):

```apache
# Security Headers (.htaccess voor Apache)
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"

    # Content Security Policy
    Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; media-src 'self';"
</IfModule>
```

**Via Cloudflare (eenvoudiger):**
1. Dashboard → **Security** → **Settings**
2. Vink aan: **Browser Integrity Check**
3. Vink aan: **Enable DNSSEC**
4. **Transform Rules** → Add header transformations (zie boven)

### 3. DDoS Protection
- **Cloudflare:** Automatisch inbegrepen (aangeraden)
- **Combell:** Beschikbaar via premium pakket

### 4. File Permissions (voor FTP upload)
```bash
# Correcte permissies
Folders: 755
Files: 644
```

### 5. Backup Strategy
- **GitHub:** Automatisch via git commits
- **Netlify/GitHub Pages:** Automatisch via platform
- **Combell:** Manueel via FTP of Combell Backup tool (betaald)

---

## 📊 Performance Optimalisatie

### 1. Video Compressie
Je video is groot (14240744_3840_2160_24fps.mp4). Optimaliseer:

```bash
# Installeer ffmpeg (via Homebrew op Mac)
brew install ffmpeg

# Comprimeer video (behoud kwaliteit, kleinere size)
ffmpeg -i 14240744_3840_2160_24fps.mp4 -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 128k hero-video-compressed.mp4

# Voor web: maak ook WebM versie (betere compressie)
ffmpeg -i 14240744_3840_2160_24fps.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 hero-video.webm
```

Update HTML:
```html
<video class="hero-video" autoplay muted loop playsinline>
    <source src="hero-video.webm" type="video/webm">
    <source src="hero-video-compressed.mp4" type="video/mp4">
</video>
```

### 2. Image Optimalisatie
Converteer PNG logo's naar WebP:

```bash
# Installeer cwebp
brew install webp

# Converteer logo's
cwebp Brand/FullPackage/LogoPackage/x.png -q 90 -o Brand/FullPackage/LogoPackage/x.webp
cwebp Brand/FullPackage/LogoPackage/CDMX-Logo.png -q 90 -o Brand/FullPackage/LogoPackage/CDMX-Logo.webp
```

### 3. Lazy Loading
Voeg toe aan video tag:
```html
<video class="hero-video" autoplay muted loop playsinline loading="lazy">
```

### 4. Cloudflare Auto Minify
Activeer in Cloudflare dashboard → **Speed** → **Optimization**

---

## 🎯 Aanbevolen Deployment Flow

### Voor maximale security + snelheid + gratis:

**GitHub Pages + Cloudflare**

1. Push code naar GitHub
2. Activeer GitHub Pages
3. Setup Cloudflare voor DNS + security
4. Configureer security headers in Cloudflare
5. Klaar! 🚀

**Geschatte tijd:** 2-3 uur (inclusief DNS propagation wachttijd)

---

## 📞 Support Resources

- **Combell Support:** [support.combell.com](https://support.combell.com) | +32 9 218 79 79
- **Cloudflare Community:** [community.cloudflare.com](https://community.cloudflare.com)
- **GitHub Pages Docs:** [docs.github.com/pages](https://docs.github.com/pages)
- **Netlify Docs:** [docs.netlify.com](https://docs.netlify.com)

---

## 🔧 Troubleshooting

**Website niet bereikbaar na DNS change:**
- Wacht 24-48 uur voor volledige DNS propagation
- Check DNS met: `nslookup cdmx.be` of [dnschecker.org](https://dnschecker.org)

**SSL certificaat errors:**
- Wacht 15-30 minuten na DNS configuratie
- Forceer SSL renewal in Cloudflare/GitHub Pages settings

**Video laadt niet:**
- Check file path is correct (`/` vs relatief pad)
- Verificeer video is geüpload naar correct folder
- Test met kleinere test video eerst

**Fonts tonen niet:**
- Check CORS headers (moet toegestaan zijn)
- Gebruik Cloudflare of voeg toe aan `.htaccess`:
```apache
<FilesMatch "\.(ttf|otf|woff|woff2)$">
    Header set Access-Control-Allow-Origin "*"
</FilesMatch>
```

---

**Succes met je deployment! 🚀**
