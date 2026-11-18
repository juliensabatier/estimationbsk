/* =========================================================
   Pixel Meta avec consentement (exigence CNIL)
   - Le pixel n'est chargé qu'après un clic sur « Accepter ».
   - « Refuser » est aussi simple qu'« Accepter ».
   - Le choix est mémorisé 13 mois dans le navigateur.
   - window.bskTrackLead() envoie l'événement Lead (estimation envoyée),
     uniquement si le visiteur a accepté.
   ========================================================= */
(function () {
  const PIXEL_ID = "1665492745251916";
  const CLE = "bsk_consentement_cookies";
  const DUREE_MS = 13 * 30 * 24 * 3600 * 1000; // environ 13 mois

  function lireChoix() {
    try {
      const brut = localStorage.getItem(CLE);
      if (!brut) return null;
      const choix = JSON.parse(brut);
      if (!choix || Date.now() - choix.date > DUREE_MS) return null;
      return choix.valeur;
    } catch (e) {
      return null;
    }
  }

  function enregistrerChoix(valeur) {
    try {
      localStorage.setItem(CLE, JSON.stringify({ valeur: valeur, date: Date.now() }));
    } catch (e) { /* stockage indisponible : le bandeau reviendra à la prochaine visite */ }
  }

  let pixelCharge = false;
  function chargerPixel() {
    if (pixelCharge) return;
    pixelCharge = true;
    /* Code de base fourni par Meta */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", PIXEL_ID);
    window.fbq("track", "PageView");
  }

  window.bskTrackLead = function () {
    if (pixelCharge && typeof window.fbq === "function") window.fbq("track", "Lead");
  };

  function fermerBandeau() {
    const b = document.getElementById("cookie-banner");
    if (b) b.remove();
  }

  function afficherBandeau() {
    if (document.getElementById("cookie-banner")) return;
    const bandeau = document.createElement("div");
    bandeau.id = "cookie-banner";
    bandeau.className = "cookie-banner";
    bandeau.setAttribute("role", "dialog");
    bandeau.setAttribute("aria-label", "Gestion des cookies");

    const texte = document.createElement("p");
    texte.className = "cookie-text";
    texte.textContent = "J'utilise un cookie de mesure Meta (Facebook, Instagram) pour savoir si mes publicités vous ont amené ici. Il n'est déposé qu'avec votre accord, et la page fonctionne de la même façon si vous refusez. ";
    const lien = document.createElement("a");
    lien.href = "politique-confidentialite.html";
    lien.target = "_blank";
    lien.rel = "noopener";
    lien.textContent = "En savoir plus";
    texte.appendChild(lien);

    const boutons = document.createElement("div");
    boutons.className = "cookie-btns";
    const refuser = document.createElement("button");
    refuser.type = "button";
    refuser.className = "cookie-btn";
    refuser.textContent = "Refuser";
    refuser.addEventListener("click", () => { enregistrerChoix("refuse"); fermerBandeau(); });
    const accepter = document.createElement("button");
    accepter.type = "button";
    accepter.className = "cookie-btn";
    accepter.textContent = "Accepter";
    accepter.addEventListener("click", () => { enregistrerChoix("accepte"); fermerBandeau(); chargerPixel(); });
    boutons.append(refuser, accepter);

    bandeau.append(texte, boutons);
    document.body.appendChild(bandeau);
  }

  // Lien « Cookies » du pied de page : permet de changer d'avis à tout moment
  window.bskGererCookies = function () {
    try { localStorage.removeItem(CLE); } catch (e) { /* rien */ }
    afficherBandeau();
  };

  function demarrer() {
    const choix = lireChoix();
    if (choix === "accepte") chargerPixel();
    else if (choix === null) afficherBandeau();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrer);
  else demarrer();
})();
