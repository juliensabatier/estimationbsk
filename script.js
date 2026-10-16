/* ==========================================================
   CONFIGURATION
   ========================================================== */

// Webhook Make (scénario "BSK Estimateur en ligne => Mail + Brevo").
// Le scénario envoie le mail de notification à Julien et crée la fiche Brevo.
const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/ya9za12hm6phh3ydfuiwiwqtrrwv16zf";

// Secours : utilisé seulement si Make est injoignable (panne réseau).
// Clé publique Web3Forms liée à l'adresse mail de travail du compte.
const WEB3FORMS_ACCESS_KEY = "2217a974-c3d8-40d4-a3f1-d0ad6afb05f3";
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

// Barème du calcul local (euros par m2). Ajustable selon les ventes récentes.
const PRIX_M2_PAR_ETAT = {
  "À rénover entièrement": 600,
  "Travaux à prévoir": 850,
  "Bon état général": 1150,
  "Très bon état / récent": 1400
};
const PRIX_M2_DEFAUT = 1100;
const COMMUNES_VALORISEES = ["Lusignan", "Rouillé"];
const COEF_COMMUNE_VALORISEE = 1.05;
const MARGE_FOURCHETTE = 0.08; // fourchette = estimation -8% / +8%

/* ==========================================================
   ETAT
   ========================================================== */

let selectedType = "Maison";
let selectedEtat = "";

/* ==========================================================
   INTERACTIONS
   ========================================================== */

function $(id) { return document.getElementById(id); }

function showError(msg) {
  const e = $("error-msg");
  e.textContent = msg;
  e.classList.add("visible");
  setTimeout(() => e.classList.remove("visible"), 4000);
}

function setStep(n) {
  document.querySelectorAll(".form-step").forEach(s => s.classList.remove("active"));
  $("step-" + n).classList.add("active");

  for (let i = 1; i <= 3; i++) {
    const dot = $("dot-" + i);
    dot.className = "step-dot";
    if (i < n) dot.classList.add("done");
    else if (i === n) dot.classList.add("active");
    if (i < 3) $("line-" + i).className = "step-line" + (i < n ? " done" : "");
  }
  window.scrollTo({ top: $("form-section").offsetTop - 20, behavior: "smooth" });
}

function nextStep(from) {
  if (from === 1) {
    if (!$("commune").value) return showError("Veuillez sélectionner une commune.");
    if (!$("surface").value) return showError("Veuillez indiquer la surface habitable.");
  }
  if (from === 2) {
    if (!selectedEtat) return showError("Veuillez sélectionner l'état général du bien.");
    if (!$("pieces").value) return showError("Veuillez indiquer le nombre de pièces.");
  }
  setStep(from + 1);
}

function bindEvents() {
  $("start-cta").addEventListener("click", () => {
    $("form-section").scrollIntoView({ behavior: "smooth" });
  });

  document.querySelectorAll(".type-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".type-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedType = card.dataset.type;
    });
  });

  document.querySelectorAll(".etat-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".etat-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedEtat = card.dataset.etat;
    });
  });

  document.querySelectorAll("[data-next]").forEach(btn => {
    btn.addEventListener("click", () => nextStep(parseInt(btn.dataset.next, 10)));
  });
  document.querySelectorAll("[data-prev]").forEach(btn => {
    btn.addEventListener("click", () => setStep(parseInt(btn.dataset.prev, 10) - 1));
  });

  $("consent").addEventListener("change", () => {
    $("submit-btn").disabled = !$("consent").checked;
  });
  $("consent-box").addEventListener("click", (ev) => {
    if (ev.target.id === "consent" || ev.target.tagName === "LABEL") return;
    $("consent").click();
  });

  $("submit-btn").addEventListener("click", submitEstimation);
}

/* ==========================================================
   DONNEES ET ESTIMATION
   ========================================================== */

function collectData() {
  return {
    type: selectedType,
    commune: $("commune").value,
    surface: $("surface").value,
    terrain: $("terrain").value || "Non précisé",
    annee: $("annee").value || "Non précisée",
    etat: selectedEtat,
    pieces: $("pieces").value,
    chambres: $("chambres").value || "Non précisé",
    sdb: $("sdb").value || "Non précisé",
    chauffage: $("chauffage").value || "Non précisé",
    dpe: $("dpe").value || "Non renseigné",
    garage: $("garage").value,
    exposition: $("exposition").value || "Non précisée",
    environnement: $("environnement").value || "Non précisé",
    points_forts: $("points_forts").value.trim() || "Aucun",
    prenom: $("prenom").value.trim(),
    nom: $("nom").value.trim(),
    telephone: $("telephone").value.trim(),
    email: $("email").value.trim() || "Non renseigné",
    projet: $("projet").value
  };
}

function calculerEstimation(data) {
  const surface = parseInt(data.surface, 10) || 100;
  let prixM2 = PRIX_M2_PAR_ETAT[data.etat] || PRIX_M2_DEFAUT;
  if (COMMUNES_VALORISEES.includes(data.commune)) prixM2 *= COEF_COMMUNE_VALORISEE;
  const base = surface * prixM2;

  const atouts = ["Bien localisé dans le Pays Mélusin"];
  const vigilances = [];
  if (data.garage !== "Non") atouts.push("Stationnement ou garage disponible");
  if (["Sud", "Sud-Est", "Sud-Ouest"].includes(data.exposition)) atouts.push("Bonne exposition, lumineux");
  if (["Vue dégagée", "Lotissement calme"].includes(data.environnement)) atouts.push("Environnement calme et agréable");
  if (data.points_forts !== "Aucun") atouts.push(data.points_forts.split(",")[0].trim());
  if (data.dpe.startsWith("F") || data.dpe.startsWith("G")) vigilances.push("DPE énergivore : travaux d'isolation à anticiper");
  if (data.etat.includes("rénover") || data.etat.includes("Travaux")) vigilances.push("Travaux à prévoir, à intégrer dans la négociation");
  if (data.environnement === "Proche axe passant") vigilances.push("Proximité d'un axe passant, à vérifier avec les acquéreurs");
  if (!vigilances.length) vigilances.push("À confirmer lors d'une visite approfondie");

  return {
    prix_min: Math.round(base * (1 - MARGE_FOURCHETTE) / 1000) * 1000,
    prix_max: Math.round(base * (1 + MARGE_FOURCHETTE) / 1000) * 1000,
    prix_m2: Math.round(prixM2),
    analyse: `Votre ${data.type.toLowerCase()} de ${surface} m² à ${data.commune} présente des caractéristiques cohérentes avec le marché du Pays Mélusin. L'état "${data.etat}" pèse fortement dans cette estimation. Un avis de valeur à domicile par Julien permettra de l'affiner avec un dossier complet de comparaison.`,
    atouts: atouts.slice(0, 3),
    vigilances: vigilances.slice(0, 2)
  };
}

/* ==========================================================
   ENVOI DE LA DEMANDE (silencieux, en arrière-plan)
   1. Webhook Make : mail à Julien + fiche contact Brevo.
   2. Web3Forms en secours si Make est injoignable.
   Aucune ouverture de messagerie cote visiteur.
   ========================================================== */

// "META" si le visiteur arrive d'une pub Facebook / Instagram, sinon "BSK".
function detecterSource() {
  const params = new URLSearchParams(window.location.search);
  const utm = (params.get("utm_source") || "").toLowerCase();
  if (params.has("fbclid") || /facebook|meta|instagram|^fb$|^ig$/.test(utm)) return "META";
  return "BSK";
}

async function envoyerVersMake(data, est) {
  const champs = new URLSearchParams({
    ...data,
    email: data.email === "Non renseigné" ? "" : data.email,
    prix_min: est.prix_min,
    prix_max: est.prix_max,
    prix_m2: est.prix_m2,
    source: detecterSource(),
    page: window.location.href,
    date_demande: new Date().toISOString(),
    botcheck: $("hp").value
  });

  // Requête "simple" (formulaire encodé, mode no-cors) : pas de pré-vol CORS.
  // La réponse est opaque : seule une panne réseau lève une erreur.
  await fetch(MAKE_WEBHOOK_URL, {
    method: "POST",
    mode: "no-cors",
    keepalive: true,
    body: champs
  });
}

async function envoyerDemande(data, est) {
  try {
    await envoyerVersMake(data, est);
  } catch (err) {
    console.error("Webhook Make injoignable, envoi de secours via Web3Forms :", err);
    envoyerRecap(data, est);
  }
}

function construireRecap(data, est) {
  return [
    "Nouvelle demande reçue via le formulaire d'estimation en ligne.",
    "",
    "--- CONTACT ---",
    `Nom : ${data.prenom} ${data.nom}`,
    `Téléphone : ${data.telephone}`,
    `Email : ${data.email}`,
    `Projet : ${data.projet}`,
    "",
    "--- BIEN ---",
    `Type : ${data.type}`,
    `Commune : ${data.commune}`,
    `Surface : ${data.surface} m²  |  Terrain : ${data.terrain} m²`,
    `Année : ${data.annee}  |  État : ${data.etat}`,
    `Pièces : ${data.pieces}  |  Chambres : ${data.chambres}  |  SdB : ${data.sdb}`,
    `Chauffage : ${data.chauffage}  |  DPE : ${data.dpe}  |  Garage : ${data.garage}`,
    `Exposition : ${data.exposition}  |  Environnement : ${data.environnement}`,
    `Points forts : ${data.points_forts}`,
    "",
    "--- ESTIMATION CALCULEE ---",
    `Fourchette : ${est.prix_min} € à ${est.prix_max} € (${est.prix_m2} €/m²)`,
    "",
    `Consentement de contact : OUI (case cochée le ${new Date().toLocaleString("fr-FR")})`
  ].join("\n");
}

async function envoyerRecap(data, est) {
  const payload = {
    access_key: WEB3FORMS_ACCESS_KEY,
    subject: `Nouvelle demande d'estimation - ${data.prenom} ${data.nom} (${data.commune})`,
    from_name: "Estimateur en ligne Pays Mélusin",
    message: construireRecap(data, est),
    botcheck: $("hp").value
  };
  if (data.email !== "Non renseigné") payload.replyto = data.email;

  try {
    const res = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      console.error("Web3Forms a refusé l'envoi :", json);
    }
  } catch (err) {
    console.error("Envoi du récapitulatif impossible :", err);
  }
}

/* ==========================================================
   SOUMISSION ET AFFICHAGE
   ========================================================== */

function animateLoadingSteps() {
  const steps = ["ls1", "ls2", "ls3"];
  let i = 0;
  const iv = setInterval(() => {
    steps.forEach(s => $(s).classList.remove("active-step"));
    if (i < steps.length) {
      $(steps[i]).classList.add("active-step");
      i++;
    } else {
      clearInterval(iv);
    }
  }, 600);
}

function submitEstimation() {
  if (!$("consent").checked) return showError("Merci de cocher la case de consentement pour être recontacté(e).");
  const data = collectData();
  if (!data.prenom || !data.nom || !data.telephone) return showError("Veuillez remplir prénom, nom et téléphone.");

  $("loading").classList.add("visible");
  animateLoadingSteps();

  const est = calculerEstimation(data);

  // L'envoi part en arrière-plan : l'affichage du résultat n'en dépend pas.
  envoyerDemande(data, est);

  setTimeout(() => {
    $("loading").classList.remove("visible");
    showResults(data, est);
  }, 1800);
}

function showResults(data, est) {
  $("form-section").style.display = "none";
  const rs = $("result-section");
  rs.classList.add("visible");

  const fmt = n => new Intl.NumberFormat("fr-FR").format(n) + " €";
  $("price-display").textContent = fmt(est.prix_min) + " à " + fmt(est.prix_max);
  $("price-sub").textContent = `Soit environ ${est.prix_m2} €/m² · ${data.type} à ${data.commune}`;

  // Construction par le DOM et textContent : aucune injection HTML possible
  const factors = $("result-factors");
  factors.textContent = "";
  [
    ["📐", `${data.surface} m²`, "Surface"],
    ["🏷️", `${est.prix_m2} €/m²`, "Prix estimé"],
    ["📍", data.commune, "Commune"]
  ].forEach(([icone, valeur, libelle]) => {
    const bloc = document.createElement("div");
    bloc.className = "factor";
    [["factor-icon", icone], ["factor-value", valeur], ["factor-label", libelle]].forEach(([classe, texte]) => {
      const el = document.createElement("div");
      el.className = classe;
      el.textContent = texte;
      bloc.appendChild(el);
    });
    factors.appendChild(bloc);
  });

  const zone = $("analysis-text");
  zone.textContent = est.analyse;

  const ajouterListe = (titre, items) => {
    if (!items || !items.length) return;
    zone.appendChild(document.createElement("br"));
    const label = document.createElement("strong");
    label.className = "analysis-label";
    label.textContent = titre + " : ";
    zone.appendChild(label);
    zone.appendChild(document.createTextNode(items.join(" · ")));
  };
  zone.appendChild(document.createElement("br"));
  ajouterListe("Atouts", est.atouts);
  ajouterListe("Points de vigilance", est.vigilances);

  rs.scrollIntoView({ behavior: "smooth" });
}

document.addEventListener("DOMContentLoaded", bindEvents);
