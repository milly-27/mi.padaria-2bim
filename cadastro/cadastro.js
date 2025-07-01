function mostrarSenha(id) {
    const input = document.getElementById(id);
    const span = input.nextElementSibling;
    if (input.type === "password") {
        input.type = "text";
        span.textContent = "🙈"; // olho fechado
    } else {
        input.type = "password";
        span.textContent = "👁️"; // olho aberto
    }
}

function senhaForte(senha) {
    // Mínimo 8 caracteres, pelo menos uma letra maiúscula, um número e um símbolo
    return senha.length >= 8
        && /[A-Z]/.test(senha)
        && /[0-9]/.test(senha)
        && /[\W_]/.test(senha);
}

// FUNÇÃO SIMPLES PARA VALIDAR SE TERMINA COM @gmail.com
function validarGmail(email) {
    return email.toLowerCase().endsWith('@gmail.com');
}

async function cadastrar() {
    const usuario = document.getElementById("usuario").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const msg = document.getElementById("mensagem");
    
    if (!usuario || !email || !senha) {
        msg.style.color = "red";
        msg.textContent = "Preencha todos os campos.";
        return;
    }
    
    // VALIDAÇÃO GMAIL SIMPLES
    if (!validarGmail(email)) {
        msg.style.color = "red";
        msg.textContent = "O email deve ser preenchido corretamente.";
        return;
    }
    
    if (!senhaForte(senha)) {
        msg.style.color = "red";
        msg.textContent = "Senha fraca! Use ao menos 8 caracteres, letra maiúscula, número e símbolo.";
        return;
    }
    
    try {
        // Fazer requisição para a API de cadastro - URL COMPLETA
        const response = await fetch('http://localhost:3000/cadastro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usuario,
                email,
                password: senha,
                tipo: 'cliente'
            })
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
            // REDIRECIONAMENTO IMEDIATO - sem delay
            window.location.href = "../login/login.html";
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
            msg.textContent = "Erro ao fazer cadastro. Tente novamente.";
        }
    }
}