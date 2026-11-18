/* =========================================================
   GeekZone - painel administrativo (CRUD de produtos)
========================================================= */
(function () {
  "use strict";

  if (!GeekZoneAuth.requireAuth()) return;

  var DB = window.GeekZoneDB;
  var $ = function (id) { return document.getElementById(id); };

  var el = {
    tabLista: $("tab-lista"), tabForm: $("tab-form"),
    panelLista: $("panel-lista"), panelForm: $("panel-form"),
    list: $("productList"), search: $("searchInput"), count: $("countLabel"),
    form: $("productForm"), name: $("productName"), price: $("productPrice"),
    category: $("productCategory"), tag: $("productTag"), image: $("productImage"),
    file: $("productFile"), preview: $("imagePreview"), description: $("productDescription"),
    status: $("formStatus"), submit: $("productSubmit"), cancel: $("cancelEdit"), banner: $("editBanner"),
    dialog: $("confirmDialog"), dialogTitle: $("confirmTitle"), dialogText: $("confirmText"), dialogOk: $("confirmOk"),
    toast: $("toast"), importInput: $("importInput")
  };

  var editingId = null;
  var currentImage = "";
  var toastTimer = null;

  /* ---------- utilidades ---------- */

  function money(v) {
    return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.classList.remove("show"); }, 2600);
  }

  function setStatus(msg, type) {
    el.status.textContent = msg || "";
    el.status.className = "adm-status" + (type ? " " + type : "");
  }

  function friendlyError(e) {
    if (e && (e.name === "QuotaExceededError" || e.code === 22)) {
      return "Armazenamento do navegador cheio. Use imagens menores ou links (URL).";
    }
    return (e && e.message) || "Não foi possível concluir a operação.";
  }

  function confirmDialog(title, text, okLabel) {
    return new Promise(function (resolve) {
      el.dialogTitle.textContent = title;
      el.dialogText.textContent = text;
      el.dialogOk.textContent = okLabel || "Confirmar";
      el.dialog.returnValue = "";
      el.dialog.addEventListener("close", function handler() {
        el.dialog.removeEventListener("close", handler);
        resolve(el.dialog.returnValue === "ok");
      });
      el.dialog.showModal();
    });
  }

  /* ---------- abas ---------- */

  function showTab(name) {
    var isForm = name === "form";
    el.tabLista.setAttribute("aria-selected", String(!isForm));
    el.tabForm.setAttribute("aria-selected", String(isForm));
    el.panelLista.hidden = isForm;
    el.panelForm.hidden = !isForm;
    if (isForm) el.name.focus();
  }

  el.tabLista.addEventListener("click", function () { showTab("lista"); });
  el.tabForm.addEventListener("click", function () { showTab("form"); });

  /* ---------- READ: lista ---------- */

  function thumb(src) {
    var img = document.createElement("img");
    img.className = "adm-thumb";
    img.alt = "";
    img.loading = "lazy";
    img.src = src;
    img.addEventListener("error", function () {
      var ph = document.createElement("div");
      ph.className = "adm-thumb missing";
      ph.textContent = "🎮";
      img.replaceWith(ph);
    });
    return img;
  }

  function renderList() {
    var term = el.search.value.trim().toLowerCase();
    var all = DB.list();
    var items = all.filter(function (p) {
      return !term || (p.name + " " + (p.category || "")).toLowerCase().indexOf(term) !== -1;
    });

    el.count.textContent = items.length + (items.length === 1 ? " produto" : " produtos") +
      (term ? " (de " + all.length + ")" : "");

    el.list.replaceChildren();

    if (!items.length) {
      var empty = document.createElement("p");
      empty.className = "adm-empty";
      empty.textContent = all.length ? "Nenhum produto encontrado para essa busca." : "Nenhum produto cadastrado ainda. Use a aba “Cadastrar produto”.";
      el.list.appendChild(empty);
      return;
    }

    items.forEach(function (p) {
      var row = document.createElement("div");
      row.className = "adm-row";

      var info = document.createElement("div");
      info.className = "info";
      var name = document.createElement("strong");
      name.textContent = p.name;
      var meta = document.createElement("span");
      meta.textContent = (p.category || "Jogo") + (p.tag ? " · " + p.tag : "");
      info.append(name, meta);

      var price = document.createElement("div");
      price.className = "price";
      price.textContent = money(p.price);

      var actions = document.createElement("div");
      actions.className = "row-actions";

      var edit = document.createElement("button");
      edit.type = "button";
      edit.className = "adm-btn small";
      edit.textContent = "Editar";
      edit.addEventListener("click", function () { startEdit(p.id); });

      var del = document.createElement("button");
      del.type = "button";
      del.className = "adm-btn small danger";
      del.textContent = "Excluir";
      del.addEventListener("click", function () { removeProduct(p); });

      actions.append(edit, del);
      row.append(thumb(p.image), info, price, actions);
      el.list.appendChild(row);
    });
  }

  el.search.addEventListener("input", renderList);

  /* ---------- imagem: preview e upload ---------- */

  function updatePreview() {
    el.preview.replaceChildren();
    if (!currentImage) {
      el.preview.textContent = "Sem imagem";
      return;
    }
    var img = document.createElement("img");
    img.alt = "Pré-visualização da imagem";
    img.src = currentImage;
    img.addEventListener("error", function () {
      el.preview.replaceChildren(document.createTextNode("Não foi possível carregar a imagem"));
    });
    el.preview.appendChild(img);
  }

  el.image.addEventListener("input", function () {
    currentImage = el.image.value.trim();
    updatePreview();
  });

  el.file.addEventListener("change", function () {
    var file = el.file.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      setStatus("Escolha um arquivo de imagem.", "error");
      el.file.value = "";
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 640;
        var scale = Math.min(1, max / Math.max(img.width, img.height));
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        currentImage = canvas.toDataURL("image/jpeg", 0.82);
        el.image.value = "";
        el.image.placeholder = "(imagem enviada do computador)";
        updatePreview();
        setStatus("");
      };
      img.onerror = function () { setStatus("Não foi possível ler essa imagem.", "error"); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  /* ---------- CREATE / UPDATE: formulário ---------- */

  function resetForm() {
    editingId = null;
    currentImage = "";
    el.form.reset();
    el.image.placeholder = "https://... ou assets/img/jogo.jpg";
    el.banner.hidden = true;
    el.cancel.hidden = true;
    el.submit.textContent = "Cadastrar produto";
    el.tabForm.textContent = "Cadastrar produto";
    setStatus("");
    updatePreview();
  }

  function startEdit(id) {
    var p = DB.get(id);
    if (!p) { toast("Produto não encontrado."); renderList(); return; }
    resetForm();
    editingId = id;
    el.name.value = p.name;
    el.price.value = p.price;
    el.category.value = p.category || "";
    el.tag.value = p.tag || "";
    el.description.value = p.description || "";
    currentImage = p.image;
    if (/^data:/.test(p.image)) {
      el.image.placeholder = "(imagem enviada do computador)";
    } else {
      el.image.value = p.image;
    }
    el.banner.textContent = "Editando: " + p.name;
    el.banner.hidden = false;
    el.cancel.hidden = false;
    el.submit.textContent = "Salvar alterações";
    el.tabForm.textContent = "Editar produto";
    updatePreview();
    showTab("form");
  }

  el.cancel.addEventListener("click", function () {
    resetForm();
    showTab("lista");
  });

  el.form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = {
      name: el.name.value,
      price: el.price.value,
      category: el.category.value,
      tag: el.tag.value,
      image: currentImage,
      description: el.description.value
    };

    try {
      if (editingId) {
        DB.update(editingId, data);
        toast("Produto atualizado!");
      } else {
        DB.create(data);
        toast("Produto cadastrado!");
      }
      resetForm();
      renderList();
      showTab("lista");
    } catch (e) {
      setStatus(friendlyError(e), "error");
    }
  });

  /* ---------- DELETE ---------- */

  function removeProduct(p) {
    confirmDialog("Excluir produto?", "“" + p.name + "” será removido da loja. Essa ação não pode ser desfeita.", "Excluir")
      .then(function (ok) {
        if (!ok) return;
        try {
          DB.remove(p.id);
          if (editingId === p.id) resetForm();
          renderList();
          toast("Produto excluído.");
        } catch (e) {
          toast(friendlyError(e));
        }
      });
  }

  /* ---------- backup: exportar / importar / restaurar ---------- */

  $("exportButton").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(DB.list(), null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "geekzone-produtos.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  $("importButton").addEventListener("click", function () { el.importInput.click(); });

  el.importInput.addEventListener("change", function () {
    var file = el.importInput.files[0];
    el.importInput.value = "";
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try { parsed = JSON.parse(reader.result); } catch (e) { toast("Arquivo JSON inválido."); return; }
      confirmDialog("Importar produtos?", "Os produtos atuais serão substituídos pelos do arquivo.", "Importar").then(function (ok) {
        if (!ok) return;
        try {
          var n = DB.replaceAll(parsed);
          resetForm();
          renderList();
          toast(n + (n === 1 ? " produto importado." : " produtos importados."));
        } catch (e) {
          toast(friendlyError(e));
        }
      });
    };
    reader.readAsText(file);
  });

  $("resetButton").addEventListener("click", function () {
    confirmDialog("Restaurar padrão?", "Todos os produtos atuais serão apagados e os 3 jogos originais voltam à loja.", "Restaurar")
      .then(function (ok) {
        if (!ok) return;
        try {
          DB.reset();
          resetForm();
          renderList();
          toast("Catálogo restaurado.");
        } catch (e) {
          toast(friendlyError(e));
        }
      });
  });

  /* ---------- sair ---------- */

  $("logoutButton").addEventListener("click", function () {
    GeekZoneAuth.logout();
    window.location.replace("login.html");
  });

  /* ---------- início ---------- */

  renderList();
  updatePreview();
})();
