(function (w, d) {
  "use strict";
  if (w.HGAE && w.HGAE.__loaded) return;

  var SK = "hgae_session",
    VK = "hgae_vid",
    DAYS = 30,
    sent = {};

  function scriptCfg() {
    var list = d.getElementsByTagName("script"),
      el = list[list.length - 1],
      i;
    for (i = 0; i < list.length; i++) {
      if ((list[i].src || "").indexOf("hgae-tracker") !== -1) {
        el = list[i];
        break;
      }
    }
    return {
      hotelId: (el && el.getAttribute("data-hotel-id")) || "",
      apiBase: (el && el.getAttribute("data-api-base")) || "",
      debug: el && el.getAttribute("data-debug") === "true",
    };
  }

  function uid() {
    return w.crypto && w.crypto.randomUUID
      ? w.crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
          var r = (Math.random() * 16) | 0;
          return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
        });
  }

  function cookieGet(n) {
    var m = d.cookie.match(new RegExp("(?:^|; )" + n + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function cookieSet(n, v) {
    d.cookie =
      n +
      "=" +
      encodeURIComponent(v) +
      "; Path=/; Max-Age=" +
      DAYS * 86400 +
      "; SameSite=Lax" +
      (location.protocol === "https:" ? "; Secure" : "");
  }

  function lsGet(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  }

  function lsSet(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {}
  }

  function parse(raw) {
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function visitorId() {
    var id = lsGet(VK) || cookieGet(VK);
    if (!id) id = "v_" + uid().replace(/-/g, "").slice(0, 16);
    lsSet(VK, id);
    cookieSet(VK, id);
    return id;
  }

  function readSession() {
    return parse(lsGet(SK)) || parse(cookieGet(SK));
  }

  function writeSession(s) {
    var raw = JSON.stringify(s);
    lsSet(SK, raw);
    cookieSet(SK, raw);
  }

  function qs() {
    var out = {},
      s = (location.search || "").replace(/^\?/, ""),
      parts = s ? s.split("&") : [],
      i,
      p,
      k;
    for (i = 0; i < parts.length; i++) {
      p = parts[i].split("=");
      k = decodeURIComponent((p[0] || "").replace(/\+/g, " "));
      if (k) out[k] = decodeURIComponent((p.slice(1).join("=") || "").replace(/\+/g, " "));
    }
    return out;
  }

  function capture(force) {
    var q = qs(),
      prev = readSession(),
      has = !!(q.ref || q.utm_source || q.utm_medium || q.utm_campaign);
    if (!has && prev && !force) return prev;
    if (!has && !prev) {
      var bare = {
        visitor_id: visitorId(),
        captured_at: new Date().toISOString(),
        landing_page_url: location.href,
      };
      writeSession(bare);
      return bare;
    }
    var s = {
      visitor_id: (prev && prev.visitor_id) || visitorId(),
      ref: q.ref || (prev && prev.ref) || null,
      utm_source: q.utm_source || (prev && prev.utm_source) || null,
      utm_medium: q.utm_medium || (prev && prev.utm_medium) || null,
      utm_campaign: q.utm_campaign || (prev && prev.utm_campaign) || null,
      channel_identifier: null,
      landing_page_url: location.href,
      captured_at: new Date().toISOString(),
    };
    if (s.ref) s.channel_identifier = "ref=" + s.ref;
    else if (s.utm_source) s.channel_identifier = "utm_source=" + s.utm_source;
    if (has) writeSession(s);
    return has ? s : prev || s;
  }

  function num(v) {
    if (typeof v === "number" && isFinite(v)) return v;
    if (typeof v === "string") {
      var n = Number(String(v).replace(",", ".").trim());
      return isFinite(n) ? n : null;
    }
    return null;
  }

  function isPurchase(name) {
    return typeof name === "string" && name.toLowerCase().indexOf("purchase") !== -1;
  }

  function extract(item) {
    var ecom = null,
      raw = item;
    if (Object.prototype.toString.call(item) === "[object Array]") {
      if (isPurchase(item[1])) {
        ecom = item[2] && item[2].ecommerce ? item[2].ecommerce : item[2];
        raw = { event: item[1], ecommerce: ecom };
      }
    } else if (item && isPurchase(item.event || item.eventName)) {
      ecom = item.ecommerce || (item.detail && item.detail.ecommerce);
    }
    if (!ecom) return null;
    var tid = ecom.transaction_id || ecom.transactionId || ecom.id;
    var value = num(ecom.value != null ? ecom.value : ecom.revenue);
    if (!tid || value == null) return null;
    return {
      transaction_id: String(tid),
      booking_value: value,
      currency: ecom.currency || "EUR",
      arrival_date: ecom.arrival || ecom.arrival_date || null,
      departure_date: ecom.departure || ecom.departure_date || null,
      rooms_count: num(ecom.rooms != null ? ecom.rooms : ecom.rooms_count),
      nights_count: num(ecom.nights != null ? ecom.nights : ecom.nights_count),
      raw: raw,
    };
  }

  function endpoint(path) {
    return (HGAE.config.apiBase || location.origin).replace(/\/$/, "") + path;
  }

  function post(url, payload) {
    var body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      try {
        if (navigator.sendBeacon(url, new Blob([body], { type: "application/json" })))
          return Promise.resolve({ ok: true });
      } catch {}
    }
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      keepalive: true,
      mode: "cors",
      credentials: "omit",
    }).then(function (r) {
      return r.json().catch(function () {
        return { ok: r.ok };
      });
    });
  }

  function send(purchase) {
    if (!purchase || !purchase.transaction_id || sent[purchase.transaction_id]) return;
    sent[purchase.transaction_id] = 1;
    var hotelId = HGAE.config.hotelId;
    if (!hotelId) return;
    var session = capture(false) || {};
    return post(endpoint("/api/v1/conversions"), {
      hotel_id: hotelId,
      transaction_id: purchase.transaction_id,
      booking_value: purchase.booking_value,
      currency: purchase.currency || "EUR",
      visitor_id: session.visitor_id || visitorId(),
      channel_identifier: session.channel_identifier || null,
      ref: session.ref || null,
      utm_source: session.utm_source || null,
      utm_medium: session.utm_medium || null,
      utm_campaign: session.utm_campaign || null,
      arrival_date: purchase.arrival_date,
      departure_date: purchase.departure_date,
      rooms_count: purchase.rooms_count,
      nights_count: purchase.nights_count,
      raw_payload: { ecommerce: purchase.raw, session: session, page_url: location.href },
    }).then(null, function () {
      delete sent[purchase.transaction_id];
    });
  }

  function onDl(item) {
    var p = extract(item);
    if (p) send(p);
  }

  function bindDl() {
    w.dataLayer = w.dataLayer || [];
    var dl = w.dataLayer,
      push = dl.push,
      i;
    for (i = 0; i < dl.length; i++) onDl(dl[i]);
    dl.push = function () {
      var j;
      for (j = 0; j < arguments.length; j++) onDl(arguments[j]);
      return push.apply(dl, arguments);
    };
  }

  function decorateLinks() {
    var session = readSession();
    if (!session || !(session.ref || session.utm_source)) return;
    var links = d.getElementsByTagName("a"),
      i,
      href,
      url;
    for (i = 0; i < links.length; i++) {
      href = links[i].getAttribute("href");
      if (!href || href.indexOf("onepagebooking.com") === -1) continue;
      try {
        url = new URL(href, location.href);
        ["ref", "utm_source", "utm_medium", "utm_campaign"].forEach(function (k) {
          if (session[k] && !url.searchParams.has(k)) url.searchParams.set(k, session[k]);
        });
        links[i].setAttribute("href", url.toString());
      } catch {}
    }
  }

  var HGAE = {
    __loaded: true,
    config: scriptCfg(),
    init: function (opts) {
      opts = opts || {};
      if (opts.hotelId) HGAE.config.hotelId = opts.hotelId;
      if (opts.apiBase) HGAE.config.apiBase = opts.apiBase;
      capture(false);
      bindDl();
      decorateLinks();
      return HGAE;
    },
    getSession: readSession,
    trackPurchase: function (ecommerce) {
      return send(extract({ event: "purchase", ecommerce: ecommerce }));
    },
  };

  w.HGAE = HGAE;
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", function () {
    HGAE.init();
  });
  else HGAE.init();
})(window, document);
