// Declaração das categorias
let doces = [];
let salgados = [];
let bebidas = [];
let todosProdutos = []; // NOVO: Array para armazenar todos os produtos

function carregarProdutos() {
  fetch('http://localhost:3000/produtos') // Agora pega do backend em JSON
    .then(response => response.json())
    .then(dados => {
      console.log(dados); // Visualiza os produtos recebidos

      // Limpar arrays
      doces = [];
      salgados = [];
      bebidas = [];
      todosProdutos = []; // NOVO: Limpar array de todos produtos

      dados.forEach(produto => {
        const item = {
          nome: produto.name,
          preco: parseFloat(produto.price),
          imagem: produto.image || ''
        };

        // NOVO: Adicionar ao array de todos produtos
        todosProdutos.push(item);

        if (produto.category === 'doces') {
          doces.push(item);
        } else if (produto.category === 'salgados') {
          salgados.push(item);
        } else if (produto.category === 'bebidas') {
          bebidas.push(item);
        }
      });

      mostrarCategoria('doces'); // Categoria inicial
      mostrarDoces();
      mostrarSalgados();
      mostrarBebidas();
      
      // NOVO: Atualizar carrinho após carregar produtos para sincronizar preços
      atualizarCarrinho();
    })
    .catch(error => {
      console.error('Erro ao carregar produtos:', error);
    });
}

function mostrarCategoria(categoria) {
  document.getElementById('doces').style.display = 'none';
  document.getElementById('salgados').style.display = 'none';
  document.getElementById('bebidas').style.display = 'none';
  document.getElementById(categoria).style.display = 'flex';
}

function mostrarDoces() {
  let container = document.getElementById('doces');
  container.innerHTML = '';

  doces.forEach((item, index) => {
    let card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${item.imagem}" alt="${item.nome}">
      <h4>${item.nome}</h4>
      <p>R$ ${item.preco.toFixed(2)}</p>
      <button onclick="adicionarDoces(${index})">Adicionar</button>
    `;
    container.appendChild(card);
  });
}

function mostrarSalgados() {
  let container = document.getElementById('salgados');
  container.innerHTML = '';

  salgados.forEach((item, index) => {
    let card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${item.imagem}" alt="${item.nome}">
      <h4>${item.nome}</h4>
      <p>R$ ${item.preco.toFixed(2)}</p>
      <button onclick="adicionarSalgados(${index})">Adicionar</button>
    `;
    container.appendChild(card);
  });
}

function mostrarBebidas() {
  let container = document.getElementById('bebidas');
  container.innerHTML = '';

  bebidas.forEach((item, index) => {
    let card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${item.imagem}" alt="${item.nome}">
      <h4>${item.nome}</h4>
      <p>R$ ${item.preco.toFixed(2)}</p>
      <button onclick="adicionarBebidas(${index})">Adicionar</button>
    `;
    container.appendChild(card);
  });
}

let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

function adicionarDoces(index) {
  let produto = doces[index];
  adicionarAoCarrinho(produto);
}

function adicionarSalgados(index) {
  let produto = salgados[index];
  adicionarAoCarrinho(produto);
}

function adicionarBebidas(index) {
  let produto = bebidas[index];
  adicionarAoCarrinho(produto);
}

function adicionarAoCarrinho(produto) {
  // MODIFICADO: Agora armazenamos apenas nome e quantidade, não o preço
  let existente = carrinho.find(item => item.nome === produto.nome);
  if (existente) {
    existente.quantidade++;
  } else {
    // NOVO: Armazenar apenas nome e quantidade
    carrinho.push({ 
      nome: produto.nome, 
      quantidade: 1 
    });
  }
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarCarrinho();
  
  // Feedback visual para o usuário
  console.log('Produto adicionado ao carrinho:', produto.nome);
  
  // Mostrar notificação visual (opcional)
  mostrarNotificacao(`${produto.nome} adicionado ao carrinho!`);
}

// NOVA FUNÇÃO: Buscar preço atual de um produto
function buscarPrecoAtual(nomeProduto) {
  const produto = todosProdutos.find(p => p.nome === nomeProduto);
  return produto ? produto.preco : 0;
}

// NOVA FUNÇÃO: Buscar informações completas de um produto
function buscarProdutoCompleto(nomeProduto) {
  const produto = todosProdutos.find(p => p.nome === nomeProduto);
  return produto || null;
}

function mostrarNotificacao(mensagem) {
  // Criar notificação temporária
  const notificacao = document.createElement('div');
  notificacao.textContent = mensagem;
  notificacao.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 12px 20px;
    border-radius: 5px;
    z-index: 1000;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;
  
  document.body.appendChild(notificacao);
  
  // Remover após 3 segundos
  setTimeout(() => {
    if (notificacao.parentNode) {
      notificacao.parentNode.removeChild(notificacao);
    }
  }, 3000);
}

// FUNÇÃO MODIFICADA: Agora busca preços atuais
function atualizarCarrinho() {
  let corpoCarrinho = document.getElementById('corpo-carrinho');
  let totalEl = document.getElementById('total');
  if (!corpoCarrinho || !totalEl) return; // Garante que elementos existem

  corpoCarrinho.innerHTML = '';
  let total = 0;
  let carrinhoAtualizado = []; // NOVO: Para remover produtos que não existem mais

  carrinho.forEach((item, index) => {
    // NOVO: Buscar preço atual do produto
    const precoAtual = buscarPrecoAtual(item.nome);
    const produtoCompleto = buscarProdutoCompleto(item.nome);
    
    // Se o produto não existe mais, pular
    if (!produtoCompleto) {
      console.log(`Produto "${item.nome}" não encontrado. Removendo do carrinho.`);
      return;
    }
    
    // Adicionar ao carrinho atualizado
    carrinhoAtualizado.push(item);
    
    let subtotal = precoAtual * item.quantidade;
    total += subtotal;

    let tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.nome}</td>
      <td>
        <input type="number" min="1" value="${item.quantidade}" onchange="atualizarQuantidadeDireta(${carrinhoAtualizado.length - 1}, this.value)">
      </td>
      <td>R$ ${precoAtual.toFixed(2)}</td>
      <td>R$ ${subtotal.toFixed(2)}</td>
      <td>
        <button onclick="alterarQuantidade(${carrinhoAtualizado.length - 1}, -1)">-</button>
        <button onclick="alterarQuantidade(${carrinhoAtualizado.length - 1}, 1)">+</button>
      </td>
    `;
    corpoCarrinho.appendChild(tr);
  });

  // NOVO: Atualizar carrinho removendo produtos inexistentes
  if (carrinhoAtualizado.length !== carrinho.length) {
    carrinho = carrinhoAtualizado;
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
  }

  totalEl.textContent = `Total: R$ ${total.toFixed(2)}`;
}

function alterarQuantidade(index, delta) {
  carrinho[index].quantidade += delta;
  if (carrinho[index].quantidade <= 0) {
    carrinho.splice(index, 1);
  }
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarCarrinho();
}

function atualizarQuantidadeDireta(index, valor) {
  let novaQuantidade = parseInt(valor);
  if (isNaN(novaQuantidade) || novaQuantidade < 1) {
    carrinho[index].quantidade = 1;
  } else {
    carrinho[index].quantidade = novaQuantidade;
  }
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarCarrinho();
}

function irParaCupom() {
  if (carrinho.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }

  // Marcar que está navegando dentro do site
  marcarNavegacaoInterna();

  // Verificar se o usuário está logado apenas no momento de finalizar
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) {
    // Perguntar se o usuário deseja fazer login ou continuar como visitante
    const resposta = confirm('Você deseja fazer login antes de continuar? Clique "OK" para fazer login ou "Cancelar" para continuar como visitante.');
    if (resposta) {
      // Salvar carrinho e redirecionar para login
      localStorage.setItem('carrinho', JSON.stringify(carrinho));
      localStorage.setItem('redirectAfterLogin', '../cupom/cupom.html');
      marcarNavegacaoInterna(); // Marcar novamente antes de navegar
      window.location.href = '../login/login.html';
      return;
    }
    // Continuar como visitante
  }

  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  window.location.href = '../cupom/cupom.html';
}

// Funções de autenticação
function verificarUsuarioLogado() {
  const currentUser = localStorage.getItem('currentUser');
  const userInfoDiv = document.getElementById('user-info');
  const loginLink = document.getElementById('login-link');
  const userNameSpan = document.getElementById('user-name');
  const gerentePanel = document.getElementById('gerente-panel'); // NOVO

  if (currentUser) {
    const user = JSON.parse(currentUser);
    userNameSpan.textContent = user.username;
    userInfoDiv.style.display = 'block';
    loginLink.style.display = 'none';
    
    // NOVO: Verificar se é gerente e mostrar botão admin
    if (user.tipo === 'gerente') {
      gerentePanel.style.display = 'block';
    } else {
      gerentePanel.style.display = 'none';
    }
    
    // Verificar se é admin e mostrar painel se necessário
    const painelAdm = document.getElementById('painel-adm');
    if (painelAdm && user.isAdmin) {
      painelAdm.style.display = 'block';
    }
    
    return user;
  } else {
    userInfoDiv.style.display = 'none';
    loginLink.style.display = 'block';
    gerentePanel.style.display = 'none'; // NOVO: Esconder se não logado
    return null;
  }
}

// NOVA FUNÇÃO: Logout manual com opção de limpar dados
function logoutManual() {
  const limparTudo = confirm('Deseja limpar todos os dados (carrinho e login) ou apenas fazer logout?\n\nOK = Limpar tudo\nCancelar = Apenas logout');
  
  if (limparTudo) {
    // Limpar carrinho também
    carrinho = [];
    localStorage.removeItem('carrinho');
    atualizarCarrinho();
  }
  
  // Sempre remover login
  localStorage.removeItem('currentUser');
  verificarUsuarioLogado();
  
  alert('Logout realizado com sucesso!');
  window.location.reload();
}

function logout() {
  // Usar a nova função de logout manual
  logoutManual();
}

// Função principal de inicialização - combinando ambos os window.onload
function inicializarPagina() {
  console.log('Inicializando página...');
  
  // Verificar usuário logado primeiro
  verificarUsuarioLogado();
  
  // Carregar produtos
  carregarProdutos();
  
  // NOVO: Configurar atualização periódica dos preços (opcional)
  // Atualizar preços a cada 30 segundos
  setInterval(() => {
    if (carrinho.length > 0) {
      carregarProdutos(); // Recarrega produtos e atualiza carrinho automaticamente
    }
  }, 30000); // 30 segundos
  
  console.log('Página inicializada com sucesso!');
}

// Usar apenas um evento de carregamento
window.addEventListener('load', inicializarPagina);

// Variável para controlar se está navegando dentro do site
let navegandoNoSite = false;

// MODIFICADO: Marcar quando está navegando dentro do site - tempo maior
function marcarNavegacaoInterna() {
  navegandoNoSite = true;
  // MODIFICADO: Resetar após um tempo maior para dar tempo de navegação
  setTimeout(() => {
    navegandoNoSite = false;
  }, 2000); // Aumentado para 2 segundos
}

// MODIFICADO: Limpar dados apenas quando realmente sair/fechar o site
window.addEventListener('beforeunload', function(e) {
  // Se está navegando dentro do site, não fazer logout
  if (navegandoNoSite) {
    return;
  }
  
  // MODIFICADO: Não remover currentUser aqui para manter login entre navegações
  // Apenas limpar carrinho para usuários não logados
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) {
    localStorage.removeItem('carrinho');
  }
  
  // REMOVIDO: localStorage.removeItem('currentUser') para manter login
});

// NOVA FUNÇÃO: Logout apenas quando realmente necessário (fechar aba/navegador)
window.addEventListener('pagehide', function(e) {
  // Este evento é mais confiável para detectar quando a página está sendo realmente fechada
  if (!navegandoNoSite) {
    const currentUser = localStorage.getItem('currentUser');
    
    // Limpar carrinho se não estiver logado
    if (!currentUser) {
      localStorage.removeItem('carrinho');
    }
    
    // OPCIONAL: Descomente a linha abaixo se quiser logout automático ao fechar aba
    // localStorage.removeItem('currentUser');
  }
});

// MODIFICADO: Detectar quando a página/aba está sendo fechada
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'hidden' && !navegandoNoSite) {
    // Aguardar tempo para verificar se realmente está fechando
    setTimeout(() => {
      // Se ainda está oculta e não está navegando, pode ter sido fechada
      if (document.visibilityState === 'hidden' && !navegandoNoSite) {
        const currentUser = localStorage.getItem('currentUser');
        
        // Limpar carrinho se não estiver logado
        if (!currentUser) {
          localStorage.removeItem('carrinho');
        }
        
        // OPCIONAL: Logout automático desabilitado para manter sessão
        // localStorage.removeItem('currentUser');
      }
    }, 5000);
  }
});

// Funções do painel administrativo (caso necessário)
function abrirAdicionarProduto() {
  // Implementar funcionalidade de adicionar produto
  console.log('Abrir adicionar produto');
}

function abrirModificarProduto() {
  // Implementar funcionalidade de modificar produto
  console.log('Abrir modificar produto');
}

function abrirExcluirProduto() {
  // Implementar funcionalidade de excluir produto
  console.log('Abrir excluir produto');
}

function abrirGerenciarCupons() {
  // Implementar funcionalidade de gerenciar cupons
  console.log('Abrir gerenciar cupons');
}

// NOVA FUNÇÃO: Navegar para página de admin
function irParaAdmin() {
  const currentUser = localStorage.getItem('currentUser');
  
  if (!currentUser) {
    alert('Você precisa estar logado para acessar esta área!');
    return;
  }
  
  const user = JSON.parse(currentUser);
  
  if (user.tipo !== 'gerente') {
    alert('Acesso negado! Apenas gerentes podem acessar esta área.');
    return;
  }
  
  // Marcar navegação interna
  marcarNavegacaoInterna();
  
  // Redirecionar para página de admin
  window.location.href = '../admin/admin.html';
}

// Funções básicas de cookies
function setCookie(nome, valor, dias) {
  const data = new Date();
  data.setTime(data.getTime() + (dias * 24 * 60 * 60 * 1000));
  const expira = "expires=" + data.toUTCString();
  document.cookie = nome + "=" + valor + ";" + expira + ";path=/";
}

function getCookie(nome) {
  const nomeEQ = nome + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nomeEQ) === 0) return c.substring(nomeEQ.length, c.length);
  }
  return null;
}

// Verificar se o usuário já deu consentimento
function verificarConsentimentoCookies() {
  const consentimento = getCookie("cookies_consent");

  if (!consentimento) {
    document.getElementById('cookie-banner').style.display = 'block';
  }
}

// Usuário aceitou
function aceitarCookies() {
  setCookie("cookies_consent", "aceito", 365);
  document.getElementById('cookie-banner').style.display = 'none';
  console.log("Usuário aceitou os cookies.");
}

// Usuário recusou
function recusarCookies() {
  setCookie("cookies_consent", "recusado", 365);
  document.getElementById('cookie-banner').style.display = 'none';
  console.log("Usuário recusou os cookies.");
}

// Chamar essa verificação quando a página carregar
window.addEventListener('load', verificarConsentimentoCookies);

if (getCookie("cookies_consent") === "aceito") {
  localStorage.setItem('currentUser', JSON.stringify(user));
}