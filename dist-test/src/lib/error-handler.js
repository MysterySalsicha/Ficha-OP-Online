"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateError = void 0;
/**
 * Traduz erros técnicos do Supabase/Fetch para mensagens amigáveis em Português.
 */
const translateError = (error) => {
    const message = (error === null || error === void 0 ? void 0 : error.message) || String(error);
    if (message.includes('Failed to fetch')) {
        return "Sem conexão com os servidores da Ordem. Verifique sua internet.";
    }
    if (message.includes('Invalid login credentials')) {
        return "Credenciais inválidas. Verifique seu e-mail e senha.";
    }
    if (message.includes('User already registered')) {
        return "Este e-mail já está recrutado pela Ordem. Tente fazer login.";
    }
    if (message.includes('Database error saving new user')) {
        return "Este nome de agente já está em uso por outro recruta. Escolha um codinome diferente.";
    }
    if (message.includes('Password should be at least 6 characters')) {
        return "A senha de segurança deve ter pelo menos 6 caracteres.";
    }
    if (message.includes('Email not confirmed')) {
        return "Este acesso ainda não foi liberado. O mestre precisa desabilitar a confirmação de e-mail no painel da Ordem ou confirmar seu acesso manualmente.";
    }
    if (message.includes('duplicate key value')) {
        if (message.includes('username'))
            return "Este nome de agente já está em uso.";
        return "Este registro já existe na base de dados.";
    }
    return `Erro inesperado: ${message}`;
};
exports.translateError = translateError;
//# sourceMappingURL=error-handler.js.map