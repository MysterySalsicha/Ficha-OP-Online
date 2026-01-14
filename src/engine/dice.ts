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
export function rollDice(code: string, type: 'atributo' | 'dano' = 'atributo', threat: number = 20): RollResult {
    // Parser simples: N d X + B
    const match = code.toLowerCase().match(/^(\d*)d(\d+)([+-]\d+)?$/);
    
    if (!match) {
        // Fallback para input numérico simples ou inválido
        return { total: 0, results: [], diceCode: code, isCritical: false, details: "Inválido" };
    }

    const count = parseInt(match[1]) || 1;
    const faces = parseInt(match[2]);
    const bonus = parseInt(match[3]) || 0;

    const results: number[] = [];
    for (let i = 0; i < count; i++) {
        results.push(Math.floor(Math.random() * faces) + 1);
    }

    let total = 0;
    let details = '';
    let isCritical = false;

    if (type === 'atributo') {
        // Regra de Atributo: Rola N dados, pega o MAIOR.
        // Se N for 0 ou menor (desvantagem extrema), rola 2d20 e pega o MENOR (Regra opcional, vamos focar no padrão O.P. 1.1)
        // Padrão O.P.: Atributo 0 = Rola 2d20, pega o menor.
        
        if (count <= 0) {
             // Implementação de Atributo 0
             const r1 = Math.floor(Math.random() * 20) + 1;
             const r2 = Math.floor(Math.random() * 20) + 1;
             results.push(r1, r2);
             total = Math.min(r1, r2) + bonus;
             details = `Menor de [${r1}, ${r2}]` + (bonus ? ` ${bonus > 0 ? '+' : ''}${bonus}` : '');
             if (total >= threat) isCritical = true; // Crítico com atributo 0 é raro mas possível se bonus ajudar? Não, critico é no dado.
             // Crítico em O.P. é natural do dado. Se o dado escolhido for >= margem.
             if (Math.min(r1, r2) >= threat) isCritical = true;
        } else {
            const maxVal = Math.max(...results);
            total = maxVal + bonus;
            details = `Maior de [${results.join(', ')}]` + (bonus ? ` ${bonus > 0 ? '+' : ''}${bonus}` : '');
            if (maxVal >= threat) isCritical = true;
        }

    } else {
        // Regra de Dano: Soma tudo.
        total = results.reduce((a, b) => a + b, 0) + bonus;
        details = `Soma [${results.join(', ')}]` + (bonus ? ` ${bonus > 0 ? '+' : ''}${bonus}` : '');
    }

    return {
        total,
        results,
        diceCode: code,
        isCritical,
        details
    };
}
