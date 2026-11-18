/* =========================================================
   PRODUTOS
========================================================= */

const PRODUCTS = {

  "gta-vi": {
    id: "gta-vi",
    name: "GTA VI (Pré-venda)",
    price: 549.90
  },

  "watch-dogs-2": {
    id: "watch-dogs-2",
    name: "Watch Dogs 2",
    price: 149.99
  },

  "assassins-creed-syndicate": {
    id: "assassins-creed-syndicate",
    name: "Assassin's Creed Syndicate",
    price: 89.99
  }

};

function registerProduct(product) {
  if (
    !product ||
    !product.id ||
    !product.name ||
    !Number.isFinite(Number(product.price))
  ) {
    return;
  }

  PRODUCTS[product.id] = {
    id: String(product.id),
    name: String(product.name),
    price: Number(product.price)
  };
}

window.GeekZoneStore = {
  addProduct(product) {
    registerProduct(product);
  },

  reloadCart() {
    cart = loadCart();
    renderCart();
  },

  removeProduct(id) {
    delete PRODUCTS[id];
  },

  refreshProducts() {
    renderCart();
  }
};



/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const CART_STORAGE_KEY = "loja-games-cart";
const THEME_STORAGE_KEY = "loja-games-theme";

const MODEL_URL = "./assets/js/my_model/";

const IMAGE_CONFIDENCE_THRESHOLD = 0.85;

const currency = new Intl.NumberFormat(
  "pt-BR",
  {
    style: "currency",
    currency: "BRL"
  }
);


/* =========================================================
   ELEMENTOS
========================================================= */

const elements = {

  themeToggle:
    document.querySelector("#theme-toggle"),

  cartToggle:
    document.querySelector("#cart-toggle"),

  cartPanel:
    document.querySelector("#cart-panel"),

  cartBackdrop:
    document.querySelector("#cart-backdrop"),

  closeCart:
    document.querySelector("#close-cart"),

  cartItems:
    document.querySelector("#cart-items"),

  cartCount:
    document.querySelector("#cart-count"),

  subtotal:
    document.querySelector("#cart-subtotal"),

  total:
    document.querySelector("#cart-total"),

  checkout:
    document.querySelector("#checkout-button"),

  toast:
    document.querySelector("#toast"),

  imageInput:
    document.querySelector("#imageInput"),

  chatBody:
    document.querySelector("#chatBody"),

  chatBox:
    document.querySelector("#chatBox"),

  chatOpenButton:
    document.querySelector("#btnOpenChat")

};


/* =========================================================
   ESTADO
========================================================= */

let cart = loadCart();

let toastTimeout = null;

let imageModel = null;
let currentFreight = 0;


const CUSTOMER_CEP_STORAGE_KEY =
  "geekzone-customer-cep";

let customerCep = loadCustomerCep();




/* =========================================================
   CARRINHO
========================================================= */

function loadCart() {

  try {

    const saved = JSON.parse(
      localStorage.getItem(CART_STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(saved)) {
      return [];
    }

    return saved
      .filter(item =>
        PRODUCTS[item.id] &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
      )
      .map(item => ({
        id: item.id,
        quantity: item.quantity
      }));

  } catch {

    return [];

  }

}


function saveCart() {

  try {

    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(cart)
    );

  } catch {

    /* Continua funcionando sem localStorage */

  }

}


function formatPrice(value) {

  return currency.format(value);

}

/* =========================================================
   CEP DO CLIENTE
========================================================= */

function loadCustomerCep() {

  try {

    return localStorage.getItem(
      CUSTOMER_CEP_STORAGE_KEY
    ) || "";

  } catch {

    return "";

  }

}


function saveCustomerCep(cep) {

  customerCep = cep;

  try {

    localStorage.setItem(
      CUSTOMER_CEP_STORAGE_KEY,
      cep
    );

  } catch {

    // Continua funcionando sem armazenamento

  }

}


function normalizeCep(value) {

  return String(value)
    .replace(/\D/g, "")
    .slice(0, 8);

}


function formatCep(cep) {

  const cleanCep =
    normalizeCep(cep);

  if (cleanCep.length !== 8) {
    return cleanCep;
  }

  return cleanCep.replace(
    /^(\d{5})(\d{3})$/,
    "$1-$2"
  );

}


function requestCustomerCep() {

  const enteredCep =
    window.prompt(
      "Para adicionar o produto ao carrinho, informe seu CEP:"
    );

  if (enteredCep === null) {
    return false;
  }

  const cleanCep =
    normalizeCep(enteredCep);

  if (cleanCep.length !== 8) {

    window.alert(
      "CEP inválido. Digite um CEP com 8 números."
    );

    return false;
  }

  saveCustomerCep(cleanCep);

  return true;

}




function renderCart()



{

  const totalItems = cart.reduce(
    (sum, item) =>
      sum + item.quantity,
    0
  );


  const productsTotal = cart.reduce(
    (sum, item) =>
      sum +
      PRODUCTS[item.id].price *
      item.quantity,
    0
  );

  const total =
    productsTotal + currentFreight;


  elements.cartCount.textContent =
    totalItems;


  elements.cartCount.setAttribute(
    "aria-label",
    `${totalItems} ${
      totalItems === 1
        ? "item"
        : "itens"
    }`
  );


  elements.subtotal.textContent =
    formatPrice(productsTotal);


  elements.total.textContent =
    formatPrice(total);


  elements.checkout.disabled =
    cart.length === 0;


  if (cart.length === 0) {

    elements.cartItems.innerHTML =
      `
        <p class="empty-cart">
          Seu carrinho está vazio.
          Que tal escolher um jogo?
        </p>
      `;

    return;

  }


  elements.cartItems.innerHTML =
    cart.map(item => {

      const product =
        PRODUCTS[item.id];

      return `

        <article
          class="cart-item"
          data-cart-id="${product.id}">

          <div>

            <h3>
              ${product.name}
            </h3>

            <div class="cart-item-price">
              ${formatPrice(product.price)} cada
            </div>

            <div class="cart-item-total">
              Subtotal:
              ${formatPrice(
                product.price *
                item.quantity
              )}
            </div>

          </div>


          <div
            class="cart-item-actions"
            aria-label="Quantidade de ${product.name}">

            <button
              class="quantity-button"
              type="button"
              data-action="decrease"
              aria-label="Diminuir quantidade">

              −

            </button>


            <span class="quantity-value">
              ${item.quantity}
            </span>


            <button
              class="quantity-button"
              type="button"
              data-action="increase"
              aria-label="Aumentar quantidade">

              +

            </button>


            <button
              class="remove-button"
              type="button"
              data-action="remove"
              aria-label="Remover ${product.name}">

              ✕

            </button>

          </div>

        </article>

      `;

    }).join("");

}


async function addToCart(productId) {

  if (!PRODUCTS[productId]) {
    return;
  }

  const enteredAddress = window.prompt(
    "Informe seu endereço completo para calcular o frete:\n\n" +
    "Exemplo: Rua das Flores, 100, Centro, Lorena - SP"
  );

  if (enteredAddress === null) {
    showToast("Produto não adicionado.");
    return;
  }

  const address = enteredAddress.trim();

  if (!address) {
    showToast("Informe um endereço válido.");
    return;
  }

  showToast("Calculando o frete...");

  try {
    const delivery = await window.GeekZoneFreight.validateDelivery(address);

    if (!delivery.success) {
      appendMessage(delivery.message, "bot");
      showToast("Não foi possível adicionar o produto.");
      return;
    }

    currentFreight = delivery.freight;

    const existing = cart.find(item => item.id === productId);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: productId, quantity: 1 });
    }

    saveCart();
    renderCart();

    const productsTotal = cart.reduce((sum, item) => {
      return sum + PRODUCTS[item.id].price * item.quantity;
    }, 0);

    const finalTotal = productsTotal + delivery.freight;

    appendMessage(
      "Produto adicionado ao carrinho!<br><br>" +
      `<strong>Endereço:</strong> ${delivery.address}<br>` +
      `<strong>Distância:</strong> ${delivery.distance.toFixed(1)} km<br>` +
      `<strong>Frete:</strong> ${formatPrice(delivery.freight)}<br>` +
      `<strong>Total dos produtos:</strong> ${formatPrice(productsTotal)}<br>` +
      `<strong>Total com frete:</strong> ${formatPrice(finalTotal)}`,
      "bot"
    );

    showToast(`${PRODUCTS[productId].name} adicionado ao carrinho!`);

  } catch (error) {
    console.error("Erro ao calcular o frete:", error);
    appendMessage(
      "Não foi possível calcular o frete. Verifique sua conexão e tente novamente.",
      "bot"
    );
  }

}


function updateQuantity(
  productId,
  change
) {

  const item =
    cart.find(
      entry => entry.id === productId
    );


  if (!item) {
    return;
  }


  item.quantity += change;


  if (item.quantity <= 0) {

    cart =
      cart.filter(
        entry =>
          entry.id !== productId
      );

  }


  saveCart();

  renderCart();

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

  elements.toast.textContent =
    message;

  elements.toast.classList.add(
    "is-visible"
  );


  clearTimeout(toastTimeout);


  toastTimeout =
    setTimeout(() => {

      elements.toast.classList.remove(
        "is-visible"
      );

    }, 2600);

}


/* =========================================================
   CARRINHO ABRIR / FECHAR
========================================================= */

function openCart() {

  elements.cartPanel.classList.add(
    "is-open"
  );

  elements.cartPanel.setAttribute(
    "aria-hidden",
    "false"
  );

  elements.cartPanel.removeAttribute(
    "inert"
  );

  elements.cartToggle.setAttribute(
    "aria-expanded",
    "true"
  );

  elements.cartBackdrop.hidden =
    false;

  elements.closeCart.focus();

}


function closeCart() {

  elements.cartPanel.classList.remove(
    "is-open"
  );

  elements.cartPanel.setAttribute(
    "aria-hidden",
    "true"
  );

  elements.cartPanel.setAttribute(
    "inert",
    ""
  );

  elements.cartToggle.setAttribute(
    "aria-expanded",
    "false"
  );

  elements.cartBackdrop.hidden =
    true;

  elements.cartToggle.focus();

}


/* =========================================================
   TEMA
========================================================= */

function applyTheme(theme) {

  const isDark =
    theme === "dark";


  document.documentElement.dataset.theme =
    isDark
      ? "dark"
      : "light";


  elements.themeToggle.setAttribute(
    "aria-pressed",
    String(isDark)
  );


  elements.themeToggle.setAttribute(
    "aria-label",
    isDark
      ? "Ativar modo claro"
      : "Ativar modo escuro"
  );


  elements.themeToggle
    .querySelector(".theme-icon")
    .textContent =
      isDark
        ? "☀"
        : "☾";


  elements.themeToggle
    .querySelector(".button-label")
    .textContent =
      isDark
        ? "Modo claro"
        : "Modo escuro";

}


function initializeTheme() {

  let savedTheme;


  try {

    savedTheme =
      localStorage.getItem(
        THEME_STORAGE_KEY
      );

  } catch {

    savedTheme = null;

  }


  const preferredTheme =
    window.matchMedia?.(
      "(prefers-color-scheme: dark)"
    ).matches
      ? "dark"
      : "light";


  applyTheme(
    savedTheme === "dark" ||
    savedTheme === "light"
      ? savedTheme
      : preferredTheme
  );

}


/* =========================================================
   CHATBOT
========================================================= */

function toggleChat() {

  const isOpen =
    elements.chatBox.style.display === "flex";


  if (isOpen) {

    elements.chatBox.style.display =
      "none";

    elements.chatOpenButton.style.display =
      "block";

  } else {

    elements.chatBox.style.display =
      "flex";

    elements.chatOpenButton.style.display =
      "none";

    setTimeout(() => {

      document
        .getElementById("userInput")
        ?.focus();

    }, 50);

  }

}


/* =========================================================
   TECLADO DO CHAT
========================================================= */

function handleKeyPress(event) {

  if (event.key === "Enter") {

    event.preventDefault();

    sendMessage();

  }

}


/* =========================================================
   ENVIO DE MENSAGEM
========================================================= */

async function sendMessage() {

  const input =
    document.getElementById("userInput");

  const text =
    input.value.trim();

  if (!text) {
    return;
  }

  /*
    Mostra a mensagem do cliente
    dentro do chatbot.
  */

  appendMessage(
    text,
    "user"
  );

  input.value = "";

  /*
    Verifica se a mensagem é sobre
    frete ou endereço.

    Se for, o módulo de frete
    assume o controle.
  */

  if (window.GeekZoneFreight) {

    const freightWasHandled =
      await window.GeekZoneFreight.handleMessage(
        text
      );

    /*
      Se a mensagem foi usada pelo
      cálculo de frete, não continua
      para a resposta normal.
    */

    if (freightWasHandled) {
      return;
    }

  }

  /*
    Respostas normais do chatbot.
    Desconto, compra e outras dúvidas
    continuam funcionando normalmente.
  */

  setTimeout(() => {

    const response =
      processarMensagemInteligente(
        text
      );

    appendMessage(
      response,
      "bot"
    );

  }, 500);

}



/* =========================================================
   INTELIGÊNCIA DO CHAT
========================================================= */

function processarMensagemInteligente(
  textoDoUsuario
) {

  const texto =
    removerAcentos(
      textoDoUsuario.toLowerCase()
    );


  /* DESCONTO */

  const palavrasDesconto = [
    "desconto",
    "cupom",
    "barato",
    "mais barato",
    "reduzir",
    "promocao",
    "abaixar",
    "abater",
    "oferta"
  ];


  if (
    palavrasDesconto.some(
      palavra =>
        texto.includes(palavra)
    )
  ) {

    return `
      Sim! Nós oferecemos
      <strong>10% de desconto</strong>
      na sua primeira compra utilizando
      o cupom <strong>BEMVINDO</strong>
      no carrinho.
    `;

  }


  /* FRETE */

  const palavrasFrete = [
    "frete",
    "entrega",
    "envio",
    "receber",
    "chegar",
    "taxa",
    "correios",
    "transportadora"
  ];


  if (
    palavrasFrete.some(
      palavra =>
        texto.includes(palavra)
    )
  ) {

    return `
      O frete é
      <strong>grátis</strong>
      para compras acima de
      R$ 199,00!
      Para valores abaixo,
      o cálculo exato aparece
      no seu carrinho ao digitar o CEP.
    `;

  }


  /* COMPRAR */

  const palavrasComprar = [
    "comprar",
    "pedido",
    "pagar",
    "pagamento",
    "finalizar",
    "adquirir",
    "passo",
    "como faco",
    "carrinho"
  ];


  if (
    palavrasComprar.some(
      palavra =>
        texto.includes(palavra)
    )
  ) {

    return `
      Para comprar é muito simples:
      escolha o produto,
      clique em <strong>"Comprar"</strong>,
      vá para o carrinho e siga
      as instruções de pagamento.
      Se precisar de ajuda,
      é só me chamar!
    `;

  }


  return `
    Entendi sua dúvida!
    No momento consigo te ajudar com
    informações sobre
    <strong>frete</strong>,
    <strong>desconto</strong>
    ou
    <strong>como comprar</strong>.
    Pode perguntar sobre um desses temas!
  `;

}


/* =========================================================
   ADICIONAR MENSAGEM AO CHAT
========================================================= */

function appendMessage(
  text,
  sender
) {

  const msgDiv =
    document.createElement(
      "div"
    );


  msgDiv.classList.add(
    "chat-message",
    sender
  );


  msgDiv.innerHTML =
    text;


  elements.chatBody.appendChild(
    msgDiv
  );


  elements.chatBody.scrollTop =
    elements.chatBody.scrollHeight;

}


/* =========================================================
   RECONHECIMENTO DE IMAGEM
========================================================= */

/*
  Carrega o modelo apenas quando
  o usuário realmente escolher uma imagem.
*/

async function carregarModeloImagem() {

  if (!imageModel) {

    imageModel =
      await tmImage.load(
        MODEL_URL + "model.json",
        MODEL_URL + "metadata.json"
      );

  }


  return imageModel;

}

/* =========================================================
   BOTÃO DE UPLOAD DE IMAGEM
========================================================= */

const imageSearchButtons = document.querySelectorAll(
  "#imageSearchButton, #imageSearchPanelButton"
);


imageSearchButtons.forEach(button => {

  button.addEventListener("click", () => {

    elements.imageInput?.click();

  });

});

/* =========================================================
   SELEÇÃO DA IMAGEM
========================================================= */

if (elements.imageInput) {

  elements.imageInput.addEventListener(
    "change",
    async function () {

      const file =
        this.files[0];


      if (!file) {
        return;
      }


      /*
        Verifica se é realmente uma imagem.
      */

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        appendMessage(
          "Por favor, selecione um arquivo de imagem válido.",
          "bot"
        );

        this.value = "";

        return;

      }


      /*
        Mostra a imagem enviada
        dentro do chatbot.
      */

      const imageURL =
        URL.createObjectURL(
          file
        );


      appendMessage(
        `
          <div class="image-result">

            <img
              src="${imageURL}"
              alt="Imagem enviada para identificação">

            <div class="image-result-info">

              <div class="image-result-name">
                Imagem enviada
              </div>

              <div class="image-result-confidence">
                Analisando...
              </div>

            </div>

          </div>
        `,
        "user"
      );


      /*
        Mensagem temporária da IA.
      */

      const resposta =
        document.createElement(
          "div"
        );


      resposta.className =
        "chat-message bot";


      resposta.innerHTML =
        "🔎 Analisando a imagem...";


      elements.chatBody.appendChild(
        resposta
      );


      scrollChatToBottom();


      try {

        const model =
          await carregarModeloImagem();


        const imagem =
          await carregarImagem(
            file
          );


        const predictions =
          await model.predict(
            imagem
          );


        /*
          Encontra a classe
          com maior probabilidade.
        */

        const resultado =
          predictions.reduce(
            (melhor, atual) => {

              return atual.probability >
                melhor.probability
                ? atual
                : melhor;

            }
          );


        const confianca =
          resultado.probability *
          100;


        /*
          Resultado abaixo de 85%.
        */

        if (
          resultado.probability <
          IMAGE_CONFIDENCE_THRESHOLD
        ) {

          resposta.innerHTML = `

            Não consegui identificar
            o produto com segurança.

            <br><br>

            Resultado mais provável:
            <strong>
              ${resultado.className}
            </strong>

            <br>

            Confiança:
            ${confianca.toFixed(1)}%

            <br><br>

            Tente enviar uma imagem
            mais nítida.

          `;

          scrollChatToBottom();

          return;

        }


        /*
          Converte a classe do modelo
          em um produto do site.
        */

        const productId =
          encontrarProdutoPorClasse(
            resultado.className
          );


        /*
          Se encontrou o produto.
        */

        if (productId) {

          const produto =
            PRODUCTS[productId];


          resposta.innerHTML = `

            Identifiquei:

            <strong>
              ${produto.name}
            </strong>

            <br>

            Confiança:
            ${confianca.toFixed(1)}%

            <br><br>

            🎮 Encontrei esse jogo
            na nossa loja.

            <br><br>

            <strong>${formatPrice(produto.price)}</strong>

            <br><br>

            O produto foi destacado
            na vitrine para você.

            <br><br>

            <button
              type="button"
              class="image-offer-button"
              data-product-id="${productId}">
              Quero esse jogo
            </button>

          `;


          /*
            Destaca o card
            correspondente.
          */

          destacarProduto(
            productId
          );


          /*
            Mensagem interna
            de resultado.
          */

          showToast(
            `Produto identificado: ${produto.name}`
          );

        } else {

          /*
            O modelo reconheceu
            alguma classe, mas
            ela não está cadastrada
            no catálogo.
          */

          resposta.innerHTML = `

            Identifiquei:

            <strong>
              ${resultado.className}
            </strong>

            <br>

            Confiança:
            ${confianca.toFixed(1)}%

            <br><br>

            Porém, esse item ainda
            não está cadastrado
            na nossa vitrine.

          `;

        }

      } catch (error) {

        console.error(
          "Erro ao analisar imagem:",
          error
        );


        resposta.innerHTML = `

          ❌ Não consegui analisar
          essa imagem.

          <br><br>

          Verifique se a pasta
          <strong>my_model</strong>
          contém os arquivos:

          <br>

          model.json<br>
          metadata.json<br>
          arquivos .bin

        `;

      }


      scrollChatToBottom();


      /*
        Permite selecionar
        a mesma imagem novamente.
      */

      this.value = "";

    }
  );

}


/* =========================================================
   CARREGAR IMAGEM
========================================================= */

function carregarImagem(file) {

  return new Promise(
    (resolve, reject) => {

      const leitor =
        new FileReader();


      leitor.onload =
        function (evento) {

          const imagem =
            new Image();


          imagem.onload =
            function () {

              resolve(
                imagem
              );

            };


          imagem.onerror =
            reject;


          imagem.src =
            evento.target.result;

        };


      leitor.onerror =
        reject;


      leitor.readAsDataURL(
        file
      );

    }
  );

}


/* =========================================================
   NORMALIZAÇÃO DE TEXTO
========================================================= */

function removerAcentos(texto) {

  return texto
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );

}


/* =========================================================
   RELAÇÃO ENTRE A CLASSE DA IA
   E O PRODUTO DO SITE
========================================================= */

function encontrarProdutoPorClasse(
  classe
) {

  const texto =
    removerAcentos(
      classe.toLowerCase()
    );


  /*
    GTA VI
  */

  if (
    texto.includes("gta") ||
    texto.includes("grand theft auto")
  ) {

    return "gta-vi";

  }


  /*
    Watch Dogs 2
  */

  if (
    texto.includes("watch dogs") ||
    texto.includes("watchdogs")
  ) {

    return "watch-dogs-2";

  }


  /*
    Assassin's Creed Syndicate
  */

  if (
    texto.includes("assassin") ||
    texto.includes("creed") ||
    texto.includes("syndicate")
  ) {

    return "assassins-creed-syndicate";

  }


  return null;

}


/* =========================================================
   DESTACAR PRODUTO ENCONTRADO
========================================================= */

function destacarProduto(
  productId
) {

  /*
    Remove destaque anterior.
  */

  document
    .querySelectorAll(
      ".product-card.image-found"
    )
    .forEach(card => {

      card.classList.remove(
        "image-found"
      );

    });


  /*
    Procura o card.
  */

  const buyButton =
    document.querySelector(
      `.buy-button[data-product-id="${productId}"]`
    );

  const card =
    buyButton?.closest(".product-card");


  if (!card) {
    return;
  }


  /*
    Adiciona destaque.
  */

  card.classList.add(
    "image-found"
  );


  /*
    Rola a página até o produto.
  */

  card.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });


  /*
    Remove o destaque depois
    de alguns segundos.
  */

  setTimeout(() => {

    card.classList.remove(
      "image-found"
    );

  }, 5000);

}


/* =========================================================
   OFERTA DO PRODUTO IDENTIFICADO
========================================================= */

elements.chatBody.addEventListener(
  "click",
  event => {

    const offerButton =
      event.target.closest(".image-offer-button");

    if (!offerButton) {
      return;
    }

    const productId =
      offerButton.dataset.productId;

    if (productId) {
      addToCart(productId);
    }

  }
);


/* =========================================================
   EVENTOS DO CARRINHO
========================================================= */

document.addEventListener("click", (event) => {
  const button = event.target.closest(".buy-button");

  if (!button) {
    return;
  }

  const productId = button.dataset.productId;

  if (productId) {
    addToCart(productId);
  }
});



elements.cartItems.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "button[data-action]"
      );


    if (!button) {
      return;
    }


    const productId =
      button
        .closest("[data-cart-id]")
        ?.dataset.cartId;


    if (!productId) {
      return;
    }


    if (
      button.dataset.action ===
      "increase"
    ) {

      updateQuantity(
        productId,
        1
      );

    }


    if (
      button.dataset.action ===
      "decrease"
    ) {

      updateQuantity(
        productId,
        -1
      );

    }


    if (
      button.dataset.action ===
      "remove"
    ) {

      cart =
        cart.filter(
          item =>
            item.id !== productId
        );


      saveCart();

      renderCart();


      showToast(
        "Produto removido do carrinho."
      );

    }

  });


/* =========================================================
   EVENTOS GERAIS
========================================================= */

elements.cartToggle.addEventListener(
  "click",
  openCart
);


elements.closeCart.addEventListener(
  "click",
  closeCart
);


elements.cartBackdrop.addEventListener(
  "click",
  closeCart
);


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      elements.cartPanel.classList.contains(
        "is-open"
      )
    ) {

      closeCart();

    }

  }
);


elements.themeToggle.addEventListener(
  "click",
  () => {

    const nextTheme =
      document.documentElement.dataset.theme ===
      "dark"
        ? "light"
        : "dark";


    applyTheme(
      nextTheme
    );


    try {

      localStorage.setItem(
        THEME_STORAGE_KEY,
        nextTheme
      );

    } catch {

      /* Sem armazenamento */

    }

  }
);


elements.checkout.addEventListener(
  "click",
  () => {

    if (cart.length === 0) {
      return;
    }


    showToast(
      "Carrinho validado! Integre um meio de pagamento para concluir o pedido."
    );

  }
);


/* =========================================================
   UTILITÁRIOS
========================================================= */

function scrollChatToBottom() {

  elements.chatBody.scrollTop =
    elements.chatBody.scrollHeight;

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document
  .querySelector("#current-year")
  .textContent =
    new Date().getFullYear();


initializeTheme();

renderCart();


/*aaaaaaaaaaaaaaaaaaaaaaaaaaaaa*/

/* =========================================================
   CÁLCULO DE FRETE DO CHATBOT
========================================================= */

window.GeekZoneFreight = (() => {
  const STORE_ADDRESS = "Guaratinguetá, São Paulo, Brasil";
  const STORE_LATITUDE = -22.8166;
  const STORE_LONGITUDE = -45.1911;

  const PRICE_PER_KM = 4;
  const MAX_DISTANCE_KM = 100;

  let waitingForAddress = false;

  function addBotMessage(message) {
    const chatBody = document.getElementById("chatBody");

    if (!chatBody) {
      console.error("Elemento #chatBody não foi encontrado.");
      return;
    }

    const messageElement = document.createElement("div");

    messageElement.className = "chat-message bot";
    messageElement.innerHTML = message;

    chatBody.appendChild(messageElement);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function isFreightQuestion(text) {
    const normalizedText = normalizeText(text);

    const keywords = [
      "frete",
      "entrega",
      "entregar",
      "motoboy",
      "taxa de entrega",
      "valor da entrega",
      "calcular entrega",
      "calcular frete"
    ];

    return keywords.some((keyword) => {
      return normalizedText.includes(keyword);
    });
  }

  function parseBrazilianMoney(value) {
    if (!value) {
      return 0;
    }

    const cleanedValue = value
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");

    const number = Number(cleanedValue);

    return Number.isFinite(number) ? number : 0;
  }

  function getCartTotal() {
    /*
      O código tenta encontrar o total no elemento #cart-total.
      Esse elemento já existe no seu HTML.
    */

    const cartTotalElement = document.getElementById("cart-total");

    if (!cartTotalElement) {
      return 0;
    }

    return parseBrazilianMoney(cartTotalElement.textContent);
  }

  function formatBrazilianMoney(value) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function calculateDistanceInKm(
    latitude1,
    longitude1,
    latitude2,
    longitude2
  ) {
    const earthRadiusKm = 6371;

    const latitudeDifference = (
      (latitude2 - latitude1) *
      Math.PI
    ) / 180;

    const longitudeDifference = (
      (longitude2 - longitude1) *
      Math.PI
    ) / 180;

    const firstLatitude = (latitude1 * Math.PI) / 180;
    const secondLatitude = (latitude2 * Math.PI) / 180;

    const haversine =
      Math.sin(latitudeDifference / 2) *
        Math.sin(latitudeDifference / 2) +
      Math.cos(firstLatitude) *
        Math.cos(secondLatitude) *
        Math.sin(longitudeDifference / 2) *
        Math.sin(longitudeDifference / 2);

    const angularDistance =
      2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

    return earthRadiusKm * angularDistance;
  }

  async function searchAddress(address) {
    const query = `${address}, Brasil`;

    const url =
      "https://nominatim.openstreetmap.org/search" +
      `?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Não foi possível consultar o endereço.");
    }

    const results = await response.json();

    if (!results.length) {
      return null;
    }

    return {
      latitude: Number(results[0].lat),
      longitude: Number(results[0].lon),
      formattedAddress: results[0].display_name
    };
  }

  async function calculateFreight(address) {
    const destination = await searchAddress(address);

    if (!destination) {
      addBotMessage(
        "Não consegui encontrar esse endereço. " +
        "Tente informar também o bairro, a cidade e o estado."
      );

      return;
    }

    const distance = calculateDistanceInKm(
      STORE_LATITUDE,
      STORE_LONGITUDE,
      destination.latitude,
      destination.longitude
    );

    const roundedDistance = Math.ceil(distance * 10) / 10;

    if (roundedDistance > MAX_DISTANCE_KM) {
      addBotMessage(
        "Não é possível efetuar essa entrega.<br><br>" +
        `A distância encontrada foi de <strong>${roundedDistance.toFixed(1)} km</strong>, ` +
        "mas o limite máximo é de 100 km."
      );

      return;
    }

    const freightPrice = roundedDistance * PRICE_PER_KM;
    const purchaseTotal = getCartTotal();
    const finalTotal = purchaseTotal + freightPrice;

    addBotMessage(
      "Entrega calculada com sucesso!<br><br>" +
      `<strong>Origem:</strong> ${STORE_ADDRESS}<br>` +
      `<strong>Destino:</strong> ${destination.formattedAddress}<br>` +
      `<strong>Distância:</strong> ${roundedDistance.toFixed(1)} km<br>` +
      `<strong>Frete:</strong> ${formatBrazilianMoney(freightPrice)}<br>` +
      `<strong>Total da compra com frete:</strong> ${formatBrazilianMoney(finalTotal)}`
    );
  }

  async function handleMessage(text) {
    const cleanText = text.trim();

    if (!cleanText) {
      return false;
    }

    const normalizedText = cleanText
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const isCep = /^\d{5}-?\d{3}$/.test(cleanText);

    const addressWords = [
      "rua", "avenida", "av.", "travessa", "estrada",
      "rodovia", "alameda", "praca", "bairro", "centro"
    ];

    const isAddress =
      addressWords.some(word => normalizedText.includes(word)) &&
      /\d/.test(cleanText);

    if (waitingForAddress || isCep || isAddress) {
      waitingForAddress = false;
      addBotMessage("Endereço recebido. Estou calculando o frete. Aguarde um momento...");

      try {
        await calculateFreight(cleanText);
      } catch (error) {
        console.error("Erro ao calcular o frete:", error);
        addBotMessage(
          "Não consegui localizar esse endereço. Informe rua, número, bairro, cidade e estado."
        );
      }

      return true;
    }

    if (isFreightQuestion(cleanText)) {
      waitingForAddress = true;
      addBotMessage(
        "Para calcular o frete, informe seu endereço completo.<br><br>" +
        "Exemplo: Rua das Flores, 100, Centro, Lorena - SP"
      );
      return true;
    }

    return false;
  }

  async function validateDelivery(address) {
    const destination = await searchAddress(address);

    if (!destination) {
      return {
        success: false,
        message:
          "Não consegui encontrar esse endereço. Informe a rua, número, bairro, cidade e estado."
      };
    }

    const distance = calculateDistanceInKm(
      STORE_LATITUDE,
      STORE_LONGITUDE,
      destination.latitude,
      destination.longitude
    );

    const roundedDistance = Math.ceil(distance * 10) / 10;

    if (roundedDistance > MAX_DISTANCE_KM) {
      return {
        success: false,
        message:
          "Não é possível efetuar essa entrega.<br><br>" +
          `A distância encontrada foi de <strong>${roundedDistance.toFixed(1)} km</strong>, ` +
          "mas o limite máximo é de 100 km."
      };
    }

    return {
      success: true,
      address: destination.formattedAddress,
      distance: roundedDistance,
      freight: roundedDistance * PRICE_PER_KM
    };
  }

  return {
    handleMessage,
    validateDelivery
  };

})();

/*BANCO DE DADOS*/

