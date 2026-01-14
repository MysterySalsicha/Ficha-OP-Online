import { Character, AttributeName, ActionResult, RitualRule, Item } from '../core/types';
import { getProgressionLimits } from './calculator';

/**
 * Validates if an attribute can be increased.
 */
export function validateAttributeIncrease(char: Character, attr: AttributeName): ActionResult {
    const limits = getProgressionLimits(char.nex);
    const currentVal = char.attributes[attr];

    if (currentVal >= limits.maxAttribute) {
        if (char.is_gm_mode) {
             return { success: true, message: "GM Override: Limite ignorado." };
        }
        return {
            success: false,
            message: "Limite Atingido",
            explanation: `Seu NEX ${char.nex}% (Patente ${char.patente}) limita atributos a ${limits.maxAttribute}. Avance de NEX para aumentar mais.`
        };
    }

    return { success: true, message: "Aumento válido" };
}

/**
 * Validates if a ritual can be cast (PE cost check).
 * Future: Check components, circle, etc.
 */
export function validateRitualCast(char: Character, ritual: RitualRule): ActionResult {
    // 1. Check PE
    if (char.stats_current.pe < ritual.cost_pe) {
        if (char.is_gm_mode) {
             return { success: true, message: "GM Override: PE ignorado." };
        }
        return {
            success: false,
            message: "PE Insuficiente",
            explanation: `Você tem ${char.stats_current.pe} PE, mas o ritual ${ritual.name} custa ${ritual.cost_pe} PE. Descanse ou use habilidades para recuperar PE.`
        };
    }

    // 2. Check Circle vs NEX (Example rule: Circle 1=NEX 1, Circle 2=NEX 25, Circle 3=NEX 55, Circle 4=NEX 85)
    // Simplified check
    const requiredNex = [0, 1, 25, 55, 85][ritual.circle] || 0;
    if (char.nex < requiredNex) {
         if (char.is_gm_mode) {
             return { success: true, message: "GM Override: Círculo ignorado." };
        }
        return {
            success: false,
            message: "Círculo Bloqueado",
            explanation: `Rituais de ${ritual.circle}º Círculo exigem NEX ${requiredNex}%.`
        };
    }

    return { success: true, message: "Conjuração válida" };
}

/**
 * Validates if an item can be equipped/carried (Inventory slots).
 */
export function validateItemAdd(char: Character, itemWeight: number, currentWeight: number): ActionResult {
    // Weight in Ordem is "Slots" (espaços).
    if (currentWeight + itemWeight > char.inventory_slots_max) {
         // This is usually a soft limit (Overburdened) not a hard block, but the user asked for rigid rules.
         // Let's warn but allow with "Sobrecarregado" status, OR block if explicitly requested.
         // User prompt: "Motor de regras blindado: validações atômicas, mensagens educativas... Bloqueado: PE insuficiente"
         // Doesn't explicitly say block inventory overflow, but "valid states".
         // Let's allow it but set a flag (logic elsewhere), or block if extreme.

         // For now, return success but with a warning in message?
         // Actually, let's treat it as a validation for *picking up* - maybe block if too heavy?
         // Let's stick to standard RPG: You CAN carry more but you get penalties.
         // So validation passes, but explanation warns.

         return {
             success: true,
             message: "Sobrecarregado!",
             explanation: "Você excedeu seu limite de carga. Sofrerá penalidades de deslocamento e testes."
         };
    }
    return { success: true, message: "Item adicionado" };
}

/**
 * Validates attack execution (Ammo check).
 */
export function validateAttack(char: Character, weapon: Item, ammoItem?: Item): ActionResult {
    // Check if weapon uses ammo
    if (weapon.category === 'arma' && weapon.stats.uses_ammo) {
        if (!ammoItem) {
             return { success: false, message: "Sem munição equipada/selecionada" };
        }
        if (ammoItem.quantity < 1) {
             return { success: false, message: "Munição esgotada" };
        }
    }
    return { success: true, message: "Ataque válido" };
}
