/* Questionnaire Book Keeper : une question par écran, sans bibliothèque ni service externe.
   Les réponses restent dans la page jusqu'à l'envoi. Deux langues (FR / EN) : les textes sont dans UI et QUESTIONS (champ en: pour l'anglais).
   Les réponses sont toujours enregistrées en français (même valeur quelle que soit la langue), avec une colonne « langue ». */
(function () {
  'use strict';

  // Réglages. endpoint vide = mode aperçu : rien n'est envoyé ni enregistré (voir README.md).
  var CONFIG = {
    endpoint: 'https://script.google.com/macros/s/AKfycbzP-VRkyuEtCd8Mt7xIyeihVO_isptV5G4JMNEev_r6PxKiKqSY3gevShpk0sCRa_s/exec',
    token: '8T10y9jWScs71GAck02zJV2J', // mot secret invisible, le script Google le vérifie (anti-spam)
    contact: 'contact@bookkeeperapp.app',
    keep: "jusqu'à la sortie de l'appli au plus tard, puis elles sont supprimées",
    // Offre testée dans la question « intérêt » : à ajuster ici (prix plafonné à 9,99 € par décision du 2026-11-06).
    offerPrice: { fr: '4,99 €', en: '$4.99' },
    offerFeatures: {
      fr: "Scanner le code-barres d'un livre, écrire ou dicter des notes, suivre ta progression, voir des statistiques sans pression, partager une citation en image, exporter tes données. Tout reste sur ton téléphone, sans compte ni publicité.",
      en: "Scan a book's barcode, write or dictate notes, track your progress, see stats without pressure, share a quote as an image, export your data. Everything stays on your phone, no account, no ads."
    }
  };

  // Langue : ?lang=fr|en dans l'adresse, sinon la langue du téléphone (français ou, pour tout le reste, anglais).
  var LANG = 'fr';
  (function pick() {
    var m = /[?&]lang=(fr|en)\b/.exec(location.search);
    if (m) { LANG = m[1]; return; }
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'fr';
    LANG = /^fr/i.test(nav) ? 'fr' : 'en';
  })();

  // Textes de l'interface.
  var UI = {
    fr: {
      title: 'Parle-nous de tes lectures · Book Keeper', skip: 'Aller au contenu', back: 'Retour', next: 'Suivant', send: 'Envoyer mes réponses', sending: 'Envoi…', start: 'Commencer',
      progress: 'Avancement du questionnaire',
      qOf: function (p, t) { return 'Question ' + p + ' sur ' + t; }, pct: function (n) { return n + ' %'; },
      introTitle: 'Parle-nous de tes lectures', introSub: 'Quelques questions sur tes lectures, depuis ton téléphone, quand tu veux.',
      f1: '5 minutes', f2: "Lu uniquement par l'équipe", f3: 'Dis-nous ce que tu penses vraiment',
      consent: "J'ai 15 ans ou plus et j'accepte que mes réponses soient lues par l'équipe Book Keeper pour mieux comprendre les lecteurs.",
      privacy: 'Détails de confidentialité', privacyHref: 'confidentialite.html', close: 'Fermer', privLoad: 'Chargement…', privFail: "Impossible d'afficher la page ici.", privOpen: 'Ouvrir dans un nouvel onglet', tick: 'Coche la case pour commencer.',
      logoAlt: 'Book Keeper, un endroit calme pour tes lectures',
      pickOne: 'Choisis une réponse pour continuer.', pickMany: 'Choisis au moins une réponse pour continuer.',
      email: 'Ton adresse e-mail', emailPh: 'ton@adresse.fr', emailBad: 'Écris une adresse e-mail valide, ou choisis « Non, merci ».',
      sendFail: "L'envoi n'a pas marché. Vérifie ta connexion et réessaie.",
      thanks: 'Merci !', thanksText: 'Tes réponses sont bien arrivées, elles vont vraiment nous aider. Tu peux fermer cette page.', preview: "Mode aperçu : rien n'a été envoyé ni enregistré."
    },
    en: {
      title: 'Tell us about your reading · Book Keeper', skip: 'Skip to content', back: 'Back', next: 'Next', send: 'Send my answers', sending: 'Sending…', start: 'Start',
      progress: 'Questionnaire progress',
      qOf: function (p, t) { return 'Question ' + p + ' of ' + t; }, pct: function (n) { return n + '%'; },
      introTitle: 'Tell us about your reading', introSub: 'A few questions about how you read, from your phone, whenever you like.',
      f1: '5 minutes', f2: 'Only read by the team', f3: 'Be honest, criticism helps us',
      consent: "I'm 15 or older and I agree that the Book Keeper team may read my answers to better understand readers.",
      privacy: 'Privacy details', privacyHref: 'privacy.html', close: 'Close', privLoad: 'Loading…', privFail: "Can't show the page here.", privOpen: 'Open in a new tab', tick: 'Tick the box to start.',
      logoAlt: 'Book Keeper, a quiet place for your readings',
      pickOne: 'Pick an answer to continue.', pickMany: 'Pick at least one answer to continue.',
      email: 'Your email address', emailPh: 'you@example.com', emailBad: 'Enter a valid email address, or choose “No, thanks”.',
      sendFail: "Sending failed. Check your connection and try again.",
      thanks: 'Thank you!', thanksText: 'Your answers have arrived. You can close this page.', preview: 'Preview mode: nothing was sent or saved.'
    }
  };
  function S(k) { return UI[LANG][k]; }

  // Icônes en trait (dessinées ici, aucune bibliothèque). Contenu fixe, jamais de texte venant de la personne.
  var ICONS = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    hourglass: '<path d="M5 22h14M5 2h14"/><path d="M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22"/><path d="M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4A2 2 0 0 0 17 6.2V2"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/><path d="M20 17v5H6.5A2.5 2.5 0 0 1 4 19.5"/>',
    tablet: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 18h.01"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M12 18h.01"/>',
    headphones: '<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><path d="M21 15a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2z"/><path d="M3 15a2 2 0 0 0 2 2h1v-5H5a2 2 0 0 0-2 2z"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    highlighter: '<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
    pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    notes: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    bookmark: '<path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
    meh: '<circle cx="12" cy="12" r="10"/><path d="M8 15h8M9 9h.01M15 9h.01"/>',
    frown: '<circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M12 8v8M17 8v8"/>',
    chart: '<path d="M12 20V10M18 20V4M6 20v-4"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    minus: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/>',
    euro: '<path d="M18 7c-1.1-1.5-2.8-2.5-5-2.5a6 6 0 0 0 0 15c2.2 0 3.9-1 5-2.5M4 10h10M4 14h10"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/>',
    arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>'
  };
  function svg(name) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    s.innerHTML = ICONS[name] || '';
    return s;
  }
  function ico(name) { var w = el('span', { class: 'ent-ico' }); w.appendChild(svg(name)); return w; }

  // Les questions. Ordre voulu (entonnoir) : échauffement facile > habitudes réelles > applis déjà essayées > idées > prix > ouvert > test.
  // type : text | long | choice (un choix, un toucher suffit) | multi (plusieurs, max) | contact (Oui/Non, e-mail si Oui).
  // cat : petite étiquette au-dessus de la question. icons : une icône par option. showIf : question posée seulement si la fonction renvoie vrai.
  // Le français est le texte de base (et la valeur enregistrée) ; en: contient la version anglaise (mêmes options, même ordre).
  var HAS_TRIED = function (a) { return a.essai_appli === 'Oui'; };
  var QUESTIONS = [
    { id: 'surnom', cat: 'Toi', type: 'text', required: false, label: "Comment veux-tu qu'on t'appelle ?", hint: 'Un prénom ou un surnom, comme tu veux. Tu peux laisser vide.',
      en: { cat: 'You', label: 'What should we call you?', hint: 'A first name or a nickname, whatever you like. You can leave it empty.' } },
    { id: 'age', cat: 'Toi', type: 'choice', required: true, label: "Dans quelle tranche d'âge es-tu ?", options: ['15 à 17 ans', '18 à 24 ans', '25 à 34 ans', '35 à 44 ans', '45 ans et plus'], icons: ['user', 'user', 'user', 'user', 'user'],
      en: { cat: 'You', label: 'Which age range are you in?', options: ['15 to 17', '18 to 24', '25 to 34', '35 to 44', '45 and over'] } },
    { id: 'frequence', cat: 'Tes lectures', type: 'choice', required: true, label: 'Tu lis à quelle fréquence ?', options: ['Tous les jours', 'Quelques fois par semaine', 'Quelques fois par mois', 'Rarement'], icons: ['sun', 'repeat', 'calendar', 'hourglass'],
      en: { cat: 'Your reading', label: 'How often do you read?', options: ['Every day', 'A few times a week', 'A few times a month', 'Rarely'] } },
    { id: 'support', cat: 'Tes lectures', type: 'choice', required: true, label: 'Tu lis surtout sur quoi ?', options: ['Livres papier', 'Liseuse ou tablette', 'Téléphone', 'Livres audio', 'Un peu de tout'], icons: ['book', 'tablet', 'phone', 'headphones', 'layers'],
      en: { cat: 'Your reading', label: 'What do you mostly read on?', options: ['Paper books', 'E-reader or tablet', 'Phone', 'Audiobooks', 'A bit of everything'] } },
    { id: 'souvenir', cat: 'Tes lectures', type: 'multi', max: 4, required: true, label: "Pense à ton dernier livre terminé. Qu'as-tu fait pour t'en souvenir ?", hint: 'Plusieurs choix possibles.', options: ['Rien de particulier', "J'ai marqué ou surligné des passages", "J'ai écrit dans un carnet", "J'ai pris des notes sur mon téléphone", "J'ai photographié des pages", "J'en ai parlé à quelqu'un", 'Autre chose'], icons: ['ban', 'highlighter', 'pencil', 'notes', 'camera', 'message', 'dots'],
      en: { cat: 'Your reading', label: 'Think of the last book you finished. What did you do to remember it?', hint: 'You can pick several.', options: ['Nothing in particular', 'I marked or highlighted passages', 'I wrote in a notebook', 'I took notes on my phone', 'I took photos of pages', 'I talked about it with someone', 'Something else'] } },
    { id: 'moment', cat: 'Tes lectures', type: 'choice', required: true, label: "En général, quand notes-tu une idée ou une phrase d'un livre ?", options: ['Tout de suite, pendant la lecture', "À la fin d'un chapitre", 'À la fin du livre', 'Je ne note jamais'], icons: ['zap', 'bookmark', 'flag', 'ban'],
      en: { cat: 'Your reading', label: 'In general, when do you note down an idea or a sentence from a book?', options: ['Right away, while reading', 'At the end of a chapter', 'At the end of the book', 'I never take notes'] } },
    { id: 'essai_appli', cat: 'Tes applis', type: 'choice', required: true, label: 'As-tu déjà essayé une appli pour suivre tes lectures ?', options: ['Oui', 'Non'], icons: ['check', 'x'],
      en: { cat: 'Your apps', label: 'Have you ever tried an app to keep track of your reading?', options: ['Yes', 'No'] } },
    { id: 'quelle_appli', cat: 'Tes applis', type: 'text', required: false, showIf: HAS_TRIED, label: 'Laquelle ?', hint: "Son nom suffit. Si tu en as essayé plusieurs, donne celle que tu as le plus utilisée.",
      en: { cat: 'Your apps', label: 'Which one?', hint: "Just the name. If you've tried several, give the one you used most." } },
    { id: 'ux', cat: 'Tes applis', type: 'choice', required: true, showIf: HAS_TRIED, label: "Comment l'as-tu trouvée à utiliser ?", options: ['Simple et agréable', 'Correcte, sans plus', 'Compliquée ou pénible'], icons: ['smile', 'meh', 'frown'],
      en: { cat: 'Your apps', label: 'What was it like to use?', options: ['Simple and pleasant', 'Okay, nothing special', 'Complicated or annoying'] } },
    { id: 'pourquoi', cat: 'Tes applis', type: 'long', required: false, showIf: HAS_TRIED, label: "Qu'est-ce qui t'a le plus plu ou le plus gêné ?", hint: "Même en une phrase. Dis-nous aussi si tu l'utilises encore.",
      en: { cat: 'Your apps', label: 'What did you like most, or what bothered you most?', hint: 'Even in one sentence. Tell us if you still use it too.' } },
    { id: 'envie', cat: 'Tes envies', type: 'multi', max: 2, shuffle: true, fixedLast: 1, required: true, label: "Si une appli t'aidait à retrouver tes passages préférés et tes notes, quelles fonctions te tenteraient le plus ?", hint: 'Choisis-en deux au maximum.', options: ['Dicter une note à la voix, sans rien taper', 'Transformer une citation en belle image à partager', "Scanner le code-barres d'un livre pour l'ajouter tout seul", 'Voir mes statistiques de lecture (livres lus, temps passé…)', "Tout garder sur mon téléphone, sans compte ni internet", 'Aucune ne me donne envie'], icons: ['mic', 'image', 'scan', 'chart', 'lock', 'minus'],
      en: { cat: 'Your ideas', label: 'If an app helped you find your favorite passages and notes, which features would tempt you most?', hint: 'Pick two at most.', options: ['Dictate a note by voice, without typing', 'Turn a quote into a nice image to share', "Scan a book's barcode to add it automatically", 'See my reading stats (books read, time spent…)', 'Keep everything on my phone, no account or internet', 'None of these appeal to me'] } },
    { id: 'prix', cat: 'Tes envies', type: 'choice', required: true, label: "Imagine que tu achètes une appli comme celle-là en une seule fois (un paiement unique, pas d'abonnement). Quel prix maximum te paraîtrait correct ?", options: ["Je ne l'achèterais pas", "Jusqu'à 3 €", "Jusqu'à 5 €", "Jusqu'à 10 €", 'Plus de 10 €'], icons: ['x', 'euro', 'euro', 'euro', 'euro'],
      en: { cat: 'Your ideas', label: "Imagine you buy an app like that once (a single payment, no subscription). What's the highest price that would feel fair?", options: ["I wouldn't buy it", 'Up to $3', 'Up to $5', 'Up to $10', 'More than $10'] } },
    { id: 'interet', cat: 'Tes envies', type: 'choice', required: true,
      label: function () { return 'Une appli avec ces fonctions, à ' + CONFIG.offerPrice.fr + ", en paiement unique, sans abonnement : ça t'intéresserait ?"; },
      hint: function () { return CONFIG.offerFeatures.fr; },
      options: ['Oui, sûrement', 'Peut-être, ça dépend', 'Non, pas pour ce prix', "Non, ce genre d'appli ne m'intéresse pas"], icons: ['check', 'meh', 'euro', 'x'],
      en: { cat: 'Your ideas', label: function () { return 'An app with these features for ' + CONFIG.offerPrice.en + ', one payment, no subscription: would you be interested?'; }, hint: function () { return CONFIG.offerFeatures.en; }, options: ['Yes, definitely', 'Maybe, it depends', 'No, not at this price', "No, this kind of app doesn't interest me"] } },
    { id: 'agacements', cat: 'Pour finir', type: 'long', required: false, label: "Pour garder une trace de tes lectures, qu'est-ce qui t'agace ou te manque ?", hint: "Même un détail. Sois honnête : une critique nous aide plus qu'un compliment.",
      en: { cat: 'To finish', label: 'To keep track of your reading, what annoys you or is missing?', hint: 'Even a small detail. Be honest: criticism helps us more than a compliment.' } },
    { id: 'tester', cat: 'Pour finir', type: 'contact', required: false, label: "Aimerais-tu tester l'appli avant sa sortie ?", options: ['Oui', 'Non, merci'], icons: ['check', 'x'], hint: "Si oui, laisse une adresse e-mail pour qu'on te prévienne. On ne s'en sert que pour ça.",
      en: { cat: 'To finish', label: 'Would you like to try the app before it launches?', options: ['Yes', 'No, thanks'], hint: "If yes, leave an email address so we can let you know. We only use it for that." } }
  ];

  // Texte d'une question dans la langue choisie (une fonction est appelée, pour les textes qui dépendent d'un réglage).
  function txt(q, k) {
    var v = (LANG === 'en' && q.en && q.en[k] !== undefined) ? q.en[k] : q[k];
    return typeof v === 'function' ? v() : v;
  }
  function optText(q, k) { return (LANG === 'en' && q.en && q.en.options) ? q.en.options[k] : q.options[k]; }

  var app = document.getElementById('app');
  var progress = document.getElementById('progress');
  var fill = document.getElementById('progress-fill');
  var ptext = document.getElementById('progress-text');
  var ppct = document.getElementById('progress-pct');
  var bar = progress.querySelector('[role=progressbar]');
  var backTop = document.getElementById('back-top');
  var backLabel = document.getElementById('back-label');
  var skipLink = document.querySelector('.skip');
  var langBtn = document.getElementById('lang');
  var langOpts = Array.prototype.slice.call(langBtn.querySelectorAll('.ent-lang-opt'));
  var answers = {};
  var consent = false;
  var draft = null; // enregistre ce qui est déjà saisi à l'écran avant un changement de langue
  var step = 0; // 0 = accueil, 1..N = questions
  var finished = null; // quand c'est envoyé : { r, sent }
  var N = QUESTIONS.length;
  var canHist = !!(window.history && window.history.pushState);
  function shown(q) { return !q.showIf || q.showIf(answers); }

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  // Toasts : message bref au-dessus des boutons, lu par les lecteurs d'écran, disparaît seul (ou d'un toucher).
  var toastBox = el('div', { class: 'ent-toasts', role: 'alert', 'aria-live': 'assertive', 'aria-atomic': 'true' });
  document.body.appendChild(toastBox);
  var toastTimer = null;
  function toast(msg) {
    clearTimeout(toastTimer);
    var t = el('div', { class: 'ent-toast' }, [ico('alert'), el('span', { text: msg })]);
    toastBox.replaceChildren(t);
    function close() { clearTimeout(toastTimer); t.classList.add('out'); setTimeout(function () { if (t.parentNode) t.remove(); }, 200); }
    t.addEventListener('click', close);
    toastTimer = setTimeout(close, 4500);
  }

  // Navigation : chaque écran ajoute une entrée à l'historique, donc le bouton Retour du téléphone
  // et nos boutons « Retour » reviennent d'UNE question (jamais au tout début).
  function go(n) {
    step = n; render();
    if (canHist) { try { history.pushState({ s: n }, '', '#etape-' + n); } catch (e) { canHist = false; } }
  }
  function goBack() {
    if (finished) return;
    if (canHist && history.state && history.state.s > 0) { history.back(); return; }
    do { step -= 1; } while (step >= 1 && step <= N && !shown(QUESTIONS[step - 1]));
    render();
  }
  window.addEventListener('popstate', function (e) {
    if (modal) { removeModal(); return; }
    if (e.state && e.state.modal) return;
    if (finished) { showDone(); return; }
    var s = e.state && typeof e.state.s === 'number' ? e.state.s : 0;
    while (s >= 1 && s <= N && !shown(QUESTIONS[s - 1])) s += 1;
    step = s; render();
  });
  backTop.addEventListener('click', goBack);

  // Choix de la langue : même place sur tous les écrans, sans perdre ce qui est déjà saisi.
  function applyLang() {
    document.documentElement.lang = LANG;
    document.title = S('title');
    if (skipLink) skipLink.textContent = S('skip');
    backLabel.textContent = S('back');
    bar.setAttribute('aria-label', S('progress'));
    document.querySelectorAll('.ent-lang-opt').forEach(function (o) { o.classList.toggle('on', o.getAttribute('data-lang') === LANG); });
    document.querySelectorAll('.ent-lang').forEach(function (b) { b.setAttribute('aria-label', LANG === 'fr' ? 'Langue : français. Appuyer pour passer en anglais.' : 'Language: English. Tap to switch to French.'); });
  }
  // Toute la surface du sélecteur est un seul bouton : un toucher n'importe où passe à l'autre langue.
  function toggleLang() {
    if (draft) draft();
    LANG = LANG === 'fr' ? 'en' : 'fr';
    applyLang(); render();
    if (modal) fillModal();
  }
  langBtn.addEventListener('click', toggleLang);

  // Modale « Détails de confidentialité » : plein écran, fondu à l'ouverture et à la fermeture,
  // Retour (gauche), langue (centre), croix (droite). Le texte vient des pages confidentialite.html / privacy.html (une seule source).
  var modal = null, modalBody = null, modalOpener = null, modalTimer = null;
  var privCache = {};
  var pageBlocks = function () { return Array.prototype.slice.call(document.querySelectorAll('.ent-top, #app, .ent-toasts')); };

  function fillModal() {
    modal.querySelector('.ent-modal-back span').textContent = S('back');
    modal.querySelector('.ent-modal-x').setAttribute('aria-label', S('close'));
    var key = LANG;
    function show(node) {
      if (!modal || key !== LANG) return;
      modalBody.replaceChildren(node);
      modal.setAttribute('aria-labelledby', 'priv-title');
      var h = modalBody.querySelector('h1'); if (h) h.id = 'priv-title';
      modalBody.scrollTop = 0;
    }
    if (privCache[key]) { show(document.importNode(privCache[key], true)); return; }
    modalBody.replaceChildren(el('p', { class: 'ent-modal-msg', text: S('privLoad') }));
    fetch(S('privacyHref'), { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('http');
      return r.text();
    }).then(function (t) {
      var d = new DOMParser().parseFromString(t, 'text/html');
      var m = d.querySelector('.ent-doc');
      if (!m) throw new Error('doc');
      m.querySelectorAll('.ent-brand, nav').forEach(function (n) { n.remove(); });
      privCache[key] = m;
      show(document.importNode(m, true));
    }).catch(function () {
      var a = el('a', { href: S('privacyHref'), target: '_blank', rel: 'noopener', text: S('privOpen') });
      show(el('div', { class: 'ent-doc' }, [el('p', { text: S('privFail') }), el('p', {}, [a])]));
    });
  }

  function openPrivacy(opener) {
    if (modal) return;
    clearTimeout(modalTimer);
    modalOpener = opener || null;
    var back = el('button', { type: 'button', class: 'ent-back-top ent-modal-back' }, [svg('arrowLeft'), el('span', { text: S('back') })]);
    var lang = langBtn.cloneNode(true); lang.removeAttribute('id');
    var x = el('button', { type: 'button', class: 'ent-modal-x', 'aria-label': S('close') }, [svg('close')]);
    var head = el('div', { class: 'ent-modal-bar' }, [back, lang, x]);
    modalBody = el('div', { class: 'ent-modal-body' });
    modal = el('div', { class: 'ent-modal', role: 'dialog', 'aria-modal': 'true' }, [el('div', { class: 'ent-modal-top' }, [head]), modalBody]);
    document.body.appendChild(modal);
    pageBlocks().forEach(function (b) { b.setAttribute('inert', ''); });
    document.documentElement.classList.add('modal-open');
    applyLang();
    lang.addEventListener('click', toggleLang);
    back.addEventListener('click', closePrivacy);
    x.addEventListener('click', closePrivacy);
    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closePrivacy(); return; }
      if (e.key !== 'Tab') return;
      var f = Array.prototype.slice.call(modal.querySelectorAll('button, a[href]'));
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    if (canHist) { try { history.pushState({ modal: 1 }, '', '#confidentialite'); } catch (e) { canHist = false; } }
    fillModal();
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (modal) { modal.classList.add('open'); x.focus(); } }); });
  }
  function removeModal() {
    if (!modal) return;
    var m = modal; modal = null; modalBody = null;
    m.classList.remove('open');
    pageBlocks().forEach(function (b) { b.removeAttribute('inert'); });
    document.documentElement.classList.remove('modal-open');
    modalTimer = setTimeout(function () { if (m.parentNode) m.remove(); }, 240);
    if (modalOpener && document.body.contains(modalOpener)) modalOpener.focus();
    else { var c = document.getElementById('consent'); if (c) c.focus(); }
  }
  function closePrivacy() {
    if (!modal) return;
    if (canHist && history.state && history.state.modal) history.back(); // popstate ferme la modale
    else removeModal();
  }

  function setProgress() {
    document.body.classList.toggle('is-intro', step === 0 && !finished);
    var isQ = step >= 1 && step <= N && !finished;
    progress.hidden = !isQ;
    backTop.hidden = !isQ;
    if (!isQ) return;
    var vis = QUESTIONS.map(shown);
    var total = vis.filter(Boolean).length;
    var pos = vis.slice(0, step).filter(Boolean).length;
    var pct = Math.round((pos / total) * 100);
    fill.style.width = pct + '%';
    bar.setAttribute('aria-valuenow', String(pct));
    ptext.textContent = S('qOf')(pos, total);
    ppct.textContent = S('pct')(pct);
  }

  // Changement d'écran : l'ancien se fond en 160 ms, le nouveau apparaît en fondu (pas d'animation si la personne l'a désactivée).
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var showSeq = 0;
  var firstShow = true;
  function show(nodes, focusSel) {
    var my = ++showSeq;
    function swap() {
      if (my !== showSeq) return;
      app.replaceChildren.apply(app, nodes);
      setProgress();
      var f = app.querySelector(focusSel || 'h1, h2');
      if (f) { f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); }
      window.scrollTo(0, 0);
      app.classList.remove('is-leaving', 'is-entering');
      if (!reduceMotion) { void app.offsetWidth; app.classList.add('is-entering'); }
    }
    if (firstShow || reduceMotion) { firstShow = false; swap(); return; }
    app.classList.add('is-leaving');
    setTimeout(swap, 160);
  }

  function actions(back, nextLabel, withArrow) {
    var kids = [];
    if (back) kids.push(el('button', { class: 'ent-btn secondary', type: 'button', text: S('back') }));
    var next = el('button', { class: 'ent-btn', type: 'submit' });
    next.appendChild(document.createTextNode(nextLabel));
    if (withArrow) next.appendChild(svg('arrowRight'));
    kids.push(next);
    var box = el('div', { class: 'ent-actions' }, kids);
    if (back) box.firstChild.addEventListener('click', goBack);
    return box;
  }

  // Écran d'accueil : photo, logo, promesse, un seul accord.
  function intro() {
    var form = el('form', { novalidate: 'novalidate' });
    form.style.display = 'contents';
    var photo = el('img', { class: 'photo', src: 'visuel-librairie.jpg', alt: S('logoAlt'), width: '716', height: '439' });
    var hero = el('div', { class: 'ent-hero' }, [photo]);
    var facts = el('ul', { class: 'ent-facts' }, [
      el('li', {}, [ico('clock'), el('span', { text: S('f1') })]),
      el('li', {}, [ico('lock'), el('span', { text: S('f2') })]),
      el('li', {}, [ico('message'), el('span', { text: S('f3') })])
    ]);
    var cb = el('input', { type: 'checkbox', id: 'consent' });
    cb.checked = consent;
    var link = el('a', { class: 'ent-more', href: S('privacyHref'), 'aria-haspopup': 'dialog' }, [el('span', { text: S('privacy') }), svg('chevronRight')]);
    link.addEventListener('click', function (e) { e.preventDefault(); if (draft) draft(); openPrivacy(link); });
    var consentBox = el('div', { class: 'ent-consent' }, [
      el('label', { class: 'ent-check' }, [cb, el('span', { text: S('consent') })]),
      el('p', { class: 'ent-note' }, [link])
    ]);
    var body = el('div', { class: 'ent-intro-body' }, [
      el('h1', { text: S('introTitle') }),
      el('p', { class: 'ent-sub', text: S('introSub') }),
      facts, consentBox, actions(false, S('start'), true)
    ]);
    form.appendChild(hero); form.appendChild(body);
    draft = function () { consent = cb.checked; };
    cb.addEventListener('change', function () { consent = cb.checked; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!cb.checked) { toast(S('tick')); return; }
      go(1);
    });
    show([form], 'h1');
  }

  // La valeur d'une option (envoyée dans le tableau) reste en français ; le texte affiché suit la langue.
  function option(q, k, type, checked) {
    var inp = el('input', { type: type, name: q.id, value: q.options[k], id: q.id + '-' + k });
    if (checked) inp.checked = true;
    var kids = [];
    if (q.icons && q.icons[k]) kids.push(ico(q.icons[k]));
    kids.push(el('span', { class: 'ent-opt-text', text: optText(q, k) }));
    if (type === 'checkbox') { var bx = el('span', { class: 'ent-box' }); bx.appendChild(svg('check')); kids.push(bx); }
    return el('label', { class: 'ent-choice' }, [inp, el('span', { class: 'ent-opt' }, kids)]);
  }

  function question(i) {
    var q = QUESTIONS[i];
    var form = el('form', { novalidate: 'novalidate' });
    form.style.display = 'contents';
    var field;
    var current = answers[q.id] || '';
    var hintId = 'hint-' + q.id;
    var head = el('h2', { text: txt(q, 'label'), id: 'q-' + q.id });
    var hint = txt(q, 'hint') ? el('p', { class: 'ent-hint', id: hintId, text: txt(q, 'hint') }) : null;

    if (q.type === 'choice' || q.type === 'contact') {
      var opts = q.options.map(function (o, k) {
        var on = current === o || (q.type === 'contact' && o === 'Oui' && current.indexOf('Oui') === 0);
        return option(q, k, 'radio', on);
      });
      field = el('fieldset', { class: 'ent-field', 'aria-labelledby': 'q-' + q.id }, opts);
      if (q.type === 'contact') {
        // L'adresse e-mail n'apparaît que si la réponse est « Oui ».
        var mailWrap = el('div', { class: 'ent-field' });
        var mail = el('input', { class: 'ent-input', id: 'mail-' + q.id, type: 'email', autocomplete: 'email', inputmode: 'email', placeholder: S('emailPh') });
        mail.value = answers[q.id + '_email'] || answers[q.id + '_brouillon'] || '';
        mailWrap.appendChild(el('label', { for: 'mail-' + q.id, text: S('email'), class: 'ent-label' }));
        mailWrap.appendChild(mail);
        mailWrap.hidden = current !== 'Oui';
        field.addEventListener('change', function () {
          var c = form.querySelector('input[name=' + q.id + ']:checked');
          mailWrap.hidden = !(c && c.value === 'Oui');
          if (!mailWrap.hidden) mail.focus({ preventScroll: true });
        });
        field = el('div', { class: 'ent-field' }, [field, mailWrap]);
      }
    } else if (q.type === 'multi') {
      if (!q._order) {
        var idx = q.options.map(function (o, k) { return k; });
        if (q.shuffle) {
          var fixed = idx.splice(idx.length - (q.fixedLast || 0), q.fixedLast || 0);
          for (var m = idx.length - 1; m > 0; m--) { var r = Math.floor(Math.random() * (m + 1)); var t = idx[m]; idx[m] = idx[r]; idx[r] = t; }
          idx = idx.concat(fixed);
        }
        q._order = idx;
      }
      var picked = current ? current.split(' | ') : [];
      var boxes = q._order.map(function (k) { return option(q, k, 'checkbox', picked.indexOf(q.options[k]) !== -1); });
      field = el('fieldset', { class: 'ent-field', 'aria-labelledby': 'q-' + q.id }, boxes);
      var limit = function () {
        var on = field.querySelectorAll('input:checked').length;
        field.querySelectorAll('input').forEach(function (inp) { inp.disabled = on >= q.max && !inp.checked; });
      };
      field.addEventListener('change', limit); limit();
    } else if (q.type === 'long') {
      var ta = el('textarea', { class: 'ent-textarea', id: 'f-' + q.id, 'aria-labelledby': 'q-' + q.id, maxlength: '1000' });
      if (hint) ta.setAttribute('aria-describedby', hintId);
      ta.value = current;
      field = el('div', { class: 'ent-field' }, [ta]);
    } else {
      var inp2 = el('input', { class: 'ent-input', id: 'f-' + q.id, type: 'text', 'aria-labelledby': 'q-' + q.id, maxlength: '60', autocomplete: 'off' });
      if (hint) inp2.setAttribute('aria-describedby', hintId);
      inp2.value = current;
      field = el('div', { class: 'ent-field' }, [inp2]);
    }

    var card = el('div', { class: 'ent-card' }, [el('p', { class: 'ent-pill', text: txt(q, 'cat') }), head, hint, field]);
    form.appendChild(card);
    form.appendChild(actions(true, i === N - 1 ? S('send') : S('next'), false));
    if (q.type === 'choice') {
      // Un seul choix : un toucher suffit, on passe à la suite sans second bouton.
      // Le bouton Suivant reste pour le clavier (visible seulement quand il a le focus).
      form.querySelector('button[type=submit]').classList.add('ent-kb-only');
      var going = false;
      field.addEventListener('click', function (e) {
        if (e.target.tagName !== 'INPUT' || going || !e.detail) return;
        going = true;
        setTimeout(function () { form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }, 180);
      });
    }

    function readValue() {
      if (q.type === 'multi') {
        return Array.prototype.map.call(form.querySelectorAll('input[name=' + q.id + ']:checked'), function (inp) { return inp.value; }).join(' | ');
      }
      if (q.type === 'choice' || q.type === 'contact') {
        var c = form.querySelector('input[name=' + q.id + ']:checked');
        return c ? c.value : '';
      }
      return (form.querySelector('#f-' + q.id).value || '').trim();
    }
    draft = function () {
      var v = readValue();
      if (v) answers[q.id] = v; else delete answers[q.id];
      if (q.type === 'contact') answers[q.id + '_brouillon'] = (form.querySelector('#mail-' + q.id).value || '').trim();
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = readValue();
      if (q.required && !value) { toast(q.type === 'multi' ? S('pickMany') : S('pickOne')); return; }
      if (q.type === 'contact') {
        if (value === 'Oui') {
          var email = (form.querySelector('#mail-' + q.id).value || '').trim();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast(S('emailBad')); form.querySelector('#mail-' + q.id).focus({ preventScroll: true }); return; }
          answers[q.id + '_email'] = email;
        } else { delete answers[q.id + '_email']; }
        delete answers[q.id + '_brouillon'];
      }
      answers[q.id] = value;
      var n = step;
      do { n += 1; } while (n <= N && !shown(QUESTIONS[n - 1]));
      if (n === N + 1) { send(form); return; }
      go(n);
    });
    show([form], 'h2');
  }

  // Une cellule qui commence par = + - @ serait lue comme une formule par un tableur : on la neutralise.
  function safe(v) { v = String(v == null ? '' : v); return /^[=+\-@\t\r]/.test(v) ? "'" + v : v; }

  // Ordre des colonnes : date, accord, puis les questions, puis la langue (ajoutée à la fin pour ne rien décaler).
  function record() {
    var r = { date: new Date().toISOString(), consentement: 'oui' };
    QUESTIONS.forEach(function (q) { var on = shown(q); r[q.id] = safe(on ? answers[q.id] : ''); if (q.type === 'contact') r[q.id + '_email'] = safe(answers[q.id + '_email']); });
    r.langue = LANG;
    return r;
  }

  function send(form) {
    var btn = form.querySelector('button[type=submit]');
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = S('sending');
    draft = null;
    var r = record();
    if (!CONFIG.endpoint) { done(r, true); return; }
    fetch(CONFIG.endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ token: CONFIG.token }, r)) })
      .then(function () { done(r, true); })
      .catch(function () { btn.disabled = false; btn.textContent = label; toast(S('sendFail')); });
  }

  function done(r, sent) { finished = { r: r, sent: sent }; showDone(); }

  function showDone() {
    draft = null;
    var kids = [ico('check'), el('h2', { text: S('thanks') }), el('p', { text: S('thanksText') })];
    if (!CONFIG.endpoint) kids.push(el('p', { class: 'ent-note', text: S('preview') }));
    show([el('div', { class: 'ent-card ent-done' }, kids)], 'h2');
  }

  function render() {
    if (finished) return showDone();
    if (step === 0) return intro();
    if (step <= N) return question(step - 1);
  }

  // Clavier mobile : le champ et les boutons restent visibles au-dessus du clavier.
  var vv = window.visualViewport;
  function isField(a) { return a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && /^(text|email)$/.test(a.type))); }
  function reveal() {
    var a = document.activeElement;
    if (!isField(a)) return;
    var form = a.closest('form');
    var btns = form && form.querySelector('.ent-actions');
    var barH = btns ? btns.offsetHeight : 0;
    var top0 = vv ? vv.offsetTop : 0;
    var h = vv ? vv.height : window.innerHeight;
    var kb = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
    // Le navigateur, quand il fait défiler tout seul, respecte ces marges : le champ ne passe pas sous les boutons ni sous le clavier.
    var de = document.documentElement;
    de.style.scrollPaddingBottom = (kb + barH + 24) + 'px';
    de.style.scrollPaddingTop = '16px';
    var visTop = top0 + 16;
    var visBottom = top0 + h - barH - 24;
    var r = a.getBoundingClientRect();
    if (r.height > visBottom - visTop || r.top < visTop) window.scrollBy(0, Math.floor(r.top - visTop));
    else if (r.bottom > visBottom) window.scrollBy(0, Math.ceil(r.bottom - visBottom));
  }
  function onViewport() {
    if (vv) document.documentElement.style.setProperty('--kb', Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) + 'px');
    reveal();
  }
  if (vv) { vv.addEventListener('resize', onViewport); vv.addEventListener('scroll', onViewport); }
  document.addEventListener('focusin', function (e) {
    if (isField(e.target)) { [100, 350, 700, 1100].forEach(function (t) { setTimeout(reveal, t); }); }
  });

  if (canHist) { try { history.replaceState({ s: 0 }, '', location.pathname + location.search); } catch (e) { canHist = false; } }
  applyLang();
  render();
})();
