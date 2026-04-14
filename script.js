// --- 1. CONFIGURAÇÕES DE CONEXÃO (Inventory Pearl) ---
// Token e ID limpos de qualquer espaço invisível para evitar erro 401
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

// Inicializa o Firebase de forma segura
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    var database = firebase.database();
} else {
    console.warn("Firebase não detetado. Verifique os links no index.html");
}

// Identificador da Sessão do Cliente (Persistente no navegador)
const sessionId = localStorage.getItem('pearl_chat_id') || 'cliente_' + Math.floor(Math.random() * 10000);
localStorage.setItem('pearl_chat_id', sessionId);

// --- 2. CONTROLE DO MENU MOBILE ---
const mobileMenuBtn = document.getElementById('mobile-menu');
const navMenu = document.getElementById('nav-menu');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuBtn.classList.toggle('open');
    });
}

// --- 3. CONTROLES DE LOGIN E NAVEGAÇÃO ---
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

function validaLogin() {
    if(event) event.preventDefault(); 
    const btn = event.target;
    btn.innerHTML = "<i class='fa-solid fa-circle-notch fa-spin'></i> Acessando...";
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = "https://sistema-de-inventario-pearl.vercel.app/dashboard.html";
    }, 1200);
}

// --- 4. LÓGICA DO CHAT DE SUPORTE PEARL ASSIST ---

function toggleChat() {
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) chatWindow.classList.toggle('show');
}

function escolherOpcao(tipo) {
    const inputArea = document.getElementById('chat-input-field');
    if (tipo === 'chat') {
        exibirMensagemNoEcra("Seguir pelo Chat", 'user');
        if (inputArea) inputArea.style.display = 'flex';
        setTimeout(() => {
            exibirMensagemNoEcra("Digite sua dúvida abaixo. O técnico Rúbertt responderá aqui.", 'bot');
        }, 600);
    } else {
        window.open("https://wa.me/5551989769982?text=Olá! Preciso de suporte com o Inventory Pearl.", "_blank");
    }
}

async function enviarMensagem() {
    const input = document.getElementById('user-input');
    const texto = input.value.trim();
    if (!texto) return;

    exibirMensagemNoEcra(texto, 'user');
    input.value = "";

    // 1. Grava no Firebase para o teu histórico de técnico
    if (typeof database !== 'undefined') {
        database.ref(`suporte/${sessionId}`).push({
            texto: texto,
            origem: 'cliente',
            timestamp: Date.now()
        });
    }

    // 2. Envia para o teu Telegram (URL corrigida para evitar erro 401)
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: `💎 *NOVO CHAMADO PEARL*\n👤 ID: ${sessionId}\n💬: ${texto}`,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.error("Erro na API do Telegram:", e);
    }
}

// Função para renderizar as mensagens no ecrã com o estilo Glassmorphism
function exibirMensagemNoEcra(texto, tipo) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `msg ${tipo}`;
    div.innerText = texto;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// Escuta em tempo real quando o técnico (você) responde via Firebase
if (typeof database !== 'undefined') {
    database.ref(`suporte/${sessionId}`).on('child_added', (snapshot) => {
        const msg = snapshot.val();
        // Apenas mensagens marcadas como 'admin' aparecem como balão do bot
        if (msg.origem === 'admin') {
            exibirMensagemNoEcra(msg.texto, 'bot');
        }
    });
}

// Atalho para enviar mensagem ao pressionar Enter
document.getElementById('user-input')?.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') enviarMensagem(); 
});