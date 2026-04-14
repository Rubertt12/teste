// --- 1. CONFIGURAÇÕES DE CONEXÃO E FIREBASE ---
const TELEGRAM_TOKEN = '8560555090:AAFvyPipnavN9NW5K78X9DAwwajWmQAMogE'.trim();
const TELEGRAM_CHAT_ID = '5512151890'.trim();

const firebaseConfig = {
    apiKey: "AIzaSyB9qwhZ52B_BuZHYhdzUwytLWoHXqUH9T4",
    authDomain: "inventory-pearl.firebaseapp.com",
    databaseURL: "https://inventory-pearl-default-rtdb.firebaseio.com",
    projectId: "inventory-pearl",
    storageBucket: "inventory-pearl.firebasestorage.app",
    messagingSenderId: "306700164707",
    appId: "1:306700164707:web:29b1b5fcd21d564fe82256"
};

// Inicializa o Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    var database = firebase.database();
}

// Identificador da Sessão
const sessionId = localStorage.getItem('pearl_chat_id') || 'cliente_' + Math.floor(Math.random() * 10000);
localStorage.setItem('pearl_chat_id', sessionId);

// --- 2. BANCO DE DADOS E ESTADOS DO ROBÔ ---
const pearlBotDatabase = {
    "estoque": "O Inventory Pearl utiliza leitura de QR Code e atualização em tempo real para gerir seu estoque.",
    "preço": "Temos planos do Basic ao Diamond. Veja a tabela de preços na página principal.",
    "login": "Se já tem conta, acesse pelo botão 'Acessar Painel'.",
    "ajuda": "Posso ajudar com: Criar Conta (Cadastro), Planos, ou Suporte Técnico."
};

// Variáveis para o fluxo de Cadastro de Usuário (Site)
let modoCadastroUsuario = false;
let etapaCadastro = 0;
let novoUsuario = { nome: "", email: "", senha: "" };

// --- 3. CONTROLE DE INTERFACE (MENU/LOGIN) ---
const mobileMenuBtn = document.getElementById('mobile-menu');
const navMenu = document.getElementById('nav-menu');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuBtn.classList.toggle('open');
    });
}

function toggleLoginMenu() {
    const box = document.getElementById('login-menu-box');
    if (box) box.classList.toggle('show');
}

function toggleLoginHero() {
    const box = document.getElementById('login-hero-box');
    if (box) {
        box.classList.toggle('show');
        if (box.classList.contains('show')) {
            box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function validaLogin(event) {
    if(event) event.preventDefault(); 
    const btn = event.target;
    btn.innerHTML = "<i class='fa-solid fa-circle-notch fa-spin'></i> Acessando...";
    btn.disabled = true;
    setTimeout(() => {
        window.location.href = "https://sistema-de-inventario-pearl.vercel.app/dashboard.html";
    }, 1200);
}

// --- 4. LÓGICA DO CHAT (PEARL ASSIST) ---

function toggleChat() {
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) chatWindow.classList.toggle('show');
}

function escolherOpcao(tipo) {
    const inputArea = document.getElementById('chat-input-field');
    if (tipo === 'chat') {
        exibirMensagemNoEcra("Quero me cadastrar", 'user');
        if (inputArea) inputArea.style.display = 'flex';
        iniciarFluxoCadastro();
    } else {
        window.open("https://wa.me/5551989769982?text=Olá! Preciso de suporte técnico.", "_blank");
    }
}

async function enviarMensagem() {
    const input = document.getElementById('user-input');
    const texto = input.value.trim();
    if (!texto) return;

    exibirMensagemNoEcra(texto, 'user');
    input.value = "";

    // Salva no Firebase
    if (typeof database !== 'undefined') {
        database.ref(`suporte/${sessionId}`).push({ texto: texto, origem: 'cliente', timestamp: Date.now() });
    }

    const textoMinusculo = texto.toLowerCase();

    // REGRA 1: Suporte -> WhatsApp
    if (textoMinusculo.includes("suporte") || textoMinusculo.includes("técnico")) {
        setTimeout(() => {
            exibirMensagemNoEcra("Para suporte técnico, fale com o Rúbertt no WhatsApp:", 'bot');
            exibirMensagemNoEcra("👉 wa.me/5551989769982", 'bot');
        }, 600);
        return;
    }

    // REGRA 2: Fluxo de Cadastro de Usuário no Site
    if (textoMinusculo.includes("cadastrar") || textoMinusculo.includes("criar conta") || modoCadastroUsuario) {
        processarCadastroUsuario(texto);
        return;
    }

    // REGRA 3: Dúvidas Comuns
    let resposta = pearlBotDatabase["ajuda"];
    for (let chave in pearlBotDatabase) {
        if (textoMinusculo.includes(chave)) {
            resposta = pearlBotDatabase[chave];
            break;
        }
    }
    setTimeout(() => exibirMensagemNoEcra(resposta, 'bot'), 600);
}

function iniciarFluxoCadastro() {
    modoCadastroUsuario = true;
    etapaCadastro = 1;
    setTimeout(() => {
        exibirMensagemNoEcra("Ótimo! Vamos criar sua conta. Qual o seu NOME completo?", 'bot');
    }, 800);
}

function processarCadastroUsuario(texto) {
    if (!modoCadastroUsuario) {
        iniciarFluxoCadastro();
        return;
    }

    if (etapaCadastro === 1) {
        novoUsuario.nome = texto;
        etapaCadastro = 2;
        setTimeout(() => exibirMensagemNoEcra(`Prazer, ${texto.split(' ')[0]}! Agora, digite seu melhor E-MAIL:`, 'bot'), 600);
    } 
    else if (etapaCadastro === 2) {
        novoUsuario.email = texto;
        etapaCadastro = 3;
        setTimeout(() => exibirMensagemNoEcra("Quase lá! Agora escolha uma SENHA segura:", 'bot'), 600);
    } 
    else if (etapaCadastro === 3) {
        novoUsuario.senha = texto;
        modoCadastroUsuario = false;
        etapaCadastro = 0;
        
        // Simulação de criação de conta e envio ao admin
        setTimeout(() => {
            exibirMensagemNoEcra(`✅ Conta criada com sucesso para ${novoUsuario.email}!`, 'bot');
            exibirMensagemNoEcra("Você já pode clicar em 'Acessar Painel' para entrar.", 'bot');
        }, 1000);

        // Notifica você no Telegram sobre o novo cadastro
        enviarTelegram(`🆕 *NOVO CADASTRO NO SITE*\n👤 Nome: ${novoUsuario.nome}\n📧 Email: ${novoUsuario.email}`);
    }
}

async function enviarTelegram(mensagem) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: mensagem, parse_mode: 'Markdown' })
        });
    } catch (e) { console.error("Erro Telegram:", e); }
}

// --- 5. RENDERIZAÇÃO ---
function exibirMensagemNoEcra(texto, tipo) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `msg ${tipo}`; // Usa o estilo do style.css
    div.innerText = texto;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

document.getElementById('user-input')?.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') enviarMensagem(); 
});