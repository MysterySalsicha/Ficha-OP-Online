"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAttributeIncrease = validateAttributeIncrease;
exports.validateRitualCast = validateRitualCast;
exports.validateItemAdd = validateItemAdd;
exports.validateAttack = validateAttack;
exports.validateClassChange = validateClassChange;
const calculator_1 = require("./calculator");
/**
 * Validates if an attribute can be increased.
 */
function validateAttributeIncrease(char, attr) {
    const limits = (0, calculator_1.getProgressionLimits)(char.nex);
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
 */
function validateRitualCast(char, ritual) {
    // 1. Check PE
    if (char.stats_current.pe < ritual.cost_pe) {
        if (char.is_gm_mode) {
            return { success: true, message: "GM Override: PE ignorado." };
        }
        return {
            success: false,
            message: "PE Insuficiente",
            explanation: `Você tem ${char.stats_current.pe} PE, mas o ritual ${ritual.name} custa ${ritual.cost_pe} PE.`
        };
    }
    // 2. Check Circle vs NEX
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
 * Validates if an item can be equipped/carried.
 */
function validateItemAdd(char, itemWeight, currentWeight) {
    if (currentWeight + itemWeight > char.inventory_slots_max) {
        return {
            success: true,
            message: "Sobrecarregado!",
            explanation: "Você excedeu seu limite de carga. Sofrerá penalidades."
        };
    }
    return { success: true, message: "Item adicionado" };
}
/**
 * Validates attack execution (Ammo check).
 */
function validateAttack(char, weapon, ammoItem) {
    if (weapon.category === 'arma' && weapon.stats.uses_ammo) {
        if (!ammoItem) {
            return { success: false, message: "Sem munição", explanation: "Esta arma exige munição para disparar." };
        }
        if (ammoItem.quantity < 1) {
            return { success: false, message: "Munição esgotada", explanation: "Você não tem munição suficiente." };
        }
        // Check compatibility? (e.g. ammo type matches weapon type)
        // For now, assume user selected correct ammo.
    }
    return { success: true, message: "Ataque válido" };
}
/**
 * Validates Class Transition
 */
function validateClassChange(char, newClass) {
    // Survivor Rule: Can only change if Stage 5 (or ready to graduate)
    if (char.class === 'sobrevivente') {
        const stage = char.survivor_stage || 0;
        if (stage < 5) {
            if (char.is_gm_mode)
                return { success: true, message: "GM Override: Estágio ignorado." };
            return { success: false, message: "Ainda Sobrevivendo", explanation: "Você precisa completar os 5 estágios de Sobrevivente antes de escolher uma classe." };
        }
    }
    // Initial Creation Rule: If changing from 'mundano' (or null) to Class, must be NEX 5?
    // Usually handled by flow, but good to have check.
    return { success: true, message: "Classe permitida" };
}
//# sourceMappingURL=validator.js.map