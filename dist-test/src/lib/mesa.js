"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotePlayer = exports.updatePlayerStatus = exports.getPendingPlayers = exports.getPlayerStatus = exports.requestJoinMesa = exports.joinMesa = exports.createMesa = void 0;
const supabase_1 = require("./supabase");
const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};
const createMesa = async (name, gmId) => {
    const code = generateCode();
    // 1. Criar a mesa
    const { data: mesa, error: mesaError } = await supabase_1.supabase
        .from('mesas')
        .insert([
        {
            name,
            code,
            gm_id: gmId,
            is_active: true,
            settings: { survivor_mode: false }
        }
    ])
        .select()
        .single();
    if (mesaError)
        throw new Error(`Erro ao criar mesa: ${mesaError.message}`);
    // 2. Adicionar o GM como aprovado na tabela mesa_players
    const { error: playerError } = await supabase_1.supabase
        .from('mesa_players')
        .insert({
        mesa_id: mesa.id,
        user_id: gmId,
        status: 'approved',
        role: 'gm'
    });
    if (playerError) {
        console.error("Erro ao adicionar GM aos players:", playerError);
        // Não vamos falhar tudo por isso, mas é bom logar
    }
    return mesa;
};
exports.createMesa = createMesa;
const joinMesa = async (code) => {
    const { data, error } = await supabase_1.supabase
        .from('mesas')
        .select('*')
        .eq('code', code)
        .single();
    if (error)
        throw new Error('Mesa não encontrada ou código inválido.');
    return data;
};
exports.joinMesa = joinMesa;
const requestJoinMesa = async (mesaId, userId) => {
    // Tenta inserir. Se já existir, ignora (ou atualiza se quiser tratar re-tentativas)
    const { error } = await supabase_1.supabase
        .from('mesa_players')
        .upsert({
        mesa_id: mesaId,
        user_id: userId,
        // Se já existir, mantém o status atual (não reseta para pending se já foi banido, por exemplo)
    }, { onConflict: 'mesa_id,user_id', ignoreDuplicates: true });
    // Nota: O comportamento ideal do upsert acima depende da regra de negócio.
    // Se 'ignoreDuplicates: true', ele não faz nada se já existe.
    // Se o usuário foi rejeitado antes e tenta de novo, talvez ele devesse ficar 'pending' de novo?
    // Por enquanto, vamos assumir que se ele já existe, checamos o status depois.
    if (error)
        throw new Error(`Erro ao solicitar entrada: ${error.message}`);
};
exports.requestJoinMesa = requestJoinMesa;
const getPlayerStatus = async (mesaId, userId) => {
    const { data, error } = await supabase_1.supabase
        .from('mesa_players')
        .select('status, role')
        .eq('mesa_id', mesaId)
        .eq('user_id', userId)
        .single();
    if (error)
        return null; // Não existe registro
    return data;
};
exports.getPlayerStatus = getPlayerStatus;
const getPendingPlayers = async (mesaId) => {
    const { data, error } = await supabase_1.supabase
        .from('mesa_players')
        .select('user_id, status, role, profiles(username, avatar_url)')
        .eq('mesa_id', mesaId)
        .eq('status', 'pending');
    if (error)
        throw error;
    return data;
};
exports.getPendingPlayers = getPendingPlayers;
const updatePlayerStatus = async (mesaId, userId, status) => {
    const { error } = await supabase_1.supabase
        .from('mesa_players')
        .update({ status })
        .eq('mesa_id', mesaId)
        .eq('user_id', userId);
    if (error)
        throw error;
};
exports.updatePlayerStatus = updatePlayerStatus;
const promotePlayer = async (mesaId, userId) => {
    const { error } = await supabase_1.supabase
        .from('mesa_players')
        .update({ role: 'gm' })
        .eq('mesa_id', mesaId)
        .eq('user_id', userId);
    if (error)
        throw error;
};
exports.promotePlayer = promotePlayer;
//# sourceMappingURL=mesa.js.map