import { Character, Item, ClassName } from '../core/types';
import classesData from '../data/rules/classes.json';
import progressionData from '../data/rules/progression.json';

function getClassData(className: string): any {
  const key = className.charAt(0).toUpperCase() + className.slice(1);
  // @ts-ignore
  return classesData.classes[key];
}

export function getProgressionLimits(nex: number) {
  // Use progression.json or logic
  // For now, keep the logic consistent with simple rules or progressionData if needed.
  // Using simple hardcoded for speed matching existing:
    if (nex < 5) return { maxAttribute: 3, maxSkill: 'destreinado' };
    if (nex < 20) return { maxAttribute: 3, maxSkill: 'treinado' };
    if (nex < 50) return { maxAttribute: 4, maxSkill: 'treinado' };
    if (nex < 80) return { maxAttribute: 5, maxSkill: 'veterano' };
    return { maxAttribute: 5, maxSkill: 'expert' };
}

export function calculateMaxStats(char: Character) {
    const cls = getClassData(char.class);
    if (!cls) {
         // Fallback or error
         return { ...char.stats_max, slots: char.inventory_slots_max };
    }

    const nex = char.nex;
    const vig = char.attributes.vig;
    const pre = char.attributes.pre;
    
    // Survivor Mode Special Logic
    if (char.class === 'sobrevivente') {
        const stage = char.survivor_stage || 1;
        // Check if data exists, otherwise fallback
        const pv = (cls.pv_inicial || 8) + vig + (stage - 1) * ((cls.pv_por_estagio || 2) + vig);
        const pe = (cls.pe_inicial || 2) + pre + (stage - 1) * ((cls.pe_por_estagio || 1) + pre);
        const san = (cls.san_inicial || 8) + (stage - 1) * (cls.san_por_estagio || 2);
        const slots = 5 + (char.attributes.for * 5);
        return { pv, pe, san, slots };
    }

    // Standard NEX Logic
    const levels = Math.floor(nex / 5);
    const pv = cls.pv_inicial + vig + (levels - 1) * (cls.pv_por_nex + vig);
    const pe = cls.pe_inicial + pre + (levels - 1) * (cls.pe_por_nex + pre);
    const san = cls.san_inicial + (levels - 1) * cls.san_por_nex;
    const slots = 5 + (char.attributes.for * 5);

    return { pv, pe, san, slots };
}

export function calculateSkillBonus(char: Character, skillName: string, attributeName: string): number {
    const trainingLevel = char.skills[skillName] || 0;
    return trainingLevel;
}

export function recalculateCharacter(char: Character, items: Item[]): Character {
    const newChar = { ...char };

    // Patente
    if (char.class === 'sobrevivente' || char.nex < 5) newChar.patente = 'Mundano';
    else if (char.nex < 10) newChar.patente = 'Recruta';
    else if (char.nex < 25) newChar.patente = 'Operador';
    else if (char.nex < 50) newChar.patente = 'Agente Especial';
    else if (char.nex < 85) newChar.patente = 'Oficial de Operações';
    else newChar.patente = 'Agente de Elite';

    const { pv, pe, san, slots } = calculateMaxStats(char);

    newChar.stats_max = { pv, pe, san };
    newChar.inventory_slots_max = slots;

    // Defesa
    let armorBonus = 0;
    items.forEach(item => {
        if (item.category === 'equipamento' && item.stats.defense_bonus) {
            armorBonus += item.stats.defense_bonus;
        }
    });
    newChar.defenses.passiva = 10 + char.attributes.agi + armorBonus;

    return newChar;
}
