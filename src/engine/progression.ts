// src/engine/progression.ts
import progressionData from '../data/rules/progression.json';
import allClassesData from '../data/rules/classes.json';
import allPowersData from '../data/rules/powers.json';
import allOriginsData from '../data/rules/origins.json';
import { Character, ClassName, AttributeName } from '../core/types';

export interface NexReward {
    type: 'attribute' | 'power' | 'skill' | 'path' | 'class_change' | 'versatility';
    details: string; // Ex: "attribute_increase_1", "power_1"
    description: string; // Ex: "+1 Ponto de Atributo", "Escolha um Poder de Classe"
    choiceNeeded: boolean;
    data?: any; // Dados adicionais para a escolha (ex: lista de poderes)
}

export interface NexProgressionInfo {
    patent: string;
    limits: {
        maxAttribute: number;
        maxSkill: 'destreinado' | 'treinado' | 'veterano' | 'expert';
    };
    rewards: NexReward[];
    passiveGains: {
        pv: number;
        pe: number;
        san: number;
        slots: number;
    };
}

/**
 * Retorna as informações de progressão para um determinado NEX.
 * Inclui patente, limites e recompensas ativas (escolhas).
 * @param nex O NEX atual do personagem.
 * @param character O personagem atual para contextualizar as recompensas.
 * @returns NexProgressionInfo
 */
export function getProgressionInfo(nex: number, character: Character): NexProgressionInfo | null {
    const progression = (progressionData as any)[nex.toString()];
    if (!progression) return null;

    const rewards: NexReward[] = [];
    
    // Mapear features para recompensas estruturadas
    (progression.features || []).forEach((feature: string) => {
        if (feature.startsWith('attribute_increase')) {
            rewards.push({
                type: 'attribute',
                details: feature,
                description: `Aumento de Atributo (+1)`,
                choiceNeeded: true,
                data: { amount: 1 }
            });
        } else if (feature.startsWith('power_')) {
            // TODO: Filtrar poderes disponíveis para a classe e NEX do personagem
            const classData = (allClassesData as any).classes[character.class];
            const generalPowers = (allPowersData as any).gerais;
            const combatPowers = (allPowersData as any).combate;
            const paranormalPowers = character.affinity ? (allPowersData as any).paranormal[character.affinity] : [];

            const availablePowers = [
                ...generalPowers,
                ...combatPowers,
                ...paranormalPowers
            ].filter((p: any) => {
                // Implementar lógica de pré-requisitos aqui
                // Por enquanto, apenas retorna todos
                return true;
            });

            rewards.push({
                type: 'power',
                details: feature,
                description: `Escolha um Poder de ${character.class === 'mundano' ? 'Origem' : 'Classe'}/Paranormal`,
                choiceNeeded: true,
                data: { availablePowers }
            });
        } else if (feature === 'path_choice') {
            const classData = (allClassesData as any).classes[character.class];
            const availablePaths = classData ? classData.trilhas_base || [] : []; // Assumindo trilhas_base para começar

            rewards.push({
                type: 'path',
                details: feature,
                description: `Escolha sua Trilha`,
                choiceNeeded: true,
                data: { availablePaths }
            });
        } else if (feature === 'class_choice') { // Para Sobrevivente -> Classe
             const classesOptions = Object.keys((allClassesData as any).classes)
                                    .filter(cls => cls !== 'Sobrevivente') // Não pode escolher Sobrevivente novamente
                                    .map(clsKey => ({ id: clsKey, name: clsKey, description: (allClassesData as any).classes[clsKey].description_short })); // Adicionar descrição curta se existir
             rewards.push({
                type: 'class_change',
                details: feature,
                description: `Escolha sua Classe`,
                choiceNeeded: true,
                data: { availableClasses: classesOptions }
            });
        } else if (feature === 'versatility') {
            rewards.push({
                type: 'versatility',
                details: feature,
                description: `Versatilidade (Poder de Origem ou Classe Adicional)`,
                choiceNeeded: true,
                data: { sanityCost: '1d6' } // Custo de Sanidade para a Transcendência (placeholder)
            });
        }
        // TODO: Adicionar outros tipos de features (skill, path_power, etc.)
    });

    // Calcular ganhos passivos de PV, PE, SAN (apenas como placeholder por enquanto)
    // A lógica real de cálculo de PV/PE/SAN baseada em NEX e Atributos Vig/Pre já existe no recalculateCharacter
    // Aqui estamos apenas preenchendo o molde, mas o recalculateCharacter fará o trabalho pesado
    const passiveGains = { pv: 0, pe: 0, san: 0, slots: 0 }; 

    return {
        patent: progression.patent,
        limits: progression.limits,
        rewards,
        passiveGains
    };
}

/**
 * Calcula os ganhos de PV, PE, SAN e Carga entre dois NEX, com base na classe e atributos.
 * Isso é útil para mostrar ao jogador "o que ele ganhou de automático".
 * @param oldChar Estado antigo do personagem.
 * @param newCharState Estado novo do personagem (após aplicar escolhas).
 * @returns Objeto com os deltas de PV, PE, SAN, Slots.
 */
export function calculatePassiveStatGains(oldChar: Character, newCharState: Character) {
    // Para obter os ganhos passivos, precisamos simular o recalculateCharacter
    // em ambos os estados (antigo e novo) e comparar.
    // Isso é complexo e depende de ter os atributos e classe corretos no 'newCharState'.
    // Por enquanto, vamos retornar 0, e a lógica de recalculateCharacter no store
    // irá garantir que os stats_max estejam corretos após o level up.
    // O modal pode apenas MOSTRAR os novos stats_max.

    return {
        pvDelta: newCharState.stats_max.pv - oldChar.stats_max.pv,
        peDelta: newCharState.stats_max.pe - oldChar.stats_max.pe,
        sanDelta: newCharState.stats_max.san - oldChar.stats_max.san,
        slotsDelta: newCharState.inventory_slots_max - oldChar.inventory_slots_max
    };
}

// Futuramente, funções para listar poderes/perícias disponíveis para escolha.
