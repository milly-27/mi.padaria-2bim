const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
let cuponsDoBackend = [];

async function carregarCuponsDoBackend() {
  try {
    console.log('Carregando cupons do backend...');
    const response = await fetch('http://localhost:3000/cupons');
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    cuponsDoBackend = await response.json();
    console.log('Cupons carregados inicialmente:', cuponsDoBackend);
    await calcularValores();
  } catch (error) {
    console.error('Erro ao carregar cupons:', error);
    cuponsDoBackend = []; // Garante que a variável está limpa
    await calcularValores();  // Continua mesmo com erro
  }
}

async function calcularValores() {
  console.log('\n🧮 === INICIANDO CÁLCULO DE VALORES ===');
  
  let valorOriginal = 0;
  carrinho.forEach(item => {
    valorOriginal += item.preco * item.quantidade;
  });

  // CORREÇÃO: Buscar cupom aplicado salvo na página anterior
  const cupomAplicadoStr = localStorage.getItem('cupomAplicado');
  let desconto = 0;
  let percentualDesconto = 0;

  console.log('💰 Valor original:', valorOriginal);
  console.log('🎫 Cupom aplicado (localStorage):', cupomAplicadoStr);

  if (cupomAplicadoStr && cupomAplicadoStr !== 'null') {
    try {
      const cupomAplicado = JSON.parse(cupomAplicadoStr);
      
      if (cupomAplicado && cupomAplicado.discount) {
        desconto = cupomAplicado.discount; // Já vem no formato correto (ex: 0.1 para 10%)
        percentualDesconto = desconto * 100;
        
        console.log('✅ Cupom aplicado:', cupomAplicado.code);
        console.log('✅ Desconto aplicado:', desconto, `(${percentualDesconto}%)`);
      }
    } catch (error) {
      console.error('❌ Erro ao parsear cupom aplicado:', error);
    }
  } else {
    console.log('ℹ️ Nenhum cupom aplicado');
  }

  const valorComDesconto = valorOriginal * (1 - desconto);
  console.log('💵 Valor final:', valorComDesconto.toFixed(2));
  console.log('=== FIM DO CÁLCULO ===\n');

  // Salva o valor calculado
  window.valorFinalCalculado = valorComDesconto;

  // Atualiza interface se existir
  const valorFinalSpan = document.getElementById('valor-final-span');
  if (valorFinalSpan) {
    valorFinalSpan.textContent = valorComDesconto.toFixed(2);
  }

  // CORREÇÃO: Verifica se o valor do localStorage está correto
  const totalFinalLS = localStorage.getItem('totalFinal');
  console.log('💾 Total salvo no localStorage:', totalFinalLS);
  console.log('🔢 Total calculado agora:', valorComDesconto.toFixed(2));
  
  // Se houver diferença, usa o valor recalculado
  if (Math.abs(parseFloat(totalFinalLS) - valorComDesconto) > 0.01) {
    console.log('⚠️ Diferença detectada! Atualizando localStorage...');
    localStorage.setItem('totalFinal', valorComDesconto.toFixed(2));
  }
  
  return valorComDesconto;
}

// Função para recarregar cupons do backend (mantida para compatibilidade)
async function recarregarCupons() {
  try {
    console.log('🔄 Recarregando cupons do backend...');
    const response = await fetch('http://localhost:3000/cupons');
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    cuponsDoBackend = await response.json();
    console.log('✅ Cupons recarregados:', cuponsDoBackend);
  } catch (error) {
    console.error('❌ Erro ao recarregar cupons:', error);
  }
}

// Função para verificar status dos dados
function verificarStatus() {
  console.log('\n🔍 === STATUS DOS DADOS ===');
  console.log('🛒 Carrinho:', carrinho);
  console.log('🎫 Cupom aplicado:', localStorage.getItem('cupomAplicado'));
  console.log('📦 Cupons backend:', cuponsDoBackend);
  console.log('💰 Total salvo:', localStorage.getItem('totalFinal'));
  console.log('========================\n');
}

function validarCartao(numero) {
  const digits = numero.replace(/\D/g, '').split('').reverse().map(d => parseInt(d, 10));
  let soma = 0;
  digits.forEach((d, i) => {
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    soma += d;
  });
  return soma % 10 === 0;
}

async function pagarCartao() {
  console.log('💳 Iniciando pagamento com cartão...');
  verificarStatus();
  
  const numero = prompt('Insira o número do seu cartão (só números):');
  if (!numero || !validarCartao(numero)) {
    alert('Número do cartão inválido. Tente novamente.');
    return;
  }
  
  // Recalcula o valor com cupons atualizados
  const valorFinal = await calcularValores();
  console.log('💳 Valor final para cartão:', valorFinal);
  
  alert('Cartão válido! Prosseguindo para confirmação.');
  document.getElementById('qrcode-area').style.display = 'none';
}

async function pagarPIX() {
  console.log('📱 Iniciando pagamento PIX...');
  verificarStatus();
  
  // Sempre recalcula o valor com cupons mais atualizados
  const valorFinalAtualizado = await calcularValores();
  
  // Usa o valor recém-calculado
  const valor = valorFinalAtualizado.toFixed(2);
  
  console.log('📱 Valor final PIX:', valor);

  const chavePix = '02964990999';
  const nomeRecebedor = 'Celso Mainko';
  const cidade = 'SAO PAULO';
  const descricao = 'Pagamento Doceria Pink Delfins';

  function formatField(id, value) {
    const length = value.length.toString().padStart(2, '0');
    return id + length + value;
  }

  let payloadSemCRC =
    formatField("00", "01") +
    formatField("26",
      formatField("00", "BR.GOV.BCB.PIX") +
      formatField("01", chavePix) +
      formatField("02", descricao)
    ) +
    formatField("52", "0000") +
    formatField("53", "986") +
    formatField("54", valor) +
    formatField("58", "BR") +
    formatField("59", nomeRecebedor) +
    formatField("60", cidade) +
    formatField("62", formatField("05", "***")) +
    "6304";

  function crc16(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
      crc ^= str.charCodeAt(c) << 8;
      for (let i = 0; i < 8; i++) {
        crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  const crc = crc16(payloadSemCRC);
  const payloadFinal = payloadSemCRC + crc;

  const qrCodeDiv = document.getElementById('qrcode');
  qrCodeDiv.innerHTML = '';
  document.getElementById('qrcode-area').style.display = 'block';

  new QRCode(qrCodeDiv, {
    text: payloadFinal,
    width: 250,
    height: 250,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  const info = document.createElement('div');
  info.className = 'nome-valor';
  info.innerHTML = `
    <p><strong>Nome:</strong> ${nomeRecebedor}</p>
    <p><strong>CPF (PIX):</strong> ${chavePix}</p>
    <p><strong>Valor:</strong> R$ ${valor}</p>
  `;
  qrCodeDiv.appendChild(info);
}

function confirmarPagamento() {
  confettiAnimation();
  setTimeout(() => {
    alert('Pagamento confirmado com sucesso! 🎉');
    localStorage.removeItem('carrinho');
    localStorage.removeItem('cupomAplicado'); // CORREÇÃO: Remove a chave correta
    localStorage.removeItem('totalFinal');
    window.location.href = '../principal/index.html';
  }, 2000);
}

function voltar() {
  window.location.href = '../principal/index.html';
}

function confettiAnimation() {
  const duration = 2000;
  const end = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
  const interval = setInterval(() => {
    const timeLeft = end - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    confetti({
      particleCount: 50,
      origin: { x: Math.random(), y: Math.random() - 0.2 },
      ...defaults
    });
  }, 200);
}

// Função para debug manual (pode chamar no console)
window.debugCupom = function() {
  console.log('\n🐛 === DEBUG MANUAL ===');
  verificarStatus();
  calcularValores();
};

// Carregar cupons e já calcular na abertura da página
window.onload = calcularValores; // CORREÇÃO: Chama direto calcularValores