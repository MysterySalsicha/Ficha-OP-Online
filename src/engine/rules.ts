// src/engine/rules.ts
import classesData from '../data/rules/classes.json';
import { AttributeName, ClassName } from '../core/types'; // Assumindo que Character, AttributeName, ClassName virão de types.ts

// Interfaces auxiliares para os dados de classe e personagem simplificado
interface ClassInfo {
    pv_inicial: number;
    pv_por_nex: number;
    pe_inicial: number;
    pe_por_nex: number;
    san_inicial: number;
    san_por_nex: number;
    // ...outras propriedades da classe, se necessário
}

// Representação mínima de um personagem para cálculos
export interface CharacterForRules {
    class: ClassName;
    nex: number;
    attributes: Record<AttributeName, number>;
    // ...outros dados que afetem cálculos de regras
}

// Helper para obter os dados de uma classe
function getClassInfo(className: ClassName): ClassInfo | null {
    // A classe 'sobrevivente' tem um tratamento especial nos dados
    const classKey = className === 'sobrevivente' ? 'Sobrevivente' : className.charAt(0).toUpperCase() + className.slice(1);
    const classes = (classesData as any).classes;
    return classes[classKey] || null;
}

/**
 * Calcula o Nível do personagem com base no NEX.
 * NEX 5% = Nível 1
 * NEX 10% = Nível 2
 * ...
 * NEX 95% = Nível 19
 * NEX 99% = Nível 20 (ou Nível do NEX/5)
 * Nível 0 para NEX 0% (Sobrevivente)
 */
function calculateLevel(nex: number): number {
    if (nex === 0) return 0; // Sobrevivente não tem Nível de Agente
    return Math.floor(nex / 5);
}

/**
 * Calcula o PV máximo de um personagem.
 * Fórmula: Base_Classe + (Inc_Classe * (Nivel - 1)) + (Vigor * Nivel)
 * Nota: Nível = floor(NEX / 5). Em NEX 5%, Nível = 1.
 */
export function calculateMaxPV(character: CharacterForRules): number {
    const classInfo = getClassInfo(character.class);
    if (!classInfo) return 0; // Caso a classe não seja encontrada ou seja 'sobrevivente' antes de ter uma classe Agente.

    // Tratamento especial para Sobrevivente (NEX 0%) - A especificação não detalha, mas baseados na v1.0
    if (character.nex === 0 && character.class === 'sobrevivente') {
        const sobreviventeInfo = (classesData as any).classes.Sobrevivente;
        return sobreviventeInfo.pv_inicial + (sobreviventeInfo.pv_por_estagio * (character.nex / 5)); // NEX/5 é sempre 0 aqui
    }

    const nivel = calculateLevel(character.nex);
    const vigor = character.attributes.vig || 0;

    // Se o nível for 0 (NEX 0% e já passou a etapa de Sobrevivente, ou erro), usar inicial
    if (nivel === 0) { // Isso pode acontecer para NEX 0% que não seja 'sobrevivente' - um caso de erro ou setup.
        return classInfo.pv_inicial + vigor;
    }

    return classInfo.pv_inicial + (classInfo.pv_por_nex * (nivel - 1)) + (vigor * nivel);
}

/**
 * Calcula o PE máximo de um personagem.
 * Fórmula: Base_Classe + (Inc_Classe * (Nivel - 1)) + (Presença * Nivel)
 */
export function calculateMaxPE(character: CharacterForRules): number {
    const classInfo = getClassInfo(character.class);
    if (!classInfo) return 0;

    // Tratamento especial para Sobrevivente (NEX 0%)
    if (character.nex === 0 && character.class === 'sobrevivente') {
        const sobreviventeInfo = (classesData as any).classes.Sobrevivente;
        return sobreviventeInfo.pe_inicial + (sobreviventeInfo.pe_por_estagio * (character.nex / 5));
    }

    const nivel = calculateLevel(character.nex);
    const presenca = character.attributes.pre || 0;

    if (nivel === 0) {
        return classInfo.pe_inicial + presenca;
    }

    return classInfo.pe_inicial + (classInfo.pe_por_nex * (nivel - 1)) + (presenca * nivel);
}

/**
 * Calcula a SAN máxima de um personagem.
 * Fórmula: Base_Classe + (Inc_Classe * (Nivel - 1))
 */
export function calculateMaxSAN(character: CharacterForRules): number {
    const classInfo = getClassInfo(character.class);
    if (!classInfo) return 0;

    // Tratamento especial para Sobrevivente (NEX 0%)
    if (character.nex === 0 && character.class === 'sobrevivente') {
        const sobreviventeInfo = (classesData as any).classes.Sobrevivente;
        return sobreviventeInfo.san_inicial + (sobreviventeInfo.san_por_estagio * (character.nex / 5));
    }

    const nivel = calculateLevel(character.nex);
    
    if (nivel === 0) {
        return classInfo.san_inicial;
    }

    return classInfo.san_inicial + (classInfo.san_por_nex * (nivel - 1));
}

/**
 * Calcula a Defesa Passiva de um personagem.
 * Fórmula: 10 + Agilidade + Equipamentos + Habilidades
 * Por enquanto, apenas Agilidade. Equipamentos e Habilidades serão adicionados depois.
 */
export function calculatePassiveDefense(character: CharacterForRules, equipmentBonus: number = 0, abilityBonus: number = 0): number {
    const agilidade = character.attributes.agi || 0;
    return 10 + agilidade + equipmentBonus + abilityBonus;
}

/**
 * Calcula a Dificuldade de Teste (DT) de Rituais.
 * Fórmula: 10 + Limite_PE_Rodada + Presença
 */
export function calculateRitualDT(character: CharacterForRules, pePerRoundLimit: number = 0): number {
    const presenca = character.attributes.pre || 0;
    return 10 + pePerRoundLimit + presenca;
}

/**
 * Calcula o limite de PE por rodada (Hard Block).
 * Fórmula: NEX / 5 (Mínimo 1)
 */
export function calculatePEPerRoundLimit(nex: number): number {
    return Math.max(1, Math.floor(nex / 5));
}

// TO-DO: Hard Block: Atributo máximo 3 inicial, 4 até NEX 45%, 5 até NEX 99%.
// TO-DO: Hard Block: Perícias máximas por nível.