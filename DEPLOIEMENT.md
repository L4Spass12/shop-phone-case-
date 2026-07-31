# 🚢 Déploiement sur Hostinger

Ce document explique **comment le site part en ligne**, pour ne pas avoir à le
redécouvrir à chaque fois.

## 🗺️ Vue d'ensemble

Le site est déployé via l'**intégration Git de Hostinger** (hPanel), pas par FTP.
Le principe : une branche dédiée, **`hostinger-deploy`**, contient le site **déjà
compilé** (le contenu de `dist/` à sa racine), et Hostinger la récupère
directement dans `public_html`.

```
  push sur main
       │
       ▼
  GitHub Actions : .github/workflows/hostinger-branch.yml
   1. npm ci
   2. npm run build        →  dist/  (site statique + .htaccess)
   3. vérifie dist/index.html et dist/.htaccess (garde-fou)
   4. force-push dist/  →  branche hostinger-deploy
       │
       ▼
  Hostinger (hPanel → Git) suit la branche hostinger-deploy
       │
       ▼
  public_html  →  site en ligne
```

## ⚙️ Réglages côté Hostinger (hPanel)

Chemin : **hPanel → Sites web → `aquamarine-termite-481737.hostingersite.com`
→ Avancé → GIT**

| Réglage | Valeur |
|--------|--------|
| Dépôt connecté | `L4Spass12/shop-phone-case-` (compte GitHub `L4Spass12`) |
| Branche déployée | **`hostinger-deploy`** |
| Répertoire racine | **`public_html`** |
| Site web | `aquamarine-termite-481737.hostingersite.com` |

> ⚠️ La branche à sélectionner dans hPanel est **`hostinger-deploy`**, jamais
> `main`. `main` contient le code source (non compilé) : sélectionner `main`
> afficherait les fichiers `.astro` bruts au lieu du site.

## ✅ Mettre le site à jour (procédure normale)

1. Faire ses modifs et les commit sur **`main`**, puis :
   ```bash
   git push origin main
   ```
2. GitHub Actions build automatiquement et met à jour la branche
   `hostinger-deploy` (onglet **Actions** du repo pour suivre le run,
   ~1 à 2 min).
3. Récupérer le build sur Hostinger :
   - soit Hostinger déploie automatiquement quand `hostinger-deploy` change,
   - soit cliquer **« Redéployer »** dans hPanel → Git → Aperçu.
4. Vérifier `aquamarine-termite-481737.hostingersite.com`.

> Un push qui ne touche QUE `.github/**` ou `README.md` ne déclenche pas de
> rebuild (paths-ignore) : logique, ça ne change pas le site rendu.

## 🧩 Les workflows GitHub

| Fichier | Rôle |
|---------|------|
| `.github/workflows/hostinger-branch.yml` | **Le vrai déploiement.** Build + force-push de `dist/` sur `hostinger-deploy`. Se déclenche sur push `main` (ou manuellement). |
| `.github/workflows/deploy.yml` | **Repli FTP manuel** (secours si l'intégration Git tombe). Uniquement `workflow_dispatch`. Nécessite les secrets `FTP_SERVER` / `FTP_USERNAME` / `FTP_PASSWORD`. |
| `.github/workflows/generate-article.yml` | Génère + traduit un article, commit sur `main` (ce qui déclenche le déploiement). |
| `.github/workflows/translate-backlog.yml` | Rattrape les traductions EN/DE manquantes. |

## 🚫 À ne jamais faire

- **Ne pas committer à la main sur `hostinger-deploy`.** C'est un artefact de
  build, réécrit en **force-push** à chaque déploiement : tout commit manuel
  serait écrasé et perdu.
- **Ne pas lancer FTP et Git en même temps.** Le FTP (`deploy.yml`) et le Git
  écriraient tous les deux dans `public_html` : on obtiendrait un site à moitié
  à jour (HTML pointant vers des assets déjà remplacés). Le déclencheur `push`
  du workflow FTP a d'ailleurs été retiré volontairement pour cette raison.

## 🛠️ Dépannage rapide

- **Le site ne se met pas à jour** : vérifier que le run `hostinger-branch.yml`
  est bien passé (onglet Actions), puis cliquer « Redéployer » dans hPanel.
- **Le build échoue sur `dist/index.html manquant` ou `dist/.htaccess
  manquant`** : le garde-fou du workflow a stoppé un build incomplet. Reproduire
  en local avec `npm run build` et corriger avant de repousser.
- **Intégration Git HS** : basculer temporairement sur le repli FTP
  (Actions → « Build & Deploy to Hostinger » → Run workflow).
- **Reconstruire à l'identique en local** :
  ```bash
  npm ci
  npm run build      # génère dist/ (ce qui est poussé sur hostinger-deploy)
  npm run preview    # prévisualise le build
  ```
