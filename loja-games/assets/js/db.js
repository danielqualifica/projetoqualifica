/* =========================================================
   GeekZone - "banco de dados" de produtos (localStorage)
   CRUD: list, get, create, update, remove (+ reset/replaceAll)
========================================================= */
(function () {
  "use strict";

  var KEY = "geekzone-products";

  var SEED = [
    {
      id: "gta-vi",
      name: "GTA VI",
      price: 549.9,
      image: "assets/img/GTAVI.jpg",
      category: "Ação • Mundo aberto",
      tag: "Pré-venda",
      description: "Garanta já na pré-venda o aguardado lançamento da Rockstar Games. Explore o estado de Leonida e mergulhe no maior mundo aberto da franquia."
    },
    {
      id: "watch-dogs-2",
      name: "Watch Dogs 2",
      price: 149.99,
      image: "assets/img/WatchDogs2.jpg",
      category: "Ação • Aventura",
      tag: "",
      description: "Mundo aberto na região da Baía de São Francisco. Hackeie dispositivos da cidade e equipamentos dos inimigos. Multiplayer cooperativo e competitivo."
    },
    {
      id: "assassins-creed-syndicate",
      name: "Assassin's Creed Syndicate",
      price: 89.99,
      image: "assets/img/Assassins Creeds Syndicate.jpg",
      category: "Ação • Histórico",
      tag: "",
      description: "Londres, 1868. Na Revolução Industrial, lidere sua organização secreta e aumente sua influência para combater quem explora os desfavorecidos."
    }
  ];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function save(items) { localStorage.setItem(KEY, JSON.stringify(items)); }

  function list() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw === null) {
        var seed = clone(SEED);
        save(seed);
        return seed;
      }
      var data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return clone(SEED);
    }
  }

  function normalize(d) {
    d = d || {};
    var name = String(d.name || "").trim();
    var image = String(d.image || "").trim();
    var price = Number(String(d.price).replace(",", "."));

    if (!name) return { error: "Informe o nome do produto." };
    if (!isFinite(price) || price <= 0) return { error: "Informe um preço maior que zero." };
    if (!image) return { error: "Informe a imagem (URL ou envio de arquivo)." };

    return {
      value: {
        name: name,
        price: Math.round(price * 100) / 100,
        image: image,
        category: String(d.category || "").trim() || "Jogo",
        tag: String(d.tag || "").trim(),
        description: String(d.description || "").trim()
      }
    };
  }

  function slugify(text) {
    return String(text)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "produto";
  }

  function uniqueId(name, items) {
    var base = slugify(name), id = base, n = 2;
    while (items.some(function (p) { return p.id === id; })) { id = base + "-" + n++; }
    return id;
  }

  function get(id) {
    return list().filter(function (p) { return p.id === id; })[0] || null;
  }

  function create(data) {
    var r = normalize(data);
    if (r.error) throw new Error(r.error);
    var items = list();
    var product = Object.assign({ id: uniqueId(r.value.name, items), createdAt: Date.now() }, r.value);
    items.push(product);
    save(items);
    return product;
  }

  function update(id, data) {
    var r = normalize(data);
    if (r.error) throw new Error(r.error);
    var items = list();
    var i = items.findIndex(function (p) { return p.id === id; });
    if (i === -1) throw new Error("Produto não encontrado.");
    items[i] = Object.assign({}, items[i], r.value, { updatedAt: Date.now() });
    save(items);
    return items[i];
  }

  function remove(id) {
    var items = list();
    var next = items.filter(function (p) { return p.id !== id; });
    if (next.length === items.length) throw new Error("Produto não encontrado.");
    save(next);
  }

  function reset() { save(clone(SEED)); }

  function replaceAll(arr) {
    if (!Array.isArray(arr)) throw new Error("Arquivo inválido: esperado uma lista de produtos.");
    var out = [];
    arr.forEach(function (raw) {
      var r = normalize(raw);
      if (r.error) return;
      var id = raw && typeof raw.id === "string" && raw.id && !out.some(function (p) { return p.id === raw.id; })
        ? raw.id : uniqueId(r.value.name, out);
      out.push(Object.assign({ id: id, createdAt: Date.now() }, r.value));
    });
    if (!out.length) throw new Error("Nenhum produto válido encontrado no arquivo.");
    save(out);
    return out.length;
  }

  window.GeekZoneDB = {
    KEY: KEY,
    SEED_IDS: SEED.map(function (p) { return p.id; }),
    list: list, get: get, create: create, update: update, remove: remove,
    reset: reset, replaceAll: replaceAll
  };
})();
