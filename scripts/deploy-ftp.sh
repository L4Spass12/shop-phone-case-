#!/usr/bin/env bash
#
# Déploiement FTP robuste vers Hostinger.
# Mutualisé entre .github/workflows/deploy.yml et generate-article.yml
# pour garder une seule logique de déploiement (DRY).
#
# Pourquoi parallel=1 :
#   Le FTP mutualisé Hostinger limite/coupe les connexions simultanées.
#   Avec --parallel=4 (+ use-pget-n), lftp ouvrait jusqu'à ~16 connexions :
#   au-delà d'un certain volume (le site a dépassé 1400 fichiers), Hostinger
#   coupait des connexions -> reconnexions -> "max-retries exceeded".
#   Une seule connexion reste sous la limite et déploie de façon fiable.
#
# Stratégie de synchronisation en DEUX passes :
#
#   Passe 1 (--ignore-time) — synchronise TOUT par comparaison de TAILLE.
#     actions/checkout réinitialise les mtime des fichiers versionnés ; sans
#     --ignore-time lftp croirait que tout est plus récent et re-téléverserait
#     les ~72 Mo à chaque run. La comparaison par taille évite ça : seuls les
#     fichiers réellement nouveaux/modifiés partent. C'est SÛR pour les assets
#     hashés (_astro/, images) car leur NOM change dès que leur contenu change.
#     --delete purge les anciens hashs devenus inutiles.
#
#   Passe 2 (comparaison par DATE) — force le rafraîchissement des fichiers
#     TEXTE mutables (HTML, sitemap, rss, robots, manifest, json). Ces fichiers
#     changent de CONTENU sans forcément changer de TAILLE : ex. un hash CSS
#     dans <link href="/_astro/_slug_.XXXXXXXX.css"> a toujours la même longueur.
#     La passe 1 (taille seule) les croirait alors identiques et les laisserait
#     PÉRIMÉS -> ils continueraient de pointer vers des assets déjà supprimés
#     par --delete -> 404 sur le CSS -> page servie sans aucun style.
#     Ici on N'UTILISE PAS --ignore-time : lftp compare la date, et comme le
#     build régénère ces fichiers avec un mtime récent, ils sont toujours
#     re-téléversés. Volume négligeable (texte uniquement).
#
# Variables d'environnement requises : FTP_HOST, FTP_USER, FTP_PASS
# Pré-requis : le dossier dist/ doit exister (build effectué en amont).

set -euo pipefail

: "${FTP_HOST:?FTP_HOST manquant}"
: "${FTP_USER:?FTP_USER manquant}"
: "${FTP_PASS:?FTP_PASS manquant}"

if [ ! -d dist ]; then
  echo "❌ dist/ introuvable : lancer 'npm run build' avant le déploiement."
  exit 1
fi

# Script lftp écrit dans un fichier temporaire (umask 077) pour que le mot de
# passe n'apparaisse jamais dans la liste des arguments de processus (ps).
umask 077
LFTP_FILE="$(mktemp)"
trap 'rm -f "$LFTP_FILE"' EXIT

cat > "$LFTP_FILE" <<SCRIPT
set net:timeout 60
set net:max-retries 4
set net:reconnect-interval-base 5
set net:reconnect-interval-multiplier 1
set net:reconnect-interval-max 30
set net:persist-retries 4
set ssl:verify-certificate no
set ftp:ssl-allow yes
set mirror:parallel-transfer-count 1
open ftp://${FTP_HOST}
user ${FTP_USER} ${FTP_PASS}
mirror --reverse --delete --verbose --ignore-time --parallel=1 dist/ /public_html/
mirror --reverse --verbose --parallel=1 --include-glob=*.html --include-glob=*.xml --include-glob=*.txt --include-glob=*.json --include-glob=*.webmanifest dist/ /public_html/
quit
SCRIPT

for attempt in 1 2 3; do
  if lftp -f "$LFTP_FILE"; then
    echo "✅ Déploiement FTP réussi (tentative ${attempt})."
    exit 0
  fi
  echo "⚠ Tentative ${attempt} échouée."
  if [ "$attempt" -lt 3 ]; then
    echo "   Nouvelle tentative dans 30s..."
    sleep 30
  fi
done

echo "❌ Déploiement FTP échoué après 3 tentatives."
exit 1
