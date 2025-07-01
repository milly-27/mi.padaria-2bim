let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
let cupomAplicado = null;
let subtotalOriginal = 0;

function carregarResumo() {
  const itensContainer = document.getElementById('itens-carrinho');
  const subtotalEl = document.getElementById('subtotal');
  const totalFinalEl = document.getElementById('total-final');
  
  if (carrinho.length === 0) {
    itensContainer.innerHTML = '<p>Carrinho vazio</p>';
    subtotalEl.textContent = 'Subtotal: R$ 0,00';
    totalFinalEl.textContent = 'Total: R$ 0,00';
    return;
  }

  itensContainer.innerHTML = '';
  subtotalOriginal = 0;

  carrinho.forEach(item => {
    const subtotalItem = item.preco * item.quantidade;
    subtotalOriginal += subtotalItem;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-carrinho';
    itemDiv.innerHTML = `
      <div>
        <strong>${item.nome}</strong><br>
        <small>Quantidade: ${item.quantidade} x R$ ${item.preco.toFixed(2)}</small>
      </div>
      <div>R$ ${subtotalItem.toFixed(2)}</div>
    `;
    itensContainer.appendChild(itemDiv);
  });

  atualizarTotais();
}

function atualizarTotais() {
  const subtotalEl = document.getElementById('subtotal');
  const descontoEl = document.getElementById('desconto');
  const totalFinalEl = document.getElementById('total-final');

  subtotalEl.textContent = `Subtotal: R$ ${subtotalOriginal.toFixed(2)}`;

  let valorDesconto = 0;
  let totalFinal = subtotalOriginal;

  if (cupomAplicado) {
    valorDesconto = subtotalOriginal * cupomAplicado.discount;
    totalFinal = subtotalOriginal - valorDesconto;
    
    descontoEl.textContent = `Desconto (${(cupomAplicado.discount * 100).toFixed(0)}%): -R$ ${valorDesconto.toFixed(2)}`;
    descontoEl.style.display = 'block';
  } else {
    descontoEl.style.display = 'none';
  }

  totalFinalEl.textContent = `Total: R$ ${totalFinal.toFixed(2)}`;
  
  // Salvar o total final no localStorage para a página de pagamento
  localStorage.setItem('totalFinal', totalFinal.toFixed(2));
  localStorage.setItem('cupomAplicado', JSON.stringify(cupomAplicado));
}

async function aplicarCupom() {
  const codigoCupom = document.getElementById('codigo-cupom').value.trim();
  const mensagemEl = document.getElementById('mensagem-cupom');
  
  if (!codigoCupom) {
    mostrarMensagem('Por favor, digite um código de cupom.', 'erro');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/cupons/validar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code: codigoCupom })
    });

    const data = await response.json();

    if (response.ok) {
      cupomAplicado = {
        code: codigoCupom.toUpperCase(),
        discount: data.discount
      };
      
      mostrarMensagem(data.message, 'sucesso');
      mostrarCupomAplicado();
      atualizarTotais();
      document.getElementById('codigo-cupom').value = '';
    } else {
      mostrarMensagem(data.message || 'Cupom inválido.', 'erro');
    }
  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    mostrarMensagem('Erro ao validar cupom. Tente novamente.', 'erro');
  }
}

function mostrarMensagem(texto, tipo) {
  const mensagemEl = document.getElementById('mensagem-cupom');
  mensagemEl.textContent = texto;
  mensagemEl.className = `mensagem ${tipo}`;
  mensagemEl.style.display = 'block';
  
  // Esconder a mensagem após 5 segundos
  setTimeout(() => {
    mensagemEl.style.display = 'none';
  }, 5000);
}

function mostrarCupomAplicado() {
  const cupomAplicadoEl = document.getElementById('cupom-aplicado');
  const cupomCodigoEl = document.getElementById('cupom-codigo');
  
  cupomCodigoEl.textContent = cupomAplicado.code;
  cupomAplicadoEl.style.display = 'flex';
}

function removerCupom() {
  cupomAplicado = null;
  document.getElementById('cupom-aplicado').style.display = 'none';
  document.getElementById('mensagem-cupom').style.display = 'none';
  atualizarTotais();
}

function voltarParaCarrinho() {
  window.location.href = '../principal/index.html';
}

function irParaPagamento() {
  if (carrinho.length === 0) {
    alert('Carrinho vazio! Adicione produtos antes de finalizar o pedido.');
    return;
  }
  
  // Salvar dados do pedido no localStorage
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  localStorage.setItem('cupomAplicado', JSON.stringify(cupomAplicado));
  
  window.location.href = '../pagamento/pagamento.html';
}

// Permitir aplicar cupom com Enter
document.getElementById('codigo-cupom').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    aplicarCupom();
  }
});

// Carregar dados quando a página carrega
window.onload = function() {
  carregarResumo();
};


// Funções de autenticação
function verificarUsuarioLogado() {
  const currentUser = localStorage.getItem('currentUser');
  const userInfoDiv = document.getElementById('user-info');
  const loginPromptDiv = document.getElementById('login-prompt');
  const userNameSpan = document.getElementById('user-name');

  if (currentUser) {
    const user = JSON.parse(currentUser);
    userNameSpan.textContent = user.username;
    userInfoDiv.style.display = 'block';
    loginPromptDiv.style.display = 'none';
    return true;
  } else {
    userInfoDiv.style.display = 'none';
    loginPromptDiv.style.display = 'block';
    return false;
  }
}

function verificarLoginEProsseguir() {
  if (verificarUsuarioLogado()) {
    irParaPagamento();
  } else {
    alert('Você precisa fazer login antes de finalizar o pedido.');
    // Opcional: redirecionar automaticamente para login
    // irParaLogin();
  }
}

function irParaLogin() {
  window.location.href = '../login/login.html';
}

function logout() {
  localStorage.removeItem('currentUser');
  verificarUsuarioLogado();
  alert('Logout realizado com sucesso!');
}

// Verificar status do usuário quando a página carrega
window.addEventListener('load', function() {
  verificarUsuarioLogado();
});

