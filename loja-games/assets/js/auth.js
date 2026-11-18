/* =========================================================
   GeekZone - autenticação do painel (sem Firebase)

   ATENÇÃO: isto roda no navegador, então protege a tela de
   admin contra uso casual, mas NÃO é segurança de verdade.
   Para proteger de fato, a validação precisa ficar num servidor.

   Para trocar a senha: abra login.html, pressione F12, aba Console e rode
     GeekZoneAuth.hash("sua nova senha")
   Copie o resultado e cole em PASS_HASH abaixo.
========================================================= */
(function () {
  "use strict";

  var ADMIN_USER = "danielramalhoqualifica@gmail.com";
  var PASS_HASH = "d4d10ecfca720199ce05d8a0858d860aea30350d0a97ca65bd801467a34eb9c5"; // senha inicial: GeekZone@2026
  var SALT = "geekzone::";

  var SESSION_KEY = "geekzone-admin-session";
  var FAIL_KEY = "geekzone-login-fails";
  var SESSION_MS = 2 * 60 * 60 * 1000; // 2 horas
  var MAX_FAILS = 5;
  var LOCK_MS = 30 * 1000;

  function hash(text) {
    if (!window.crypto || !crypto.subtle) {
      return Promise.reject(new Error("Abra o site por um servidor local (Live Server) ou https para fazer login."));
    }
    var data = new TextEncoder().encode(SALT + text);
    return crypto.subtle.digest("SHA-256", data).then(function (buf) {
      return Array.from(new Uint8Array(buf)).map(function (b) {
        return b.toString(16).padStart(2, "0");
      }).join("");
    });
  }

  function readJSON(storage, key) {
    try { return JSON.parse(storage.getItem(key)); } catch (e) { return null; }
  }

  function isLoggedIn() {
    var s = readJSON(sessionStorage, SESSION_KEY);
    return !!(s && s.user === ADMIN_USER && s.exp > Date.now());
  }

  function lockRemaining() {
    var f = readJSON(localStorage, FAIL_KEY);
    return f && f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 1000) : 0;
  }

  function registerFail() {
    var f = readJSON(localStorage, FAIL_KEY) || { count: 0, until: 0 };
    f.count += 1;
    if (f.count >= MAX_FAILS) { f.count = 0; f.until = Date.now() + LOCK_MS; }
    try { localStorage.setItem(FAIL_KEY, JSON.stringify(f)); } catch (e) {}
  }

  function login(user, password) {
    var wait = lockRemaining();
    if (wait) {
      return Promise.resolve({ ok: false, message: "Muitas tentativas. Aguarde " + wait + "s e tente de novo." });
    }
    return hash(password).then(function (h) {
      var ok = String(user).trim().toLowerCase() === ADMIN_USER.toLowerCase() && h === PASS_HASH;
      if (!ok) {
        registerFail();
        return { ok: false, message: "E-mail ou senha incorretos." };
      }
      try {
        localStorage.removeItem(FAIL_KEY);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user: ADMIN_USER, exp: Date.now() + SESSION_MS }));
      } catch (e) {
        return { ok: false, message: "O navegador bloqueou o armazenamento da sessão." };
      }
      return { ok: true };
    }).catch(function (e) {
      return { ok: false, message: e.message };
    });
  }

  function logout() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  function requireAuth() {
    if (isLoggedIn()) return true;
    window.location.replace("login.html");
    return false;
  }

  try {
    if (localStorage.getItem("loja-games-theme") === "dark") {
      document.documentElement.dataset.theme = "dark";
    }
  } catch (e) {}

  window.GeekZoneAuth = {
    hash: hash, login: login, logout: logout,
    isLoggedIn: isLoggedIn, requireAuth: requireAuth
  };
})();
