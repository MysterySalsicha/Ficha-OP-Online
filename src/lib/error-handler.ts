/**
 * Traduz erros técnicos do Supabase/Fetch para mensagens amigáveis em Português.
 */
export const translateError = (error: any): string => {
    const message = error?.message || String(error);

    if (message.includes('Failed to fetch')) {
        return "Sem conexão com os servidores da Ordem. Verifique sua internet.";
    }

    if (message.includes('Invalid login credentials')) {
        return "Credenciais inválidas. Verifique seu e-mail e senha.";
    }

    if (message.includes('User already registered')) {
        return "Este e-mail já está recrutado pela Ordem. Tente fazer login.";
    }

    if (message.includes('Password should be at least 6 characters')) {
        return "A senha de segurança deve ter pelo menos 6 caracteres.";
    }

    if (message.includes('Email not confirmed')) {
        return "Verifique seu e-mail para confirmar seu recrutamento antes de entrar.";
    }

    if (message.includes('Project not found') || message.includes('apikey')) {
        return "Erro de Configuração: As chaves da Ordem não foram encontradas no .env";
    }

    // Erros genéricos de validação do Postgres
    if (message.includes('duplicate key value')) {
        return "Este registro já existe na base de dados.";
    }

    return `Erro inesperado: ${message}`;
};
