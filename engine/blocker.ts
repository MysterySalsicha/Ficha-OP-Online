import * as fs from 'fs';
import * as path from 'path';
import { CharacterSheet } from './types';

const CORE_DIR = path.resolve(__dirname, '../core');

function loadJSON(filename: string): any {
  return JSON.parse(fs.readFileSync(path.join(CORE_DIR, filename), 'utf-8'));
}

export class Blocker {
  private states: any;
  private transitions: any;

  constructor() {
    this.states = loadJSON('states.json');
    this.transitions = loadJSON('transitions.json');
  }

  // Check if a character is in a valid state based on their stats
  deriveState(char: CharacterSheet): { vitality: string, sanity: string } {
    const maxPv = char.hp.max; // Should be calculated, but assuming it's on sheet or passed in
    const currentPv = char.hp.current;

    // Find matching vitality state
    // We need to evaluate the "condition" string safely.
    // In a real app we'd parse this, here I'll hardcode the logic mapping to the JSON intent
    // because eval() is dangerous and limited.

    let vitality = 'unknown';
    if (currentPv > 0) vitality = 'vivo';
    else if (currentPv <= 0 && currentPv > -maxPv) vitality = 'inconsciente';
    else if (currentPv <= -maxPv) vitality = 'morto';
    // 'morrendo' is a sub-state of inconsciente usually handled by death saves, simplifying here.

    let sanity = 'unknown';
    const maxSan = char.san.max;
    const currentSan = char.san.current;

    if (currentSan > maxSan / 2) sanity = 'sao';
    else if (currentSan <= maxSan / 2 && currentSan > 0) sanity = 'abalado';
    else if (currentSan <= 0) sanity = 'enlouquecendo';

    return { vitality, sanity };
  }

  canPerformAction(char: CharacterSheet, actionType: string): { allowed: boolean, reason?: string } {
    const state = this.deriveState(char);

    if (state.vitality === 'morto') {
      return { allowed: false, reason: 'Character is Dead.' };
    }
    if (state.vitality === 'inconsciente') {
      return { allowed: false, reason: 'Character is Unconscious.' };
    }
    if (state.sanity === 'enlouquecendo' || state.sanity === 'insano') {
      // In madness, user loses control.
      if (actionType !== 'gm_override') {
         return { allowed: false, reason: 'Character is Insane/Enlouquecendo.' };
      }
    }

    return { allowed: true };
  }
}
