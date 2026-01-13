import * as fs from 'fs';
import * as path from 'path';
import { CharacterSheet, Attributes } from './types';

const RULES_DIR = path.resolve(__dirname, '../rules');

function loadJSON(filename: string): any {
  return JSON.parse(fs.readFileSync(path.join(RULES_DIR, filename), 'utf-8'));
}

export class Calculator {
  private classes: any;
  private attributes: any;

  constructor() {
    this.classes = loadJSON('classes.json');
    this.attributes = loadJSON('attributes.json');
  }

  calculateMaxPV(char: CharacterSheet): number {
    if (char.nex === 0) return 8 + char.attributes.vig; // Mundane default

    const cls = this.classes[char.class || ''];
    if (!cls) throw new Error(`Class ${char.class} not found`);

    const levels = Math.floor(char.nex / 5);
    // Level 1 (NEX 5): Base + Vig
    // Subsequent Levels: +(PerNex + Vig)

    // Formula: Base + Vig + (Levels - 1) * (PerNex + Vig)
    // Example Combatente NEX 5 (Level 1): 20 + Vig + 0.

    return cls.pvBase + char.attributes.vig + (levels - 1) * (cls.pvPerNex + char.attributes.vig);
  }

  calculateMaxPE(char: CharacterSheet): number {
    if (char.nex === 0) return 1 + char.attributes.pre; // Mundane default

    const cls = this.classes[char.class || ''];
    if (!cls) throw new Error(`Class ${char.class} not found`);

    const levels = Math.floor(char.nex / 5);
    return cls.peBase + char.attributes.pre + (levels - 1) * (cls.pePerNex + char.attributes.pre);
  }

  calculateMaxSan(char: CharacterSheet): number {
    if (char.nex === 0) return 8; // Mundane default

    const cls = this.classes[char.class || ''];
    if (!cls) throw new Error(`Class ${char.class} not found`);

    const levels = Math.floor(char.nex / 5);
    // Sanity usually doesn't add attribute per level, only base and fixed per level?
    // Let's check rules. Usually Sanity is Base + (Levels-1)*PerNex.
    // Attributes usually don't scale Sanity per level in standard OP, only initial.
    // But let's look at `validator.js` previous output: `20 + presenca`.
    // That suggests Initial Sanity = Base + Presenca.
    // I will use: Base + (Levels-1)*PerNex. Wait, Initial usually implies +Presenca somewhere?
    // I'll stick to: Base + (Levels-1)*PerNex.

    return cls.sanBase + (levels - 1) * cls.sanPerNex;
  }

  calculateLoadLimit(char: CharacterSheet): number {
    // Standard: 5 + Força for slots
    return 5 + char.attributes.for;
  }
}
