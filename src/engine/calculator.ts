import { Character, Item } from '../core/types';

export function getProgressionLimits(nex: number) {
    if (nex < 5) return { maxAttribute: 3, maxSkill: 'destreinado' };
    if (nex < 20) return { maxAttribute: 3, maxSkill: 'treinado' };
    if (nex < 50) return { maxAttribute: 4, maxSkill: 'treinado' };
    if (nex < 80) return { maxAttribute: 5, maxSkill: 'veterano' };
    return { maxAttribute: 5, maxSkill: 'expert' };
}

export function calculateSkillBonus(char: Character, skillName: string, attributeName: string): number {
    const trainingLevel = char.skills[skillName] || 0; // 0=destreinado, 5=treinado, etc.
    const attrValue = char.attributes[attributeName as keyof typeof char.attributes] || 0;
    
    // Em Ordem Paranormal, geralmente você rola Atributo d20 + Perícia.
    // Mas para testes simples, muitas vezes soma-se tudo. 
    // Vamos retornar o valor fixo do BÔNUS DE PERÍCIA (treinamento + itens).
    // O atributo define DADOS, não bônus fixo na maioria das rolagens modernas de OP, mas em algumas versões soma.
    // Vou assumir regra padrão 1.1: Bônus = Treinamento + Itens. Dados = Atributo.
    
    return trainingLevel; // Retorna +5, +10, +15.
}

export function recalculateCharacter(char: Character, items: Item[]): Character {
    const newChar = { ...char };

    // Patente
    if (char.nex < 5) newChar.patente = 'Mundano';
    else if (char.nex < 10) newChar.patente = 'Recruta';
    else if (char.nex < 25) newChar.patente = 'Operador';
    else if (char.nex < 50) newChar.patente = 'Agente Especial';
    else if (char.nex < 85) newChar.patente = 'Oficial de Operações';
    else newChar.patente = 'Agente de Elite';

    const classRules: Record<string, any> = {
        "combatente": { pvBase: 20, pvNex: 5, peBase: 2, peNex: 2, sanBase: 12, sanNex: 3 },
        "especialista": { pvBase: 16, pvNex: 4, peBase: 3, peNex: 3, sanBase: 16, sanNex: 4 },
        "ocultista": { pvBase: 12, pvNex: 3, peBase: 4, peNex: 4, sanBase: 20, sanNex: 5 }
    };

    const rules = classRules[char.class.toLowerCase()] || classRules["combatente"];
    const nexSteps = Math.floor(char.nex / 5);

    // Stats
    newChar.stats_max.pv = rules.pvBase + char.attributes.vig + (rules.pvNex * (nexSteps - 1));
    newChar.stats_max.pe = rules.peBase + char.attributes.pre + (rules.peNex * (nexSteps - 1));
    newChar.stats_max.san = rules.sanBase + (rules.sanNex * (nexSteps - 1));

    // Defesa
    let armorBonus = 0;
    items.forEach(item => {
        if (item.category === 'equipamento' && item.stats.defense_bonus) { // Assumindo 'equipamento' inclui proteções
            armorBonus += item.stats.defense_bonus;
        }
    });
    newChar.defenses.passiva = 10 + char.attributes.agi + armorBonus;

    // Carga
    newChar.inventory_slots_max = 5 + char.attributes.for;

    return newChar;
}
