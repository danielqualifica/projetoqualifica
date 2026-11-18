/* =========================================================
   GeekZone - vitrine: desenha os produtos cadastrados no painel
   (lê do GeekZoneDB, o mesmo "banco" usado pelo admin.html)
========================================================= */
(function () {
  "use strict";

  var grid = document.querySelector(".product-grid");
  var note = document.querySelector(".catalog-note");
  var DB = window.GeekZoneDB;

  if (!grid || !DB) return;

  function formatPrice(value) {
    return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function createCard(p) {
    var card = document.createElement("article");
    card.className = "product-card";
    card.dataset.productName = p.name;
    card.dataset.productKeywords = p.name.toLowerCase();

    var imageBox = document.createElement("div");
    imageBox.className = "product-image";

    var img = document.createElement("img");
    img.src = p.image;
    img.alt = "Capa do jogo " + p.name;
    img.addEventListener("error", function () {
      img.hidden = true;
      imageBox.classList.add("image-missing");
    });
    imageBox.appendChild(img);

    if (p.tag) {
      var tag = document.createElement("span");
      tag.className = "product-tag";
      tag.textContent = p.tag;
      imageBox.appendChild(tag);
    }

    var info = document.createElement("div");
    info.className = "product-info";

    var category = document.createElement("p");
    category.className = "product-category";
    category.textContent = p.category || "Jogo";

    var title = document.createElement("h3");
    title.textContent = p.name;

    var description = document.createElement("p");
    description.className = "product-description";
    description.textContent = p.description || "Confira este jogo na GeekZone.";

    var row = document.createElement("div");
    row.className = "product-buy-row";

    var price = document.createElement("strong");
    price.className = "product-price";
    price.textContent = formatPrice(p.price);

    var button = document.createElement("button");
    button.className = "buy-button";
    button.type = "button";
    button.dataset.productId = p.id;
    button.textContent = "Comprar";

    row.append(price, button);
    info.append(category, title, description, row);
    card.append(imageBox, info);
    return card;
  }

  function render() {
    var products = DB.list();
    var store = window.GeekZoneStore;

    grid.replaceChildren();

    products.forEach(function (p) {
      if (store) store.addProduct({ id: p.id, name: p.name, price: p.price });
      grid.appendChild(createCard(p));
    });

    if (store) {
      // produtos originais excluídos no painel saem também do carrinho
      DB.SEED_IDS.forEach(function (id) {
        if (!products.some(function (p) { return p.id === id; })) store.removeProduct(id);
      });
      store.reloadCart();
    }

    if (!products.length) {
      var empty = document.createElement("p");
      empty.className = "empty-cart";
      empty.textContent = "Nenhum jogo disponível no momento.";
      grid.appendChild(empty);
    }

    if (note) {
      note.textContent = products.length + (products.length === 1 ? " jogo disponível" : " jogos disponíveis");
    }
  }

  render();

  // atualiza se o catálogo mudar em outra aba (ex.: painel admin aberto ao lado)
  window.addEventListener("storage", function (event) {
    if (event.key === DB.KEY) render();
  });
})();
