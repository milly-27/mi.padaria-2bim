// recuperar.js

let tokenGerado = "";
let tokenExpira = 0;
let usuarioAtual = "";
let emailAtual = "";

function mostrarSenha(id) {
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
}

function enviarToken() {
  const usuario = document.getElementById("usuario").value.trim();
  const email = document.getElementById("email").value.trim();
  const msg = document.getElementById("mensagem");

  if (!usuario || !email) {
    msg.textContent = "Preencha usuário e e-mail.";
    return;
  }

  const dados = JSON.parse(localStorage.getItem("usuarios")) || [];
  const user = dados.find(u => u.usuario === usuario && u.email === email);

  if (!user) {
    msg.textContent = "Usuário e e-mail não encontrados.";
    return;
  }

  // Gerar token aleatório de 6 dígitos
  tokenGerado = Math.floor(100000 + Math.random() * 900000).toString();
  tokenExpira = Date.now() + 2 * 60 * 1000; // 2 minutos
  usuarioAtual = usuario;
  emailAtual = email;

  alert(`Seu token é: ${tokenGerado}\nEste token expira em 2 minutos.`);

  msg.textContent = "Token enviado! Verifique e digite abaixo.";
  document.getElementById("area-token").style.display = "block";
}

function verificarToken() {
  const token = document.getElementById("token").value.trim();
  const msg = document.getElementById("mensagem");

  if (Date.now() > tokenExpira) {
    msg.textContent = "Token expirado. Peça um novo.";
    return;
  }
  if (token !== tokenGerado) {
    msg.textContent = "Token inválido.";
    return;
  }

  msg.textContent = "Token válido! Agora defina sua nova senha.";
  document.getElementById("area-nova-senha").style.display = "block";
}

function senhaForte(senha) {
  return senha.length >= 8 && /[A-Z]/.test(senha) && /[0-9]/.test(senha) && /[\W_]/.test(senha);
}

function trocarSenha() {
  const novaSenha = document.getElementById("novaSenha").value.trim();
  const msg = document.getElementById("mensagem");

  if (!senhaForte(novaSenha)) {
    msg.textContent = "Senha fraca! Use ao menos 8 caracteres, letra maiúscula, número e símbolo.";
    return;
  }

  const dados = JSON.parse(localStorage.getItem("usuarios")) || [];
  const userIndex = dados.findIndex(u => u.usuario === usuarioAtual && u.email === emailAtual);

  if (userIndex === -1) {
    msg.textContent = "Erro: usuário não encontrado.";
    return;
  }

  if (dados[userIndex].senha === novaSenha) {
    msg.textContent = "A nova senha não pode ser igual à antiga.";
    return;
  }

  dados[userIndex].senha = novaSenha;
  localStorage.setItem("usuarios", JSON.stringify(dados));

  msg.style.color = "green";
  msg.textContent = "Senha alterada com sucesso!";
  tokenGerado = "";
  tokenExpira = 0;
  usuarioAtual = "";
  emailAtual = "";

  setTimeout(() => {
    window.location.href = "../login/login.html";
  }, 2000);
}
