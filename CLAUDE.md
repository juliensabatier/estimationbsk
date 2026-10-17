# Estimateur en ligne BSK Immobilier (Pays Mélusin)

Page web statique de génération de leads vendeurs pour Julien Sabatier (conseiller BSK Immobilier, secteur Rouillé, Lusignan, Saint-Sauvant, Vienne 86). Le visiteur remplit un questionnaire en 3 étapes, reçoit une fourchette de prix indicative. La demande part vers un webhook Make qui envoie un mail à Julien et crée ou met à jour la fiche contact dans Brevo.

## Structure

- `index.html` : structure de la page (hero, formulaire en 3 étapes, résultat, footer)
- `style.css` : tout le style, palette bleue BSK dans les variables `:root`
- `script.js` : logique du formulaire, calcul local de l'estimation, envoi vers le webhook Make (Web3Forms en secours)
- `README.md` : mise en ligne et test
- `politique-confidentialite.html` : politique de confidentialité RGPD, liée depuis la note de consentement et le pied de page
- `ebook/ebook.html` : source de l'e-book « 10 conseils pour vendre votre maison » (8 pages A4)
- `ebook/10-conseils-vendre-sa-maison-BSK.pdf` : PDF généré depuis `ebook.html`, envoyé par lien aux prospects

Aucune dépendance, aucun build. Un simple serveur statique suffit (`python3 -m http.server 8000`).

## Règles à respecter absolument

1. **Aucun `mailto:` dans le code.** Le visiteur ne doit jamais voir s'ouvrir une messagerie. L'envoi passe uniquement par `fetch` vers le webhook Make (Web3Forms en secours), en arrière-plan. Après toute modification, vérifier avec `grep -rn "mailto" .` (résultat attendu : vide).
2. **Aucun appel à `api.anthropic.com` ni à une API d'IA côté navigateur.** Cet appel ne fonctionne que dans l'aperçu Claude et bloquait la page en production. L'estimation est un calcul local (`calculerEstimation` dans `script.js`).
3. **Le résultat ne doit jamais dépendre de l'envoi du mail.** `envoyerDemande` part en arrière-plan, l'affichage du résultat suit un simple `setTimeout`.
4. **La case de consentement est obligatoire** : le bouton d'envoi reste désactivé tant qu'elle n'est pas cochée. Elle remplace le démarchage téléphonique non sollicité, interdit depuis l'été 2026. Ne pas la supprimer ni la pré-cocher.
5. **Pas d'injection HTML** : les données saisies par le visiteur s'affichent avec `textContent`, jamais avec `innerHTML`.

## Configuration

- Webhook Make : constante `MAKE_WEBHOOK_URL` en haut de `script.js`. Scénario Make « BSK Estimateur en ligne => Mail + Brevo » (équipe My Team) : filtre anti-robot (champ `botcheck` vide), mail Outlook à j.sabatier@bskimmobilier.com, puis un aiguillage en deux branches : mail au prospect avec le lien de l'e-book (si email renseigné, envoyé depuis j.sabatier@bskimmobilier.com) et création ou mise à jour du contact Brevo dans les listes BSK (id 2) et Estimation (id 8).
- Lien de l'e-book dans le mail prospect : https://juliensabatier.github.io/estimationbsk/ebook/10-conseils-vendre-sa-maison-BSK.pdf. Renommer ou déplacer le PDF casse ce lien : mettre à jour le module « Mail au prospect + e-book » dans Make en même temps.
- Régénérer le PDF après modification de `ebook.html` : impression Chromium en A4 avec arrière-plans (Playwright `page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true })`). Polices utilisées : Inter et Caladea, avec repli sur DejaVu.
- Envoi vers Make : formulaire encodé en `mode: "no-cors"` pour éviter le pré-vol CORS. La réponse est opaque : seule une panne réseau déclenche le secours Web3Forms. Une erreur côté Make (scénario désactivé, file pleine) ne déclenche pas le secours, elle se voit dans l'historique Make.
- Attributs Brevo alimentés : FIRSTNAME, LASTNAME, SMS (mobile) ou LANDLINE_NUMBER (fixe), SOURCE (voir « Suivi des canaux » ci-dessous), VILLE_BIEN, TYPE_BIEN, SURFACE, TERRAIN, ANNEE_CONSTRUCTION, ETAT_BIEN, NB_PIECES, NB_CHAMBRES, NB_SDB, CHAUFFAGE, DPE, GARAGE, EXPOSITION, ENVIRONNEMENT, POINTS_FORTS, PROJET_VENTE, ESTIMATION_MIN, ESTIMATION_MAX, DATE_DEMANDE_ESTIMATION. Brevo exige un email ou un mobile : sans les deux, seule la notification mail part (elle le signale).
- Suivi des canaux : `detecterSource()` dans `script.js` lit d'abord `utm_source` (groupe → GROUPES_FB, facebook/instagram/meta → META, google → GOOGLE, email/brevo/newsletter → EMAIL, reseau/whatsapp/sms → RESEAU, autre valeur → BSK), puis à défaut `fbclid` (META) et `gclid` (GOOGLE). Le module « Nettoyage téléphone / email » de Make convertit ce texte en valeur de la catégorie Brevo SOURCE : 1 BSK, 2 META, 3 RESEAU, 4 MARIAGE.NET (autre scénario), 5 GOOGLE, 6 GROUPES FB, 7 EMAIL. Ajouter un canal = l'ajouter aux trois endroits (script.js, Make, catégorie Brevo). `utm_source` et `utm_campaign` bruts apparaissent dans le mail de notification.
- Clé Web3Forms (secours) : constante `WEB3FORMS_ACCESS_KEY` en haut de `script.js`. Cette clé est publique par conception, elle est liée à l'adresse mail de travail utilisée à la création du compte Web3Forms (j.sabatier@bskimmobilier.com).
- Type « Terrain » : `adapterFormulaire()` masque surface habitable, année, état, pièces, chambres, SdB, chauffage, DPE, garage, et affiche « Surface du terrain » (obligatoire) et « Situation du terrain » (constructible et viabilisé, à viabiliser, non constructible, je ne sais pas). La situation est envoyée dans le champ `etat` (attribut Brevo ETAT_BIEN), `surface` part vide, les champs habitables partent en « Non applicable (terrain) ». Calcul : `calculerEstimationTerrain` avec `PRIX_M2_TERRAIN` et `MARGE_FOURCHETTE_TERRAIN`.
- Barème de prix (calé le 17/10/2026 sur DVF 2021-2025, 1 609 maisons et 101 terrains à bâtir sur 15 communes) : prix maison = surface x `PRIX_M2_PAR_ETAT` x `coefCommune` (table `COEF_COMMUNE`, écart de la médiane communale au secteur) x `coefSurface` (prix ~ surface^0,75, référence 92 m²) x `coefTerrain` (référence 1 050 m², forte décote sous 300 m², champ vide compté 200 m²). Test sur 865 ventes 2023-2025 : écart médian 1 %, toutes communes à ±7 %. Les libellés « Couhé » et « Benassay » correspondent dans DVF à Valence-en-Poitou et Boivre-la-Vallée. Terrain : 42 €/m² jusqu'à 800 m² puis 8 €/m², x coefficient de situation x coefficient commune ; non constructible 0,50 €/m².
- Liste des communes : `<select id="commune">` dans `index.html`.

## Conventions

- Français pour tout le contenu visible et les commentaires.
- Pas de tiret cadratin (em-dash) dans les textes visibles. Utiliser `·`, `:` ou une virgule.
- Téléphone de Julien : 06 30 38 92 67 (lien `tel:+33630389267`).
- Mentions légales en bas de page : estimation indicative, RSAC 91786954700021 Poitiers.

## Points ouverts

- Barème calé sur DVF, mais DVF ne connaît ni l'état, ni le DPE, ni l'assainissement : la correspondance état / prix au m² et la décote « à viabiliser » sont des hypothèses. À affiner avec l'export des ventes de Julien. Pistes : DPE, plain-pied, assainissement, type de bien (longère, appartement).
- Politique de confidentialité : en ligne. À mettre à jour si un pixel Meta, une mesure d'audience ou un nouveau prestataire est ajouté. Adresse postale du responsable non indiquée (à ajouter si Julien le souhaite).
- Envoi SMS : non implémenté. Nécessiterait un service payant et un petit serveur intermédiaire.
- Pixel Meta et suivi de conversion : non installés.
- Logo BSK : l'e-book et le mail prospect utilisent un logo texte (« BSK » dans un carré bleu). À remplacer par le logo officiel si Julien fournit le fichier.
