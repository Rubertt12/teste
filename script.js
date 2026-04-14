// --- 1. CONFIGURAÇÕES DE CONEXÃO (Inventory Pearl) ---
const TELEGRAM_TOKEN = '8560555090:AAFvyPipnavN9NW5K78X9DAwwajWmQAMogE';
const TELEGRAM_CHAT_ID = '5512151890';

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

// Identificador da Sessão do Cliente
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

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        if(navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            mobileMenuBtn.classList.remove('open');
        }
    });
});

// --- 3. CONTROLES DE LOGIN ---
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
    const originalText = btn.innerHTML;
    
    btn.innerHTML = "<i class='fa-solid fa-circle-notch fa-spin'></i> Acessando...";
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.href = "https://sistema-de-inventario-pearl.vercel.app/dashboard.html";
    }, 1200);
}

// --- 4. LÓGICA DO CHAT DE SUPORTE REAL ---

function toggleChat() {
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) chatWindow.classList.toggle('show');
}

function escolherOpcao(tipo) {
    const container = document.getElementById('chat-messages');
    const inputArea = document.getElementById('chat-input-field');

    if (tipo === 'chat') {
        exibirMensagemNoEcra("Seguir pelo Chat", 'user');
        if (inputArea) inputArea.style.display = 'flex';
        
        setTimeout(() => {
            exibirMensagemNoEcra("Perfeito! Digite sua dúvida abaixo e o técnico Rúbertt responderá aqui.", 'bot');
            const input = document.getElementById('user-input');
            if (input) input.focus();
        }, 600);
    } else {
        window.open("https://wa.me/5551989769982?text=Olá! Preciso de suporte com o Inventory Pearl.", "_blank");
    }
}

async function enviarMensagem() {
    const input = document.getElementById('user-input');
    if (!input) return;
    
    const texto = input.value.trim();
    if (texto === "") return;

    // 1. Exibe no chat do site
    exibirMensagemNoEcra(texto, 'user');
    input.value = "";

    // 2. Salva no Firebase para histórico/resposta do Admin
    if (typeof database !== 'undefined') {
        database.ref(`suporte/${sessionId}`).push({
            texto: texto,
            origem: 'cliente',
            timestamp: Date.now()
        });
    }

    // 3. Envia Notificação para o seu Telegram
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: `💎 *NOVO CHAMADO PEARL*\n\n👤 ID: ${sessionId}\n💬 Mensagem: ${texto}`,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.error("Erro ao contactar o Telegram:", e);
    }
}

function exibirMensagemNoEcra(texto, tipo) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = `msg ${tipo}`;
    div.innerText = texto;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// Escuta respostas do técnico via Firebase (Aparece no balão branco)
if (typeof database !== 'undefined') {
    database.ref(`suporte/${sessionId}`).on('child_added', (snapshot) => {
        const msg = snapshot.val();
        if (msg.origem === 'admin') {
            exibirMensagemNoEcra(msg.texto, 'bot');
        }
    });
}

// Atalho Tecla Enter
document.getElementById('user-input')?.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') enviarMensagem(); 
});

// Fecha dropdowns ao clicar fora
window.onclick = function(event) {
    if (!event.target.matches('.btn-login-nav') && !event.target.matches('.btn-acessar-painel')) {
        const dropdown = document.getElementById('login-menu-box');
        if (dropdown && dropdown.classList.contains('show') && !dropdown.contains(event.target)) {
            dropdown.classList.remove('show');
        }
    }
};