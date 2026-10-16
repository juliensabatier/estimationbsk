# Estimateur en ligne BSK Immobilier (Pays Mélusin)

Page web statique de génération de leads vendeurs pour Julien Sabatier (conseiller BSK Immobilier, secteur Rouillé, Lusignan, Saint-Sauvant, Vienne 86). Le visiteur remplit un questionnaire en 3 étapes, reçoit une fourchette de prix indicative. La demande part vers un webhook Make qui envoie un mail à Julien et crée ou met à jour la fiche contact dans Brevo.

## Structure

- `index.html` : structure de la page (hero, formulaire en 3 étapes, résultat, footer)
- `style.css` : tout le style, palette bleue BSK dans les variables `:root`
- `script.js` : logique du formulaire, calcul local de l'estimation, envoi vers le webhook Make (Web3Forms en secours)
- `README.md` : mise en ligne et test

Aucune dépendance, aucun build. Un simple serveur statique suffit (`python3 -m http.server 8000`).

## Règles à respecter absolument

1. **Aucun `mailto:` dans le code.** Le visiteur ne doit jamais voir s'ouvrir une messagerie. L'envoi passe uniquement par `fetch` vers le webhook Make (Web3Forms en secours), en arrière-plan. Après toute modification, vérifier avec `grep -rn "mailto" .` (résultat attendu : vide).
2. **Aucun appel à `api.anthropic.com` ni à une API d'IA côté navigateur.** Cet appel ne fonctionne que dans l'aperçu Claude et bloquait la page en production. L'estimation est un calcul local (`calculerEstimation` dans `script.js`).
3. **Le résultat ne doit jamais dépendre de l'envoi du mail.** `envoyerDemande` part en arrière-plan, l'affichage du résultat suit un simple `setTimeout`.
4. **La case de consentement est obligatoire** : le bouton d'envoi reste désactivé tant qu'elle n'est pas cochée. Elle remplace le démarchage téléphonique non sollicité, interdit depuis l'été 2026. Ne pas la supprimer ni la pré-cocher.
5. **Pas d'injection HTML** : les données saisies par le visiteur s'affichent avec `textContent`, jamais avec `innerHTML`.

## Configuration

- Webhook Make : constante `MAKE_WEBHOOK_URL` en haut de `script.js`. Scénario Make « BSK Estimateur en ligne => Mail + Brevo » (équipe My Team) : filtre anti-robot (champ `botcheck` vide), mail Outlook à j.sabatier@bskimmobilier.com, puis création ou mise à jour du contact Brevo dans la liste BSK (id 2).
- Envoi vers Make : formulaire encodé en `mode: "no-cors"` pour éviter le pré-vol CORS. La réponse est opaque : seule une panne réseau déclenche le secours Web3Forms. Une erreur côté Make (scénario désactivé, file pleine) ne déclenche pas le secours, elle se voit dans l'historique Make.
- Attributs Brevo alimentés : FIRSTNAME, LASTNAME, SMS (mobile) ou LANDLINE_NUMBER (fixe), SOURCE (BSK, ou META si `utm_source` Facebook/Instagram ou `fbclid` dans l'URL), VILLE_BIEN, TYPE_BIEN, SURFACE, TERRAIN, ANNEE_CONSTRUCTION, ETAT_BIEN, NB_PIECES, NB_CHAMBRES, NB_SDB, CHAUFFAGE, DPE, GARAGE, EXPOSITION, ENVIRONNEMENT, POINTS_FORTS, PROJET_VENTE, ESTIMATION_MIN, ESTIMATION_MAX, DATE_DEMANDE_ESTIMATION. Brevo exige un email ou un mobile : sans les deux, seule la notification mail part (elle le signale).
- Clé Web3Forms (secours) : constante `WEB3FORMS_ACCESS_KEY` en haut de `script.js`. Cette clé est publique par conception, elle est liée à l'adresse mail de travail utilisée à la création du compte Web3Forms (j.sabatier@bskimmobilier.com).
- Barème de prix : constantes `PRIX_M2_PAR_ETAT`, `COMMUNES_VALORISEES`, `COEF_COMMUNE_VALORISEE`, `MARGE_FOURCHETTE` dans `script.js`.
- Liste des communes : `<select id="commune">` dans `index.html`.

## Conventions

- Français pour tout le contenu visible et les commentaires.
- Pas de tiret cadratin (em-dash) dans les textes visibles. Utiliser `·`, `:` ou une virgule.
- Téléphone de Julien : 06 30 38 92 67 (lien `tel:+33630389267`).
- Mentions légales en bas de page : estimation indicative, RSAC 91786954700021 Poitiers.

## Points ouverts

- Le barème de prix est une formule simple (surface x prix au m² selon l'état). Il n'est pas calibré sur des données de ventes réelles. Julien doit le valider ou l'ajuster avant diffusion large.
- Mention RGPD et politique de confidentialité : à ajouter avant la campagne Meta si Julien le souhaite (lien dans la note de consentement).
- Envoi SMS : non implémenté. Nécessiterait un service payant et un petit serveur intermédiaire.
- Pixel Meta et suivi de conversion : non installés.
