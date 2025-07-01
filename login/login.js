function mostrarSenha(id) {
  const input = document.getElementById(id);
  const btn = input.nextElementSibling;
  if (input.type === "password") {
      input.type = "text";
      btn.textContent = "🙈"; // olho fechado
      btn.setAttribute("aria-label", "Ocultar senha");
  } else {
      input.type = "password";
      btn.textContent = "👁️"; // olho aberto
      btn.setAttribute("aria-label", "Mostrar senha");
  }
}

async function logar() {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const msg = document.getElementById("mensagem");
  
  if (!email || !senha) {
      msg.style.color = "red";
      msg.textContent = "Preencha todos os campos.";
      return;
  }
  
  try {
      // Verificar se o servidor está rodando
      const response = await fetch('http://localhost:3000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: senha })
      });
      
      // Verificar se a resposta é válida
      if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Resposta não é JSON válido');
      }
      
      const data = await response.json();
      
      if (data.success) {
          msg.style.color = "green";
          msg.textContent = data.message + " Redirecionando...";
          
          // Salvar dados do usuário no localStorage
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          
          // Redirecionar baseado no tipo de usuário
          setTimeout(() => {
              if (data.user.tipo === 'gerente') {
                  window.location.href = "../admin/admin.html";
              } else {
                  window.location.href = "../principal/index.html";
              }
          }, 1000);
      } else {
          msg.style.color = "red";
          msg.textContent = data.message;
      }
  } catch (error) {
      console.error('Erro completo:', error);
      msg.style.color = "red";
      
      // Mensagens de erro mais específicas
      if (error.message.includes('fetch')) {
          msg.textContent = "Erro: Servidor não está rodando. Verifique se o servidor Node.js está ativo na porta 3000.";
      } else if (error.message.includes('JSON')) {
          msg.textContent = "Erro: Resposta inválida do servidor.";
      } else {
          msg.textContent = "Erro ao fazer login. Tente novamente.";
      }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btnCadastro = document.getElementById('btnCadastro');
  if (btnCadastro) {
      btnCadastro.addEventListener('click', () => {
          window.location.href = '../cadastro/cadastro.html';
      });
  }
  
  const btnRecuperar = document.getElementById('btnRecuperar');
  if (btnRecuperar) {
      btnRecuperar.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = '../recuperar/recuperar.html';
      });
  }
  
  // Adicione escuta para o submit do form, para disparar logar()
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          logar();
      });
  }
});
