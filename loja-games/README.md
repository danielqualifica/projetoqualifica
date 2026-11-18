# GeekZone - Loja de Games

## Estrutura

```text
loja-games/
├── index.html          loja (vitrine, carrinho, chat, busca por foto)
├── login.html          acesso administrativo (sem Firebase)
├── admin.html          painel com CRUD de produtos
└── assets/
    ├── css/  styles.css, admin.css
    ├── img/  capas dos jogos
    └── js/
        ├── app.js            carrinho, tema, chat, busca por foto
        ├── db.js             "banco" de produtos (localStorage): list/get/create/update/remove
        ├── produtos-loja.js  desenha os produtos na loja
        ├── auth.js           login/sessão do painel
        ├── admin.js          telas do painel
        └── my_model/         modelo do Teachable Machine
```

## Como usar

1. Abra a pasta no VS Code e rode com **Live Server** (necessário para o login e para a busca por foto).
2. Clique em "Acesso administrativo" na loja, ou abra `login.html`.
3. Login inicial: `danielramalhoqualifica@gmail.com` / senha `GeekZone@2026`.
4. No painel: aba **Produtos** (buscar, editar, excluir, exportar/importar/restaurar) e aba **Cadastrar produto**.

## Trocar a senha

Abra `login.html`, pressione F12, aba Console e rode `GeekZoneAuth.hash("sua nova senha")`.
Cole o resultado em `PASS_HASH`, dentro de `assets/js/auth.js`.

## Limitações (importante)

- O login roda no navegador: impede o uso casual, mas **não é segurança real**. Quem abrir o código-fonte pode contorná-lo. Para proteger de verdade, a validação precisa ficar num servidor.
- Os produtos ficam no `localStorage`: aparecem na loja só no navegador/computador onde foram cadastrados. Use **Exportar/Importar** para fazer backup ou levar o catálogo para outro lugar.
