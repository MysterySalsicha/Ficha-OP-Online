import { DieRoll } from '../core/types';

interface RollResult {
    total: number;
    results: number[];
    diceCode: string;
    isCritical: boolean;
    details: string; // Ex: "Maior de [5, 18, 3]" ou "Soma [4, 6]"
}

/**
 * Rola dados baseado no código (ex: "3d20", "2d8+5").
 * @param code Código do dado.
 * @param type Tipo de rolagem: 'atributo' (pega maior) ou 'dano' (soma).
 * @param threat Margem de ameaça (para verificar crítico em testes de atributo).
 */
export function rollDice(code: string, type: 'atributo' | 'dano' = 'atributo', threat: number = 20, baseBonus: number = 0, advantageModifier: number = 0): RollResult {
    // Parser simples: N d X + B
    const match = code.toLowerCase().match(/^(\d*)d(\d+)([+-]\d+)?$/);
    
    if (!match) {
        // Fallback para input numérico simples ou inválido
        return { total: 0, results: [], diceCode: code, isCritical: false, details: "Inválido" };
    }

    const count = parseInt(match[1]) || 1;
    const faces = parseInt(match[2]);
    const bonus = parseInt(match[3]) || 0;

    let allResults: number[] = [];
    if (type === 'dano' || (type === 'atributo' && advantageModifier === 0 && count > 0)) {
        for (let i = 0; i < count; i++) {
            allResults.push(Math.floor(Math.random() * faces) + 1);
        }
    }

    let total = 0;
    let details = '';
    let isCritical = false;
    let returnedResults: number[] = []; // Para armazenar os dados que serão efetivamente mostrados

    if (type === 'atributo') {
        let chosenRoll: number;

        if (advantageModifier === 1) { // Vantagem
            const r1 = Math.floor(Math.random() * faces) + 1;
            const r2 = Math.floor(Math.random() * faces) + 1;
            returnedResults = [r1, r2];
            chosenRoll = Math.max(r1, r2);
            details = `Maior de [${r1}, ${r2}]` + (baseBonus ? ` ${baseBonus > 0 ? '+' : ''}${baseBonus}` : '');
        } else if (advantageModifier === -1) { // Desvantagem
            const r1 = Math.floor(Math.random() * faces) + 1;
            const r2 = Math.floor(Math.random() * faces) + 1;
            returnedResults = [r1, r2];
            chosenRoll = Math.min(r1, r2);
            details = `Menor de [${r1}, ${r2}]` + (baseBonus ? ` ${baseBonus > 0 ? '+' : ''}${baseBonus}` : '');
        } else { // Normal (usa a lógica baseada no count)
            if (count <= 0) { // Caso de atributo 0, rola 2d20 e pega o menor
                const r1 = Math.floor(Math.random() * faces) + 1;
                const r2 = Math.floor(Math.random() * faces) + 1;
                returnedResults = [r1, r2];
                chosenRoll = Math.min(r1, r2);
                details = `Menor de [${r1}, ${r2}]` + (baseBonus ? ` ${baseBonus > 0 ? '+' : ''}${baseBonus}` : '');
            } else { // Rolagem normal baseada no atributo
                returnedResults = allResults;
                chosenRoll = Math.max(...returnedResults);
                details = `Maior de [${returnedResults.join(', ')}]` + (baseBonus ? ` ${baseBonus > 0 ? '+' : ''}${baseBonus}` : '');
            }
        }
        
        total = chosenRoll + baseBonus;
        if (chosenRoll >= threat) isCritical = true;

    } else {
        // Regra de Dano: Soma tudo.
        returnedResults = allResults;
        total = allResults.reduce((a, b) => a + b, 0) + bonus + baseBonus;
        details = `Soma [${allResults.join(', ')}]` + (bonus + baseBonus ? ` ${bonus + baseBonus > 0 ? '+' : ''}${bonus + baseBonus}` : '');
    }

    return {
        total,
        results: returnedResults,
        diceCode: code,
        isCritical,
        details
    };
}
