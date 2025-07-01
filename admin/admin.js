// Variáveis globais
let produtos = [];
let cupons = [];
let usuarios = [];
let editandoProduto = null;
let editandoCupom = null;
let editandoUsuario = null;
let usuarioAtual = null; // Adicionar variável para armazenar usuário atual

// Dados do usuário administrador protegido
const ADMIN_PROTEGIDO = {
  username: 'adm',
  email: 'adm.padaria@gmail.com',
  password: 'adm0000'
};

// Configurações de sessão
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hora em millisegundos

// Inicialização - SIMPLIFICADA
window.onload = function() {
  console.log('Página carregada, verificando autenticação...');
  inicializarPagina();
};

// Função principal de inicialização
function inicializarPagina() {
  const usuario = verificarAutenticacao();
  if (usuario) {
    console.log('Usuário autenticado:', usuario);
    usuarioAtual = usuario; // Armazenar usuário atual
    mostrarInterfaceUsuario(usuario);
    carregarTodosDados();
  }
}

// Funções de autenticação CORRIGIDAS
function verificarAutenticacao() {
  console.log('Verificando autenticação...');
  
  // Verificar tanto o formato novo quanto o antigo de sessão
  let sessionData = localStorage.getItem('userSession');
  let currentUserData = localStorage.getItem('currentUser');
  
  console.log('SessionData:', sessionData);
  console.log('CurrentUserData:', currentUserData);
  
  let usuario = null;
  
  // Tentar primeiro o formato novo (userSession)
  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      const agora = new Date().getTime();
      
      console.log('Sessão encontrada:', session);
      console.log('Tempo atual:', agora, 'Expira em:', session.expiraEm);
      
      // Verificar se a sessão expirou
      if (agora > session.expiraEm) {
        console.log('Sessão expirada');
        localStorage.removeItem('userSession');
        redirecionarParaLogin('Sua sessão expirou. Faça login novamente.');
        return null;
      }
      
      // Verificar se o usuário é gerente
      if (session.usuario.tipo !== 'gerente') {
        console.log('Usuário não é gerente:', session.usuario.tipo);
        localStorage.removeItem('userSession');
        redirecionarParaLogin('Acesso negado! Apenas gerentes podem acessar esta página.');
        return null;
      }
      
      // Renovar sessão
      session.expiraEm = agora + SESSION_TIMEOUT;
      localStorage.setItem('userSession', JSON.stringify(session));
      
      usuario = session.usuario;
      
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      localStorage.removeItem('userSession');
    }
  }
  
  // Se não encontrou no formato novo, tentar o formato antigo (currentUser)
  if (!usuario && currentUserData) {
    try {
      const currentUser = JSON.parse(currentUserData);
      console.log('CurrentUser encontrado:', currentUser);
      
      // Verificar se é gerente
      if (currentUser.tipo !== 'gerente') {
        console.log('CurrentUser não é gerente:', currentUser.tipo);
        localStorage.removeItem('currentUser');
        redirecionarParaLogin('Acesso negado! Apenas gerentes podem acessar esta página.');
        return null;
      }
      
      // Converter para o formato novo
      const agora = new Date().getTime();
      const sessao = {
        usuario: currentUser,
        criadaEm: agora,
        expiraEm: agora + SESSION_TIMEOUT
      };
      localStorage.setItem('userSession', JSON.stringify(sessao));
      localStorage.removeItem('currentUser'); // Remove o formato antigo
      
      usuario = currentUser;
      
    } catch (error) {
      console.error('Erro ao verificar currentUser:', error);
      localStorage.removeItem('currentUser');
    }
  }
  
  // Se não encontrou nenhum usuário válido
  if (!usuario) {
    console.log('Nenhum usuário válido encontrado');
    redirecionarParaLogin('Você precisa fazer login para acessar esta página.');
    return null;
  }
  
  console.log('Usuário autenticado com sucesso:', usuario);
  return usuario;
}

function mostrarInterfaceUsuario(usuario) {
  console.log('Mostrando interface para usuário:', usuario);
  
  const userInfoDiv = document.getElementById('user-info');
  const userNameSpan = document.getElementById('user-name');
  
  if (userNameSpan && userInfoDiv) {
    // Limpar conteúdo anterior e definir novo nome
    userNameSpan.textContent = '';
    userNameSpan.textContent = usuario.username || usuario.name || 'Usuário';
    userInfoDiv.style.display = 'block';
    
    console.log('Nome do usuário definido no span:', userNameSpan.textContent);
  } else {
    console.error('Elementos user-info ou user-name não encontrados no DOM');
  }
  
  // Garantir que o usuário atual está sempre atualizado
  usuarioAtual = usuario;
}

// Função para atualizar nome do usuário (pode ser chamada quando necessário)
function atualizarNomeUsuario() {
  if (usuarioAtual) {
    const userNameSpan = document.getElementById('user-name');
    if (userNameSpan) {
      userNameSpan.textContent = usuarioAtual.username || usuarioAtual.name || 'Usuário';
      console.log('Nome do usuário atualizado:', userNameSpan.textContent);
    }
  }
}

function redirecionarParaLogin(mensagem) {
  console.log('Redirecionando para login:', mensagem);
  alert(mensagem);
  window.location.href = '../login/login.html';
}

function logout() {
  localStorage.removeItem('userSession');
  localStorage.removeItem('currentUser');
  usuarioAtual = null; // Limpar usuário atual
  alert('Logout realizado com sucesso!');
  window.location.href = '../login/login.html';
}

// Função para criar sessão (para ser usada na página de login)
function criarSessao(usuario) {
  const agora = new Date().getTime();
  const sessao = {
    usuario: usuario,
    criadaEm: agora,
    expiraEm: agora + SESSION_TIMEOUT
  };
  localStorage.setItem('userSession', JSON.stringify(sessao));
  console.log('Sessão criada:', sessao);
}

// Verificação periódica MAIS SUAVE
let verificacaoInterval = null;

function iniciarVerificacaoPeriodica() {
  // Limpar interval anterior se existir
  if (verificacaoInterval) {
    clearInterval(verificacaoInterval);
  }
  
  verificacaoInterval = setInterval(function() {
    const sessionData = localStorage.getItem('userSession');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        const agora = new Date().getTime();
        
        if (agora > session.expiraEm) {
          console.log('Sessão expirou durante verificação periódica');
          localStorage.removeItem('userSession');
          usuarioAtual = null; // Limpar usuário atual
          redirecionarParaLogin('Sua sessão expirou. Faça login novamente.');
        } else {
          // Verificar se o usuário mudou e atualizar interface
          if (usuarioAtual && session.usuario.username !== usuarioAtual.username) {
            usuarioAtual = session.usuario;
            mostrarInterfaceUsuario(usuarioAtual);
          }
        }
      } catch (error) {
        console.error('Erro na verificação periódica:', error);
      }
    }
  }, 5 * 60 * 1000); // Verificar a cada 5 minutos (menos agressivo)
}

// Iniciar verificação periódica apenas após login bem-sucedido
window.addEventListener('DOMContentLoaded', function() {
  console.log('DOM carregado');
  // Não verificar autenticação aqui para evitar dupla verificação
  iniciarVerificacaoPeriodica();
});

// Função para verificar se é o usuário administrador protegido
function isUsuarioAdminProtegido(email) {
  return email === ADMIN_PROTEGIDO.email;
}

// Funções de navegação entre abas - MELHORADA
function mostrarAba(aba) {
  // Verificação mais leve - apenas verifica se existe sessão
  const sessionData = localStorage.getItem('userSession');
  if (!sessionData) {
    redirecionarParaLogin('Sessão não encontrada.');
    return;
  }

  // Atualizar nome do usuário toda vez que trocar de aba
  atualizarNomeUsuario();

  // Esconder todas as abas
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remover classe active de todos os botões
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Mostrar aba selecionada
  document.getElementById(aba).classList.add('active');
  
  // Ativar botão correspondente
  if (event && event.target) {
    event.target.classList.add('active');
  }
}

// Funções de carregamento de dados
async function carregarTodosDados() {
  console.log('Carregando todos os dados...');
  try {
    await Promise.all([
      carregarProdutos(),
      carregarCupons(),
      carregarUsuarios()
    ]);
    console.log('Todos os dados carregados com sucesso');
    // Garantir que o nome do usuário está correto após carregar dados
    atualizarNomeUsuario();
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
}

async function carregarProdutos() {
  try {
    const response = await fetch('http://localhost:3000/produtos');
    if (!response.ok) {
      throw new Error('Erro na resposta do servidor');
    }
    produtos = await response.json();
    renderizarProdutos();
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    alert('Erro ao carregar produtos. Verifique se o servidor está funcionando.');
  }
}

async function carregarCupons() {
  try {
    const response = await fetch('http://localhost:3000/cupons');
    if (!response.ok) {
      throw new Error('Erro na resposta do servidor');
    }
    cupons = await response.json();
    renderizarCupons();
  } catch (error) {
    console.error('Erro ao carregar cupons:', error);
    alert('Erro ao carregar cupons. Verifique se o servidor está funcionando.');
  }
}

async function carregarUsuarios() {
  try {
    const response = await fetch('http://localhost:3000/users');
    if (!response.ok) {
      throw new Error('Erro na resposta do servidor');
    }
    usuarios = await response.json();
    renderizarUsuarios();
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    alert('Erro ao carregar usuários. Verifique se o servidor está funcionando.');
  }
}

// Funções de renderização
function renderizarProdutos() {
  const tbody = document.getElementById('lista-produtos');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  produtos.forEach(produto => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${produto.name}</td>
      <td>R$ ${produto.price.toFixed(2)}</td>
      <td>${produto.category}</td>
      <td>${produto.image ? '<img src="' + produto.image + '" alt="' + produto.name + '" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">' : 'Sem imagem'}</td>
      <td>
        <button class="btn-editar" onclick="editarProduto('${produto.name}')">Editar</button>
        <button class="btn-excluir" onclick="excluirProduto('${produto.name}')">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderizarCupons() {
  const tbody = document.getElementById('lista-cupons');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  cupons.forEach(cupom => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${cupom.code}</td>
      <td>${(cupom.discount * 100).toFixed(0)}%</td>
      <td>
        <button class="btn-editar" onclick="editarCupom('${cupom.code}')">Editar</button>
        <button class="btn-excluir" onclick="excluirCupom('${cupom.code}')">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderizarUsuarios() {
  const tbody = document.getElementById('lista-usuarios');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  usuarios.forEach(usuario => {
    const tr = document.createElement('tr');
    const isAdmin = isUsuarioAdminProtegido(usuario.email);
    
    const botoesAcao = isAdmin ? 
      `<td>
        <button class="btn-editar" disabled style="opacity: 0.5; cursor: not-allowed;" title="Usuário administrador não pode ser editado">Editar</button>
        <button class="btn-excluir" disabled style="opacity: 0.5; cursor: not-allowed;" title="Usuário administrador não pode ser excluído">Excluir</button>
        <span style="color: #dc3545; font-size: 12px; margin-left: 5px;">👑 ADMIN</span>
      </td>` :
      `<td>
        <button class="btn-editar" onclick="editarUsuario('${usuario.email}')">Editar</button>
        <button class="btn-excluir" onclick="excluirUsuario('${usuario.email}')">Excluir</button>
      </td>`;
    
    tr.innerHTML = `
      <td>${usuario.username}</td>
      <td>${usuario.email}</td>
      <td>${usuario.password}</td>
      <td>${usuario.tipo}</td>
      ${botoesAcao}
    `;
    tbody.appendChild(tr);
  });
}

// Resto do código permanece igual...
// Funções de modal - SIMPLIFICADAS
function abrirModalProduto() {
  editandoProduto = null;
  document.getElementById('titulo-modal-produto').textContent = 'Adicionar Produto';
  document.getElementById('form-produto').reset();
  document.getElementById('modal-produto').style.display = 'block';
}

function abrirModalCupom() {
  editandoCupom = null;
  document.getElementById('titulo-modal-cupom').textContent = 'Adicionar Cupom';
  document.getElementById('form-cupom').reset();
  document.getElementById('modal-cupom').style.display = 'block';
}

function abrirModalUsuario() {
  editandoUsuario = null;
  document.getElementById('titulo-modal-usuario').textContent = 'Adicionar Usuário';
  document.getElementById('form-usuario').reset();
  document.getElementById('modal-usuario').style.display = 'block';
}

function fecharModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Funções de edição
function editarProduto(nome) {
  const produto = produtos.find(p => p.name === nome);
  if (!produto) return;
  
  editandoProduto = nome;
  document.getElementById('titulo-modal-produto').textContent = 'Editar Produto';
  document.getElementById('nome-produto').value = produto.name;
  document.getElementById('preco-produto').value = produto.price;
  document.getElementById('categoria-produto').value = produto.category;
  document.getElementById('imagem-produto').value = produto.image || '';
  document.getElementById('modal-produto').style.display = 'block';
}

function editarCupom(codigo) {
  const cupom = cupons.find(c => c.code === codigo);
  if (!cupom) return;
  
  editandoCupom = codigo;
  document.getElementById('titulo-modal-cupom').textContent = 'Editar Cupom';
  document.getElementById('codigo-cupom').value = cupom.code;
  document.getElementById('desconto-cupom').value = cupom.discount * 100;
  document.getElementById('modal-cupom').style.display = 'block';
}

function editarUsuario(email) {
  if (isUsuarioAdminProtegido(email)) {
    alert('Erro: O usuário administrador não pode ser editado!');
    return;
  }
  
  const usuario = usuarios.find(u => u.email === email);
  if (!usuario) return;
  
  editandoUsuario = email;
  document.getElementById('titulo-modal-usuario').textContent = 'Editar Usuário';
  document.getElementById('username-usuario').value = usuario.username;
  document.getElementById('email-usuario').value = usuario.email;
  document.getElementById('senha-usuario').value = usuario.password;
  document.getElementById('tipo-usuario').value = usuario.tipo;
  document.getElementById('modal-usuario').style.display = 'block';
}

// Funções de exclusão
async function excluirProduto(nome) {
  if (!confirm(`Tem certeza que deseja excluir o produto "${nome}"?`)) return;
  
  try {
    const response = await fetch(`http://localhost:3000/produtos/${encodeURIComponent(nome)}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      await carregarProdutos();
      alert('Produto excluído com sucesso!');
    } else {
      const error = await response.json();
      alert('Erro ao excluir produto: ' + error.message);
    }
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    alert('Erro ao excluir produto');
  }
}

async function excluirCupom(codigo) {
  if (!confirm(`Tem certeza que deseja excluir o cupom "${codigo}"?`)) return;
  
  try {
    const response = await fetch(`http://localhost:3000/cupons/${encodeURIComponent(codigo)}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      await carregarCupons();
      alert('Cupom excluído com sucesso!');
    } else {
      const error = await response.json();
      alert('Erro ao excluir cupom: ' + error.message);
    }
  } catch (error) {
    console.error('Erro ao excluir cupom:', error);
    alert('Erro ao excluir cupom');
  }
}

async function excluirUsuario(email) {
  if (isUsuarioAdminProtegido(email)) {
    alert('Erro: O usuário administrador não pode ser excluído!');
    return;
  }
  
  if (!confirm(`Tem certeza que deseja excluir o usuário "${email}"?`)) return;
  
  try {
    const response = await fetch(`http://localhost:3000/users/${encodeURIComponent(email)}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      await carregarUsuarios();
      alert('Usuário excluído com sucesso!');
    } else {
      const error = await response.json();
      alert('Erro ao excluir usuário: ' + error.message);
    }
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    alert('Erro ao excluir usuário');
  }
}

// Event listeners para formulários
document.getElementById('form-produto').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const dados = {
    name: document.getElementById('nome-produto').value,
    price: parseFloat(document.getElementById('preco-produto').value),
    category: document.getElementById('categoria-produto').value,
    image: document.getElementById('imagem-produto').value
  };
  
  try {
    let response;
    if (editandoProduto) {
      response = await fetch(`http://localhost:3000/produtos/${encodeURIComponent(editandoProduto)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });
    } else {
      response = await fetch('http://localhost:3000/produtos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });
    }
    
    if (response.ok) {
      await carregarProdutos();
      fecharModal('modal-produto');
      alert(editandoProduto ? 'Produto atualizado com sucesso!' : 'Produto adicionado com sucesso!');
    } else {
      const error = await response.json();
      alert('Erro: ' + error.message);
    }
  } catch (error) {
    console.error('Erro ao salvar produto:', error);
    alert('Erro ao salvar produto');
  }
});

document.getElementById('form-cupom').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const dados = {
    code: document.getElementById('codigo-cupom').value.toUpperCase(),
    discount: parseFloat(document.getElementById('desconto-cupom').value) / 100
  };
  
  try {
    let response;
    if (editandoCupom) {
      response = await fetch(`http://localhost:3000/cupons/${encodeURIComponent(editandoCupom)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });
    } else {
      response = await fetch('http://localhost:3000/cupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });
    }
    
    if (response.ok) {
      await carregarCupons();
      fecharModal('modal-cupom');
      alert(editandoCupom ? 'Cupom atualizado com sucesso!' : 'Cupom adicionado com sucesso!');
    } else {
      const error = await response.json();
      alert('Erro: ' + error.message);
    }
  } catch (error) {
    console.error('Erro ao salvar cupom:', error);
    alert('Erro ao salvar cupom');
  }
});

document.getElementById('form-usuario').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const dados = {
    username: document.getElementById('username-usuario').value,
    email: document.getElementById('email-usuario').value,
    password: document.getElementById('senha-usuario').value,
    tipo: document.getElementById('tipo-usuario').value
  };
  
  if (editandoUsuario && isUsuarioAdminProtegido(editandoUsuario)) {
    alert('Erro: O usuário administrador não pode ser editado!');
    return;
  }
  
  if (!editandoUsuario && isUsuarioAdminProtegido(dados.email)) {
    alert('Erro: Não é possível criar um usuário com este email. Email reservado para o administrador.');
    return;
  }
  
  try {
    let response;
    if (editandoUsuario) {
      response = await fetch(`http://localhost:3000/users/${encodeURIComponent(editandoUsuario)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });
    } else {
      response = await fetch('http://localhost:3000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });
    }
    
    if (response.ok) {
      await carregarUsuarios();
      fecharModal('modal-usuario');
      alert(editandoUsuario ? 'Usuário atualizado com sucesso!' : 'Usuário adicionado com sucesso!');
    } else {
      const error = await response.json();
      alert('Erro: ' + error.message);
    }
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    alert('Erro ao salvar usuário');
  }
});

// Fechar modal ao clicar fora dele
window.onclick = function(event) {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
};

function filtrarTabela(inputId, tabelaId) {
  const filtro = document.getElementById(inputId).value.toLowerCase();
  const linhas = document.querySelectorAll(`#${tabelaId} tbody tr`);

  linhas.forEach(linha => {
    const textoLinha = linha.textContent.toLowerCase();
    linha.style.display = textoLinha.includes(filtro) ? '' : 'none';
  });
}

// Função para upload de imagem
async function uploadImagem() {
  const fileInput = document.getElementById('upload-imagem-produto');
  const urlInput = document.getElementById('imagem-produto');
  
  if (!fileInput.files[0]) {
    return;
  }

  const formData = new FormData();
  formData.append('image', fileInput.files[0]);

  try {
    urlInput.value = 'Enviando imagem...';
    
    const response = await fetch('/upload-image', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (data.success) {
      urlInput.value = data.imageUrl;
      alert('Imagem enviada com sucesso!');
    } else {
      alert('Erro ao enviar imagem: ' + data.message);
      urlInput.value = '';
    }
  } catch (error) {
    console.error('Erro no upload:', error);
    alert('Erro ao enviar imagem. Tente novamente.');
    urlInput.value = '';
  }
}