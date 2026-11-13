/* =====================================================
   NEXORA: script.js (no dependencies, no build step)
   ===================================================== */

/* >>> EDIT THIS: put your real email address between the quotes.
   Until you do, the contact form will not open an email draft. <<< */
const CONTACT_EMAIL = "YOUR-EMAIL@EXAMPLE.COM"; // PLACEHOLDER, replace before launch

(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");
  const fineMQ = matchMedia("(hover: hover) and (pointer: fine)");
  const deskMQ = matchMedia("(min-width: 900px)");
  const html = document.documentElement;

  /* ---------- Hero entrance ---------- */
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add("ready")));

  /* ---------- Footer year ---------- */
  const yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Scroll reveals ---------- */
  const reveals = $$("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach((el, i) => { el.style.transitionDelay = (i % 3) * 60 + "ms"; io.observe(el); });
  } else reveals.forEach((el) => el.classList.add("in"));

  /* ---------- Navigation ---------- */
  const nav = $("#nav"), menu = $("#menu"), menuBtn = $("#menu-btn");
  const menuLinks = $$("a", menu);
  const setMenu = (open, returnFocus) => {
    if (open === menu.classList.contains("open")) return; // nothing to change
    menu.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    html.style.overflow = open ? "hidden" : "";
    if (open) requestAnimationFrame(() => { if (menuLinks[0]) menuLinks[0].focus(); }); // move focus into the menu
    else if (returnFocus) menuBtn.focus(); // restore focus to the button
  };
  menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => {
    if (!menu.classList.contains("open")) return;
    if (e.key === "Escape") { setMenu(false, true); return; }
    if (e.key !== "Tab") return;
    // keep Tab / Shift+Tab inside the open menu (menu button + menu links)
    const ring = [menuBtn].concat(menuLinks), last = ring[ring.length - 1], active = document.activeElement;
    if (e.shiftKey && active === menuBtn) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); menuBtn.focus(); }
    else if (ring.indexOf(active) === -1) { e.preventDefault(); menuBtn.focus(); }
  });
  matchMedia("(min-width: 821px)").addEventListener("change", (m) => { if (m.matches) setMenu(false); });

  /* ---------- One rAF-throttled scroll loop ---------- */
  let lastY = scrollY, ticking = false;
  const parallaxEls = $$("[data-parallax]");
  const wrap = $("#pj-wrap"), track = $("#pj-track");
  const stepsWrap = $("#steps-wrap"), railBar = $("#rail-bar");
  let pinned = false;

  function onScroll() {
    ticking = false;
    const y = scrollY;
    // nav: hide on scroll down, show on scroll up
    nav.classList.toggle("solid", y > 40);
    const menuOpen = menu.classList.contains("open");
    if (!menuOpen) {
      if (y > lastY + 6 && y > 120) nav.classList.add("hide");
      else if (y < lastY - 6 || y <= 120) nav.classList.remove("hide");
    }
    lastY = y;
    // subtle parallax: desktop, fine pointer, motion allowed, only near the hero
    if (fineMQ.matches && !reduceMQ.matches && y < innerHeight * 1.2) {
      parallaxEls.forEach((el) => { el.style.translate = "0 " + (y * parseFloat(el.dataset.parallax) * -1).toFixed(1) + "px"; });
    }
    // horizontal project track driven by vertical scroll
    if (pinned) {
      const r = wrap.getBoundingClientRect();
      const range = wrap.offsetHeight - innerHeight;
      const p = clamp(-r.top / range, 0, 1);
      track.style.transform = "translate3d(" + (-p * (track.scrollWidth - innerWidth)).toFixed(1) + "px,0,0)";
    }
    // process progress line
    if (stepsWrap && railBar) {
      const r = stepsWrap.getBoundingClientRect();
      railBar.style.setProperty("--p", clamp((innerHeight * 0.65 - r.top) / r.height, 0, 1).toFixed(3));
      railBar.style.transform = "scaleY(" + clamp((innerHeight * 0.65 - r.top) / r.height, 0, 1).toFixed(3) + ")";
    }
  }
  const requestTick = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  addEventListener("scroll", requestTick, { passive: true });

  /* ---------- Desktop pinned horizontal projects ---------- */
  function setupPin() {
    const on = deskMQ.matches && !reduceMQ.matches;
    if (on) {
      pinned = true;
      const dist = Math.max(0, track.scrollWidth - innerWidth);
      wrap.style.setProperty("--hh", innerHeight + dist + "px");
    } else {
      pinned = false;
      wrap.style.removeProperty("--hh");
      track.style.transform = "";
    }
    onScroll();
  }
  setupPin();
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(setupPin, 150); });
  deskMQ.addEventListener("change", setupPin);
  reduceMQ.addEventListener("change", setupPin);
  document.fonts && document.fonts.ready.then(setupPin);

  // keep keyboard focus visible while the track is pinned
  track.addEventListener("focusin", (e) => {
    if (!pinned) return;
    const card = e.target.closest(".pj");
    if (!card) return;
    const dist = track.scrollWidth - innerWidth;
    const target = clamp(card.offsetLeft - (innerWidth - card.offsetWidth) / 2, 0, dist);
    const top = wrap.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + (target / dist) * (wrap.offsetHeight - innerHeight), behavior: reduceMQ.matches ? "auto" : "smooth" });
  });

  /* ---------- Mobile carousel dots ---------- */
  const dotsBox = $("#pj-dots"), cards = $$(".pj", track);
  cards.forEach(() => dotsBox.appendChild(document.createElement("i")));
  const dots = $$("i", dotsBox);
  function updateDots() {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, bd = Infinity;
    cards.forEach((c, i) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
    dots.forEach((d, i) => d.classList.toggle("on", i === best));
  }
  let dt; track.addEventListener("scroll", () => { clearTimeout(dt); dt = setTimeout(updateDots, 40); }, { passive: true });
  updateDots();

  /* ---------- Services accordion ---------- */
  $$(".svc-btn").forEach((b) => b.addEventListener("click", () => {
    const open = b.getAttribute("aria-expanded") === "true";
    $$(".svc-btn").forEach((o) => o.setAttribute("aria-expanded", "false"));
    b.setAttribute("aria-expanded", String(!open));
  }));

  /* ---------- Counters ---------- */
  const counters = $$("[data-count]");
  function runCounter(el) {
    const end = +el.dataset.count, suf = el.dataset.suffix || "";
    if (reduceMQ.matches) { el.textContent = end + suf; return; }
    const t0 = performance.now(), dur = 1200;
    const step = (t) => {
      const p = clamp((t - t0) / dur, 0, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); }
    }), { threshold: 0.6 });
    counters.forEach((c) => { if (!reduceMQ.matches) c.textContent = "0" + (c.dataset.suffix || ""); co.observe(c); });
  }

  /* ---------- Magnetic buttons (desktop, subtle) ---------- */
  $$("[data-magnetic]").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      if (!fineMQ.matches || reduceMQ.matches || e.pointerType !== "mouse") return;
      const r = b.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 12;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 8;
      b.style.transform = "translate(" + clamp(x, -6, 6).toFixed(1) + "px," + clamp(y, -4, 4).toFixed(1) + "px)";
    });
    b.addEventListener("pointerleave", () => { b.style.transform = ""; });
  });

  /* ---------- Demo modal ---------- */
  const dlg = $("#demo"), dBody = $("#demo-body"), dTitle = $("#demo-title");
  let opener = null;

  const demos = {
    dashboard: { title: "Pulse Analytics", render: demoDashboard },
    booking: { title: "Slotly Booking", render: demoBooking },
    store: { title: "Form & Fabric Store", render: demoStore }
  };

  $$("[data-demo]").forEach((b) => b.addEventListener("click", () => {
    const d = demos[b.dataset.demo]; if (!d) return;
    opener = b; dTitle.textContent = d.title;
    const host = document.createElement("div"); // fresh node per open, so listeners never stack up
    dBody.textContent = ""; dBody.appendChild(host); d.render(host);
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    html.style.overflow = "hidden";
  }));
  const closeDlg = () => { if (dlg.open) (dlg.close ? dlg.close() : dlg.removeAttribute("open")); };
  $("#demo-close").addEventListener("click", closeDlg);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) closeDlg(); });
  dlg.addEventListener("close", () => { html.style.overflow = ""; dBody.innerHTML = ""; if (opener) opener.focus(); });

  /* Demo 1: dashboard */
  function demoDashboard(root) {
    const data = {
      7: [42, 58, 51, 74, 69, 88, 80],
      30: [40, 46, 52, 49, 61, 66, 58, 72, 78, 85],
      90: [30, 34, 38, 41, 47, 52, 55, 61, 66, 70, 79, 90]
    };
    root.innerHTML =
      '<div class="demo-row" role="group" aria-label="Time range">' +
      [7, 30, 90].map((n) => '<button class="chip" data-r="' + n + '" aria-pressed="false">Last ' + n + " days</button>").join("") +
      '</div><div class="kpis"><div><b id="k1"></b><span>Total visits (k)</span></div><div><b id="k2"></b><span>Average</span></div><div><b id="k3"></b><span>Peak</span></div></div>' +
      '<div class="bars" id="bars" role="img" aria-label="Bar chart of demo visits"></div>';
    const bars = $("#bars", root);
    function draw(r) {
      $$(".chip", root).forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.r === String(r))));
      const v = data[r], max = Math.max(...v), sum = v.reduce((a, b) => a + b, 0);
      $("#k1", root).textContent = sum; $("#k2", root).textContent = (sum / v.length).toFixed(1); $("#k3", root).textContent = max;
      bars.innerHTML = v.map((n) => '<i style="height:100%;transform:scaleY(0)" data-s="' + (n / max).toFixed(2) + '"></i>').join("");
      requestAnimationFrame(() => requestAnimationFrame(() => $$("i", bars).forEach((i) => { i.style.transform = "scaleY(" + i.dataset.s + ")"; })));
      bars.setAttribute("aria-label", "Bar chart, " + v.length + " data points, demo data");
    }
    root.addEventListener("click", (e) => { const c = e.target.closest("[data-r]"); if (c) draw(c.dataset.r); });
    draw(7);
  }

  /* Demo 2: booking flow (built with DOM methods and textContent, no HTML strings) */
  function demoBooking(root) {
    const services = ["Strategy call (30 min)", "Design review (45 min)", "Project kickoff (60 min)"];
    const times = ["09:00", "10:30", "13:00", "15:30"];
    const st = { step: 1, svc: "", time: "", name: "", err: "" };
    const make = (tag, props, text) => {
      const n = document.createElement(tag);
      if (props) Object.keys(props).forEach((k) => {
        if (k === "class") n.className = props[k];
        else if (k === "style") n.style.cssText = props[k];
        else n.setAttribute(k, props[k]);
      });
      if (text != null) n.textContent = text;
      return n;
    };
    const btn = (label, attr, cls) => {
      const props = Object.assign({ type: "button" }, attr);
      if (cls) props["class"] = cls;
      return make("button", props, label);
    };
    function render() {
      root.textContent = "";
      if (st.step <= 3) root.appendChild(make("p", { "class": "idx", style: "margin-bottom:16px" }, "Step " + st.step + " of 3"));
      if (st.step === 1) {
        const list = make("div", { "class": "list" });
        services.forEach((s) => {
          const b = make("button", { type: "button", "class": "item", "data-svc": s });
          b.appendChild(make("span", null, s));
          b.appendChild(make("span", null, st.svc === s ? "Selected" : "Choose"));
          list.appendChild(b);
        });
        root.appendChild(list);
      } else if (st.step === 2) {
        const row = make("div", { "class": "demo-row", role: "group", "aria-label": "Available times" });
        times.forEach((t) => row.appendChild(btn(t, { "data-time": t, "aria-pressed": String(st.time === t) }, "chip")));
        root.appendChild(row);
        root.appendChild(btn("Back", { "data-back": "" }, "btn ghost"));
        root.appendChild(document.createTextNode(" "));
        root.appendChild(btn("Continue", { "data-next": "" }, "btn primary"));
      } else if (st.step === 3) {
        const field = make("div", { "class": "field" });
        const inp = make("input", { id: "b-name", type: "text", placeholder: " " });
        inp.value = st.name; // property assignment, never parsed as HTML
        field.appendChild(inp);
        field.appendChild(make("label", { "for": "b-name" }, "Your name"));
        root.appendChild(field);
        root.appendChild(make("p", { "class": "ok", style: "color:#ff8a7a;min-height:1.5em", role: "alert" }, st.err));
        root.appendChild(btn("Back", { "data-back": "" }, "btn ghost"));
        root.appendChild(document.createTextNode(" "));
        root.appendChild(btn("Confirm booking", { "data-confirm": "" }, "btn primary"));
      } else {
        root.appendChild(make("p", { "class": "ok", role: "status" },
          "Demo booking confirmed for " + st.name + ": " + st.svc + " at " + st.time + ". This is a demo. Nothing is saved or sent."));
        root.appendChild(btn("Start over", { "data-reset": "" }, "btn ghost"));
      }
      const f = $("[data-next],[data-confirm],[data-reset],.chip,.item,#b-name", root); // keep keyboard flow sensible
      if (st.step === 3) $("#b-name", root).focus();
      else if (f && st.step !== 1) f.focus();
    }
    root.addEventListener("click", (e) => {
      const t = e.target;
      if (t.closest("[data-svc]")) { st.svc = t.closest("[data-svc]").dataset.svc; st.step = 2; render(); }
      else if (t.closest("[data-time]")) { st.time = t.closest("[data-time]").dataset.time; $$("[data-time]", root).forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.time === st.time))); }
      else if (t.closest("[data-next]")) { if (st.time) { st.step = 3; render(); } else { $$("[data-time]", root)[0].focus(); } }
      else if (t.closest("[data-back]")) { st.step--; render(); }
      else if (t.closest("[data-confirm]")) {
        st.name = $("#b-name", root).value.trim();
        if (!st.name) { st.err = "Enter your name to confirm."; render(); return; }
        st.err = ""; st.step = 4; render();
      } else if (t.closest("[data-reset]")) { st.step = 1; st.svc = st.time = st.name = st.err = ""; render(); }
    });
    render();
  }

  /* Demo 3: store with cart */
  function demoStore(root) {
    const items = [
      { id: "lamp", name: "Linen desk lamp", price: 64 },
      { id: "mug", name: "Stoneware mug", price: 18 },
      { id: "tote", name: "Canvas tote", price: 27 }
    ];
    const qty = { lamp: 0, mug: 0, tote: 0 };
    let done = false, focusKey = "";
    function render() {
      const total = items.reduce((s, i) => s + i.price * qty[i.id], 0);
      const count = items.reduce((s, i) => s + qty[i.id], 0);
      root.innerHTML =
        '<div class="list">' + items.map((i) =>
          '<div class="item"><span>' + i.name + "<br><small style='color:var(--muted)'>$" + i.price + '</small></span><span class="qty">' +
          '<button data-dec="' + i.id + '" aria-label="Remove one ' + i.name + '">&minus;</button><span aria-live="polite">' + qty[i.id] + '</span>' +
          '<button data-inc="' + i.id + '" aria-label="Add one ' + i.name + '">+</button></span></div>').join("") +
        '</div><div class="sum"><span>Total (' + count + " items)</span><span>$" + total + "</span></div>" +
        '<div style="margin-top:16px"><button class="btn primary" data-pay ' + (count ? "" : "disabled style='opacity:.4'") + '>Checkout (demo)</button></div>' +
        (done ? '<p class="ok" role="status">This is a demo, so no order was placed and no payment was taken.</p>' : "");
      const f = focusKey && $('[' + focusKey + ']', root); if (f) f.focus();
    }
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      done = false;
      if (b.dataset.inc) { qty[b.dataset.inc]++; focusKey = 'data-inc="' + b.dataset.inc + '"'; }
      else if (b.dataset.dec) { qty[b.dataset.dec] = Math.max(0, qty[b.dataset.dec] - 1); focusKey = 'data-dec="' + b.dataset.dec + '"'; }
      else if (b.hasAttribute("data-pay")) { done = true; focusKey = "data-pay"; }
      render();
    });
    render();
  }

  /* ---------- Contact form (mailto fallback) ---------- */
  const form = $("#contact-form"), status = $("#form-status");
  const rules = {
    name: (v) => (v.trim() ? "" : "Enter your name."),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter a valid email address."),
    message: (v) => (v.trim().length >= 10 ? "" : "Tell us a little more (at least 10 characters).")
  };
  const errIds = { name: "e-name", email: "e-email", message: "e-msg" };
  function check(inp) {
    const msg = rules[inp.name](inp.value);
    $("#" + errIds[inp.name]).textContent = msg;
    inp.closest(".field").toggleAttribute("data-bad", !!msg);
    inp.setAttribute("aria-invalid", String(!!msg));
    return !msg;
  }
  const fields = $$("input,textarea", form);
  fields.forEach((i) => i.addEventListener("blur", () => { if (i.value) check(i); }));
  fields.forEach((i) => i.addEventListener("input", () => { if (i.closest(".field").hasAttribute("data-bad")) check(i); }));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    status.textContent = "";
    const bad = fields.filter((i) => !check(i));
    if (bad.length) { bad[0].focus(); return; }
    if (/YOUR-EMAIL|EXAMPLE\.COM/i.test(CONTACT_EMAIL)) {
      status.textContent = "The site owner has not set a contact email yet. Edit CONTACT_EMAIL at the top of script.js.";
      return;
    }
    const d = Object.fromEntries(fields.map((i) => [i.name, i.value.trim()]));
    const subject = "Project enquiry from " + d.name;
    const body = d.message + "\n\n" + d.name + "\n" + d.email;
    status.textContent = "Your email app should open with a draft. Nothing is sent or stored by this site until you press send in your email app.";
    location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  });
})();
