// --- 1. CONFIGURAÇÕES E INFRAESTRUTURA ---
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

if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    var database = firebase.database();
}

const sessionId = localStorage.getItem('pearl_chat_id') || 'PRL-' + Math.floor(1000 + Math.random() * 9000);
localStorage.setItem('pearl_chat_id', sessionId);

let userName = localStorage.getItem('pearl_user_name') || "";
let statusCadastro = { ativo: false, etapa: 0, dados: {} };

const faq = {
    "estoque": "O sistema utiliza tecnologia QR Code para rastreio granular. Suporta múltiplas unidades e alertas de stock baixo.",
    "preço": "Modelos SaaS: Basic (até 50 itens), Pro (Ilimitado) e Diamond (Customizado).",
    "acesso": "Painel administrativo disponível via autenticação dupla no menu superior.",
    "segurança": "Criptografia AES-256 e backups automáticos em nuvem."
};

// Estilo padrão para os botões do chat (Garante visibilidade)
const btnStyle = "background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.4); color: #ffffff; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 11px; text-transform: uppercase; font-weight: 600; transition: 0.3s; margin: 4px 2px; display: inline-block;";

// --- 2. CONTROLO DE INTERFACE ---

function toggleChat() {
    const chat = document.getElementById('chat-window');
    if (chat) chat.classList.toggle('show');
}

function escolherOpcao(tipo) {
    const inputContainer = document.getElementById('chat-input-field');
    const menuInicial = document.querySelector('.chat-options');

    if (tipo === 'chat') {
        exibirMensagem("Conexão solicitada via chat.", 'user');
        if (menuInicial) menuInicial.style.display = 'none';
        if (inputContainer) inputContainer.style.display = 'flex';

        setTimeout(() => {
            if (!userName) {
                exibirMensagem("Pearl Assist ativo. Identifique-se com o seu nome para gerar o protocolo.", 'bot');
            } else {
                fluxoPrincipal();
            }
        }, 500);
    } else {
        window.open(`https://wa.me/5551989769982?text=Protocolo_${sessionId}:_Suporte_para_${userName}`, "_blank");
    }
}

// --- 3. CORE DO ATENDIMENTO ---

function fluxoPrincipal() {
    const html = `
        <div style="border-left: 2px solid #25d366; padding-left: 10px; margin-bottom: 12px; font-size: 0.85rem;">
            <strong>Protocolo:</strong> ${sessionId}<br>
            <strong>Status:</strong> Online
        </div>
        <p style="margin-bottom: 10px;">Olá ${userName}. Selecione um módulo:</p>
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            <button onclick="comando('Gestão de Estoque')" style="${btnStyle}">Estoque</button>
            <button onclick="comando('Solicitar Cadastro')" style="${btnStyle}">Novo Cadastro</button>
            <button onclick="comando('Falar com Técnico')" style="${btnStyle} border-color: #25d366; background: rgba(37,211,102,0.2);">Suporte Direto</button>
        </div>
        <div style="margin-top:15px; font-size:10px; opacity:0.8; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; font-family: monospace; color: #fff; line-height: 1.2;">
            > SISTEMA ATIVO<br>
            > Digite #sair para encerrar<br>
            > Digite #ajuda para comandos
        </div>
    `;
    exibirMensagem(html, 'bot', true);
}

function comando(t) {
    const inp = document.getElementById('user-input');
    if (inp) { inp.value = t; enviarMensagem(); }
}

async function enviarMensagem() {
    const input = document.getElementById('user-input');
    const msg = input.value.trim();
    if (!msg) return;

    if (msg.toLowerCase() === '#sair') { resetSessao(); return; }
    if (msg.toLowerCase() === '#ajuda') { 
        exibirMensagem("Comandos: #sair, #status, #faq.", 'bot'); 
        input.value = ""; 
        return; 
    }

    exibirMensagem(msg, 'user');
    input.value = "";

    if (!userName) {
        if (msg.length < 3) {
            exibirMensagem("Informe um nome válido.", 'bot');
            return;
        }
        userName = msg;
        localStorage.setItem('pearl_user_name', userName);
        setTimeout(() => { 
            exibirMensagem(`Acesso autorizado: ${userName}.`, 'bot'); 
            fluxoPrincipal(); 
        }, 600);
        return;
    }

    const lowMsg = msg.toLowerCase();

    if (lowMsg.includes("suporte") || lowMsg.includes("técnico")) {
        const link = `<a href="https://wa.me/5551989769982" target="_blank" style="display:block; background:#25d366; color:#fff; text-align:center; padding:10px; border-radius:4px; text-decoration:none; margin-top:10px; font-weight:bold; font-size:11px;">ABRIR WHATSAPP</a>`;
        setTimeout(() => exibirMensagem(`Encaminhando suporte humano: ${link}`, 'bot', true), 500);
        return;
    }

    if (statusCadastro.ativo || lowMsg.includes("cadastrar") || lowMsg.includes("conta")) {
        executarCadastro(msg);
        return;
    }

    let r = "";
    if (lowMsg.includes("estoque")) r = faq.estoque;
    else if (lowMsg.includes("preço") || lowMsg.includes("plano")) r = faq.preço;
    else if (lowMsg.includes("login") || lowMsg.includes("acesso")) r = faq.acesso;
    else if (lowMsg.includes("seguro")) r = faq.segurança;

    if (r) {
        setTimeout(() => { 
            exibirMensagem(r, 'bot');
            // Re-exibe opções após FAQ para não deixar o usuário perdido
            setTimeout(() => fluxoPrincipal(), 2000);
        }, 400);
    } else {
        setTimeout(() => { 
            exibirMensagem("Comando não reconhecido. Tente os botões acima.", 'bot'); 
        }, 500);
    }

    if (typeof database !== 'undefined') {
        database.ref(`suporte/${sessionId}`).push({ msg, origem: 'user', nome: userName, time: Date.now() });
    }
}

function executarCadastro(t) {
    if (!statusCadastro.ativo) {
        statusCadastro.ativo = true;
        statusCadastro.etapa = 1;
        setTimeout(() => exibirMensagem("Digite o seu e-mail corporativo:", 'bot'), 500);
        return;
    }
    if (statusCadastro.etapa === 1) {
        if (!t.includes("@")) {
            exibirMensagem("E-mail inválido. Tente novamente:", 'bot');
            return;
        }
        statusCadastro.dados.email = t;
        statusCadastro.etapa = 2;
        setTimeout(() => exibirMensagem("Defina uma senha (mín. 6 caracteres):", 'bot'), 500);
    } else if (statusCadastro.etapa === 2) {
        if (t.length < 6) {
            exibirMensagem("Senha curta demais:", 'bot');
            return;
        }
        statusCadastro.dados.senha = t;
        statusCadastro.ativo = false;
        setTimeout(() => { 
            exibirMensagem(`Solicitação de conta (${statusCadastro.dados.email}) enviada.`, 'bot');
            fluxoPrincipal();
        }, 800);
        notificarTelegram(`[CADASTRO] ${userName} - ${statusCadastro.dados.email}`);
    }
}

// --- 4. UTILITÁRIOS ---

function exibirMensagem(texto, tipo, html = false) {
    const c = document.getElementById('chat-messages');
    if (!c) return;
    const d = document.createElement('div');
    d.className = `msg ${tipo}`;
    // Adiciona estilo inline para garantir que o balão não esconda os botões
    d.style.overflow = "visible"; 
    
    html ? d.innerHTML = texto : d.innerText = texto;
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
}

function resetSessao() {
    exibirMensagem("Encerrando conexão...", 'bot');
    localStorage.removeItem('pearl_user_name');
    localStorage.removeItem('pearl_chat_id');
    setTimeout(() => location.reload(), 1000);
}

async function notificarTelegram(m) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    try { 
        await fetch(url, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: m }) 
        }); 
    } catch (e) { console.error("Telegram Error"); }
}

document.getElementById('user-input')?.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') enviarMensagem(); 
});