# Estimateur BSK Immobilier, Pays Mélusin

Page d'estimation gratuite pour capter des propriétaires vendeurs. Questionnaire en 3 étapes, fourchette de prix indicative. Chaque demande déclenche un scénario Make : mail à Julien Sabatier et fiche contact dans Brevo (liste BSK).

## Lancer en local

```bash
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000

## Tester l'envoi

1. Ouvrir la page via le serveur local ci-dessus (ouvrir le fichier directement en `file://` peut bloquer l'envoi dans certains navigateurs).
2. Remplir le questionnaire jusqu'au bout avec vos propres coordonnées, cocher la case de consentement, cliquer sur "Obtenir mon estimation".
3. Contrôles attendus :
   - aucune fenêtre de messagerie (Outlook, Mail, Gmail) ne s'ouvre ;
   - le résultat s'affiche en moins de 3 secondes ;
   - le mail « Nouvelle demande d'estimation » arrive sur j.sabatier@bskimmobilier.com ;
   - si un email a été saisi, le prospect reçoit « votre estimation et votre guide offert » avec le bouton de téléchargement de l'e-book ;
   - le contact apparaît dans Brevo, liste BSK, avec les champs du bien remplis (il faut un email ou un numéro de mobile).
4. Si rien n'arrive, ouvrir l'historique du scénario « BSK Estimateur en ligne => Mail + Brevo » dans Make. Si la console du navigateur (F12) affiche « Webhook Make injoignable », le récapitulatif est parti en secours par Web3Forms.

## Mise en ligne

Le projet est un site statique : il suffit de déposer `index.html`, `style.css` et `script.js` dans le même dossier de l'hébergement. Si la page est intégrée à un CMS, copier le contenu des trois fichiers en respectant leur rôle.

Après chaque mise en ligne, rechercher "mailto" dans les fichiers déployés : il ne doit apparaître nulle part. Un fichier déployé qui contient encore `mailto:` est une ancienne version.

## Liens à diffuser selon le canal

Le paramètre `utm_source` indique d'où vient le lead (visible dans Brevo, champ SOURCE, et dans le mail de notification). `utm_campaign` est libre, pour distinguer deux pubs ou deux mois.

| Canal | Lien |
|---|---|
| Publicité Facebook / Instagram | `https://juliensabatier.github.io/estimationbsk/?utm_source=facebook&utm_campaign=estim-novembre` |
| Groupes Facebook locaux | `https://juliensabatier.github.io/estimationbsk/?utm_source=groupe_fb` |
| Google (fiche ou Ads) | `https://juliensabatier.github.io/estimationbsk/?utm_source=google` |
| Campagne email Brevo | `https://juliensabatier.github.io/estimationbsk/?utm_source=brevo` |
| WhatsApp, SMS, réseau | `https://juliensabatier.github.io/estimationbsk/?utm_source=whatsapp` |
| Signature mail, page BSK, annonces | `https://juliensabatier.github.io/estimationbsk/?utm_source=signature` (classé BSK) |

## Modifier

- Prix au m² : `script.js`, section CONFIGURATION.
- Communes proposées : `index.html`, liste déroulante "Commune".
- Couleurs : `style.css`, variables `:root`.
- Adresse de réception des mails : module « Mail de notification à Julien » du scénario Make (et compte Web3Forms pour le secours).
- Champs envoyés à Brevo : module « Créer / mettre à jour le contact Brevo » du scénario Make.

## Pour Claude Code

Voir `CLAUDE.md` pour les règles du projet et les points ouverts.
