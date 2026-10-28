/* Druckkopf Chemnitz – Seitenlogik
   1. Ladebildschirm und Aufbau der Seite (Start + beim Scrollen)
   2. Kopfleiste, Menü und aktiver Menüpunkt
   3. Feiertage, Datum in Chemnitz und Betriebsurlaub (aus urlaub.json)
   4. Drucker-Werkstatt (Fehler → Reparatur → läuft wieder)
   5. Leistungen als Reiter
   6. Spar-Rechner
   7. Anfrageformular mit Wunschtermin-Prüfung
   8. Google-Karte erst nach Klick laden
*/
(function () {
  "use strict";
  window.__dkReady = true;

  var root = document.documentElement;
  var ANIM = root.classList.contains("anim");
  var DAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

  /* ---------- 1. Ladebildschirm und Aufbau ---------- */
  // Verzögerungen für Gruppen setzen (Elemente erscheinen nacheinander)
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    var kids = group.querySelectorAll(":scope > [data-reveal]");
    kids.forEach(function (el, i) { if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", (i * 0.12) + "s"); });
  });

  function revealHero() {
    document.querySelectorAll("[data-hero]").forEach(function (el) { el.classList.add("is-in"); });
  }
  function startScrollReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]:not([data-hero])"));
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  if (ANIM) {
    var withLoader = root.classList.contains("show-loader");
    if (withLoader) {
      try { sessionStorage.setItem("dk-intro", "1"); } catch (e) {}
      setTimeout(function () { root.classList.add("loader-out"); }, 1250);
      setTimeout(revealHero, 1450);
      setTimeout(function () { root.classList.remove("show-loader", "loader-out"); }, 1950);
    } else {
      requestAnimationFrame(function () { requestAnimationFrame(revealHero); });
    }
    startScrollReveal();
  }

  /* ---------- 2. Kopfleiste und Menü ---------- */
  var head = document.querySelector(".site-head");
  var menuBtn = document.querySelector(".menu-btn"), nav = document.getElementById("nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { nav.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false"); }
    });
  }
  var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
  var spySections = navLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
  function onScroll() {
    if (head) head.classList.toggle("is-scrolled", window.scrollY > 8);
    var y = window.scrollY + window.innerHeight * 0.35, current = spySections[0];
    spySections.forEach(function (s) { if (s.offsetTop <= y) current = s; });
    navLinks.forEach(function (a) {
      var on = current && a.getAttribute("href") === "#" + current.id;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 3. Öffnungsstatus ---------- */
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
        f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
        month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(y, month - 1, day));
  }
  var holidayCache = {};
  function holidays(y) {
    if (holidayCache[y]) return holidayCache[y];
    var map = {};
    function add(date, name) { map[date.toISOString().slice(0, 10)] = name; }
    function fixed(mo, d, name) { add(new Date(Date.UTC(y, mo - 1, d)), name); }
    function rel(base, days, name) { add(new Date(base.getTime() + days * 864e5), name); }
    var e = easter(y);
    fixed(1, 1, "Neujahr");
    rel(e, -2, "Karfreitag");
    rel(e, 1, "Ostermontag");
    fixed(5, 1, "Tag der Arbeit");
    rel(e, 39, "Christi Himmelfahrt");
    rel(e, 50, "Pfingstmontag");
    fixed(10, 3, "Tag der Deutschen Einheit");
    fixed(10, 31, "Reformationstag");
    var nov22 = new Date(Date.UTC(y, 10, 22));
    rel(nov22, -((nov22.getUTCDay() - 3 + 7) % 7), "Buß- und Bettag");
    fixed(12, 25, "1. Weihnachtstag");
    fixed(12, 26, "2. Weihnachtstag");
    holidayCache[y] = map;
    return map;
  }
  function holidayName(y, mo, d) {
    return holidays(y)[y + "-" + String(mo).padStart(2, "0") + "-" + String(d).padStart(2, "0")] || null;
  }
  function isWorkday(y, mo, d) {
    var wd = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
    return wd >= 1 && wd <= 5 && !holidayName(y, mo, d);
  }
  function berlinNow() {
    var parts = {};
    try {
      new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
        .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    } catch (err) {
      var n = new Date();
      parts = { year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate(), hour: n.getHours(), minute: n.getMinutes() };
    }
    var y = +parts.year, mo = +parts.month, d = +parts.day;
    return { y: y, m: mo, d: d, wd: new Date(Date.UTC(y, mo - 1, d)).getUTCDay(), min: (+parts.hour % 24) * 60 + (+parts.minute) };
  }
  function addDays(t, n) {
    var dt = new Date(Date.UTC(t.y, t.m - 1, t.d + n));
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), wd: dt.getUTCDay() };
  }
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = berlinNow().y;

  // Betriebsurlaub: Einträge kommen aus urlaub.json (gepflegt über verwaltung.php)
  var VAC = [];
  function key(o) { return o.y * 10000 + o.m * 100 + o.d; }
  function iso(s) { var p = String(s).split("-").map(Number); return { y: p[0], m: p[1], d: p[2] }; }
  function wdOf(o) { return new Date(Date.UTC(o.y, o.m - 1, o.d)).getUTCDay(); }
  function dayDiff(a, b) { return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 864e5); }
  function fmt(o, withDay) {
    var s = String(o.d).padStart(2, "0") + "." + String(o.m).padStart(2, "0") + ".";
    if (o.y !== berlinNow().y) s += o.y;
    return withDay ? DAYS[wdOf(o)] + ", " + s : s;
  }
  function inVacation(o) {
    var k = key(o);
    for (var i = 0; i < VAC.length; i++) if (k >= key(VAC[i].von) && k <= key(VAC[i].bis)) return VAC[i];
    return null;
  }
  function nextOpenAfter(o) {
    for (var i = 1; i <= 60; i++) {
      var n = addDays(o, i);
      if (isWorkday(n.y, n.m, n.d) && !inVacation(n)) return n;
    }
    return null;
  }
  function renderVacation() {
    var today = berlinNow();
    var list = VAC.filter(function (v) { return key(v.bis) >= key(today); });
    document.querySelectorAll("[data-vac-list]").forEach(function (el) {
      el.innerHTML = "";
      list.forEach(function (v) {
        var line = document.createElement("span");
        line.className = "vac-note";
        line.textContent = "Betriebsurlaub " + fmt(v.von) + "–" + fmt(v.bis) + ": geschlossen";
        el.appendChild(line);
      });
      el.hidden = list.length === 0;
    });
    var banner = document.querySelector("[data-vac-banner]");
    if (!banner) return;
    var cur = list.filter(function (v) { return key(v.von) <= key(today); })[0];
    var soon = list.filter(function (v) { return key(v.von) > key(today) && dayDiff(today, v.von) <= 45; })[0];
    var v = cur || soon, text = "";
    if (cur) {
      var back = nextOpenAfter(cur.bis);
      text = "<b>Betriebsurlaub:</b> Wir sind bis " + fmt(cur.bis, true) + " nicht im Laden." + (back ? " Ab " + fmt(back, true) + " sind wir wieder für Sie da." : "");
    } else if (soon) {
      text = "<b>Betriebsurlaub:</b> Vom " + fmt(soon.von, true) + " bis " + fmt(soon.bis, true) + " haben wir geschlossen.";
    }
    if (v && v.hinweis) text += " " + v.hinweis.replace(/[<>&"]/g, function (c) { return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]; });
    banner.querySelector("[data-vac-text]").innerHTML = text;
    banner.hidden = !v;
  }
  if (window.fetch) {
    fetch("urlaub.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !Array.isArray(data.eintraege)) return;
        VAC = data.eintraege.filter(function (e) { return /^\d{4}-\d{2}-\d{2}$/.test(e.von) && /^\d{4}-\d{2}-\d{2}$/.test(e.bis); })
          .map(function (e) { return { von: iso(e.von), bis: iso(e.bis), hinweis: String(e.hinweis || "").slice(0, 160) }; })
          .sort(function (a, b) { return key(a.von) - key(b.von); });
        renderVacation();
      })
      .catch(function () {});
  }

  /* ---------- 4. Drucker-Werkstatt ---------- */
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var bench = document.getElementById("bench");
  if (bench) {
    var textEl = bench.querySelector("[data-bench-text]");
    var btn = bench.querySelector("[data-bench-btn]");
    var btnLabel = btn.querySelector("span");
    var timer = null;
    var STATES = {
      broken: { chip: "Fehler XY00", text: "Fehler XY00: ein Fall für die Werkstatt.", btn: "Reparieren", wait: 4200 },
      repair: { chip: "In Reparatur", text: "Fehler gefunden, wird repariert …", btn: "Wird repariert", wait: 2900 },
      fixed:  { chip: "Läuft wieder", text: "Läuft wieder. Drucken mit Köpfchen.", btn: "Noch mal", wait: 5200 }
    };
    var NEXT = { broken: "repair", repair: "fixed", fixed: "broken" };
    var setState = function (name, auto) {
      clearTimeout(timer);
      var st = STATES[name];
      bench.setAttribute("data-state", name);
      textEl.textContent = st.text;
      btnLabel.textContent = st.btn;
      btn.disabled = name === "repair";
      if (auto !== false && !REDUCED) timer = setTimeout(function () { setState(NEXT[name]); }, st.wait);
      if (REDUCED && name === "repair") timer = setTimeout(function () { setState("fixed", false); }, 900);
    };
    btn.addEventListener("click", function () {
      setState(bench.getAttribute("data-state") === "fixed" ? "broken" : "repair");
    });
    setState("broken", !REDUCED);
  }

  /* ---------- 5. Leistungen als Reiter ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".cat[role='tab']"));
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute("aria-controls"));
      if (!p) return;
      p.hidden = !on;
      if (on && !REDUCED) { p.classList.remove("is-entering"); void p.offsetWidth; p.classList.add("is-entering"); }
    });
    if (focus) tab.focus();
    if (tab.scrollIntoView && window.matchMedia("(max-width: 820px)").matches) {
      tab.scrollIntoView({ block: "nearest", inline: "center", behavior: REDUCED ? "auto" : "smooth" });
    }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t, false); });
    t.addEventListener("keydown", function (e) {
      var k = e.key, next = null;
      if (k === "ArrowDown" || k === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (k === "ArrowUp" || k === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (k === "Home") next = tabs[0];
      if (k === "End") next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });
  tabs.forEach(function (t) {
    var p = document.getElementById(t.getAttribute("aria-controls"));
    if (p) p.hidden = t.getAttribute("aria-selected") !== "true";
  });

  /* ---------- 6. Spar-Rechner ---------- */
  var euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
  var priceIn = document.getElementById("calc-price");
  var nIn = document.getElementById("calc-n");
  var nOut = document.getElementById("calc-n-out");
  function parsePrice(v) {
    v = String(v || "").replace(/[^\d,.\-]/g, "");
    if (v.indexOf(",") > -1) v = v.replace(/\./g, "").replace(",", ".");
    var n = parseFloat(v);
    return isFinite(n) && n > 0 ? n : 0;
  }
  function calc() {
    var price = parsePrice(priceIn.value), n = +nIn.value;
    var neu = price * n, refill = neu * 0.5;
    nOut.textContent = n;
    document.querySelector("[data-out-new]").textContent = euro.format(neu);
    document.querySelector("[data-out-refill]").textContent = euro.format(refill);
    document.querySelector("[data-out-save]").textContent = euro.format(neu - refill);
    document.querySelector("[data-out-eco]").textContent = "Und " + n + (n === 1 ? " Patronen-Set" : " Patronen-Sets") + " weniger im Müll.";
    priceIn.setAttribute("aria-invalid", price ? "false" : "true");
  }
  if (priceIn && nIn) {
    priceIn.addEventListener("input", calc);
    priceIn.addEventListener("blur", function () { var p = parsePrice(priceIn.value); if (p) priceIn.value = p.toFixed(2).replace(".", ","); calc(); });
    nIn.addEventListener("input", calc);
    document.getElementById("calc").addEventListener("submit", function (e) { e.preventDefault(); });
    calc();
  }

  /* ---------- 7. Anfrageformular ---------- */
  var form = document.getElementById("anfrage");
  if (form) {
    var dateIn = document.getElementById("f-date");
    var dateHint = document.getElementById("f-date-hint");
    var msg = form.querySelector("[data-form-msg]");
    var topic = document.getElementById("f-topic");
    var t0 = berlinNow();
    dateIn.min = t0.y + "-" + String(t0.m).padStart(2, "0") + "-" + String(t0.d).padStart(2, "0");
    var checkDate = function () {
      dateIn.setCustomValidity("");
      dateHint.textContent = "Montag bis Freitag, 10 bis 18 Uhr";
      if (!dateIn.value) return true;
      var p = dateIn.value.split("-").map(Number);
      var hol = holidayName(p[0], p[1], p[2]);
      var wd = new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay();
      var vac = inVacation({ y: p[0], m: p[1], d: p[2] });
      var problem = hol ? "Am " + hol + " haben wir geschlossen. Bitte wählen Sie einen anderen Tag."
                  : (wd === 0 || wd === 6) ? "Am Wochenende haben wir geschlossen. Bitte wählen Sie Montag bis Freitag."
                  : vac ? "Vom " + fmt(vac.von) + " bis " + fmt(vac.bis) + " ist Betriebsurlaub. Bitte wählen Sie einen anderen Tag." : "";
      if (problem) { dateIn.setCustomValidity(problem); dateHint.textContent = problem; return false; }
      dateHint.textContent = DAYS[wd] + ", " + p[2] + "." + p[1] + "." + p[0] + " passt.";
      return true;
    };
    dateIn.addEventListener("change", checkDate);
    document.querySelectorAll("[data-topic]").forEach(function (a) {
      a.addEventListener("click", function () { topic.value = a.getAttribute("data-topic"); });
    });
    var show = function (text, ok) {
      msg.hidden = false;
      msg.className = "form-msg " + (ok ? "is-ok" : "is-err");
      msg.textContent = text;
    };
    if (/[?&]gesendet=1/.test(location.search)) show("Danke! Ihre Anfrage ist bei uns angekommen. Wir melden uns bei Ihnen.", true);
    var FAIL = "Das Senden hat nicht geklappt. Bitte rufen Sie uns an (0371 4047800) oder schreiben Sie an info@druckkopf.dk.";
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      checkDate();
      if (!form.checkValidity()) {
        var bad = form.querySelector(":invalid");
        show(bad && bad.validationMessage ? bad.validationMessage : "Bitte füllen Sie die markierten Felder aus.", false);
        if (bad) bad.focus();
        return;
      }
      var endpoint = form.getAttribute("data-endpoint");
      if (!endpoint) {
        show("Vorschau: Hier wird noch nichts verschickt. Auf der fertigen Webseite geht die Anfrage an info@druckkopf.dk.", true);
        return;
      }
      var send = form.querySelector('button[type="submit"]');
      send.disabled = true;
      fetch(endpoint, { method: "POST", body: new FormData(form), headers: { "X-Requested-With": "fetch" } })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (res) {
          if (res && res.ok) { form.reset(); show("Danke! Ihre Anfrage ist bei uns angekommen. Wir melden uns bei Ihnen.", true); }
          else show((res && res.error) || FAIL, false);
        })
        .catch(function () { show(FAIL, false); })
        .then(function () { send.disabled = false; });
    });
  }

  /* ---------- 8. Google-Karte nach Klick ---------- */
  var mapBox = document.getElementById("map");
  var mapBtn = document.querySelector("[data-map-load]");
  if (mapBox && mapBtn) {
    mapBtn.addEventListener("click", function () {
      var consent = mapBox.querySelector("[data-map-consent]");
      if (mapBox.hasAttribute("data-preview")) {
        consent.querySelector("p").textContent = "In der Vorschau kann Google Maps nicht geladen werden. Auf der fertigen Webseite erscheint hier die Google-Karte.";
        return;
      }
      var frame = document.createElement("iframe");
      frame.src = "https://www.google.com/maps?q=" + encodeURIComponent("Druckkopf, Dresdner Straße 106, 09130 Chemnitz") + "&output=embed";
      frame.title = "Google-Karte: Druckkopf, Dresdner Straße 106, 09130 Chemnitz";
      frame.loading = "lazy";
      frame.referrerPolicy = "no-referrer-when-downgrade";
      frame.setAttribute("allowfullscreen", "");
      mapBox.innerHTML = "";
      mapBox.appendChild(frame);
    });
  }
})();
