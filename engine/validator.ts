import * as fs from 'fs';
import * as path from 'path';
import { CharacterSheet, ValidationResult } from './types';
import { Calculator } from './calculator';

const RULES_DIR = path.resolve(__dirname, '../rules');
const CORE_DIR = path.resolve(__dirname, '../core');

function loadJSON(dir: string, filename: string): any {
  return JSON.parse(fs.readFileSync(path.join(dir, filename), 'utf-8'));
}

export class Validator {
  private invariants: any;
  private progression: any;
  private classes: any;
  private calculator: Calculator;

  constructor() {
    this.invariants = loadJSON(CORE_DIR, 'invariants.json');
    this.progression = loadJSON(RULES_DIR, 'progression.json');
    this.classes = loadJSON(RULES_DIR, 'classes.json');
    this.calculator = new Calculator();
  }

  validate(char: CharacterSheet): ValidationResult {
    const errors: string[] = [];

    // 1. Validate Attributes
    const attrs = Object.values(char.attributes);
    // Hard limit check
    if (attrs.some(a => a > this.invariants.attributes.max || a < this.invariants.attributes.min)) {
      errors.push(`Attribute out of bounds (${this.invariants.attributes.min}-${this.invariants.attributes.max})`);
    }

    // Progression Limit Check
    // Get limit from progression table for current NEX (or closest lower)
    // Finding closest milestone key <= char.nex
    const milestones = Object.keys(this.progression).map(Number).sort((a,b) => a-b);
    let currentMilestone = 0;
    for (const m of milestones) {
      if (char.nex >= m) currentMilestone = m;
    }

    const rules = this.progression[currentMilestone.toString()];
    const maxAttr = rules.limits.maxAttribute;
    if (attrs.some(a => a > maxAttr)) {
       errors.push(`Attribute exceeds limit for NEX ${char.nex} (Max: ${maxAttr})`);
    }

    // Point Buy / Initial Check (Simplified: Base 1 + 4 points = 9 total)
    // Assuming standard creation.
    const totalAttr = attrs.reduce((a, b) => a + b, 0);
    // Logic: 5 (base 1 each) + 4 (creation) + increases.
    // Increases happen at 20, 50, 80, 95.
    let expectedPoints = 9;
    if (char.nex >= 20) expectedPoints += 1;
    if (char.nex >= 50) expectedPoints += 1;
    // ...

    if (totalAttr !== expectedPoints) {
        // Warning or Error? Strict mode says error.
        errors.push(`Invalid Total Attributes. Expected ${expectedPoints}, found ${totalAttr}.`);
    }

    // 2. Validate Class Requirements (Must be done before stats that depend on class)
    if (char.nex >= 5 && !char.class) {
      errors.push(`Character at NEX ${char.nex} must have a Class.`);
    }

    // 3. Validate Vital Stats (HP, PE, Sanity)
    // Only calculate if class exists or NEX is 0 (Mundane)
    if (char.nex === 0 || char.class) {
        try {
            const expectedPv = this.calculator.calculateMaxPV(char);
            if (char.hp.max !== expectedPv) {
                errors.push(`Invalid Max HP. Expected ${expectedPv}, found ${char.hp.max}`);
            }

            const expectedPe = this.calculator.calculateMaxPE(char);
            if (char.pe.max !== expectedPe) {
                errors.push(`Invalid Max PE. Expected ${expectedPe}, found ${char.pe.max}`);
            }

            const expectedSan = this.calculator.calculateMaxSan(char);
            if (char.san.max !== expectedSan) {
                errors.push(`Invalid Max Sanity. Expected ${expectedSan}, found ${char.san.max}`);
            }
        } catch (e: any) {
            errors.push(`Calculation Error: ${e.message}`);
        }
    }

    // 4. Validate Inventory Weight
    const loadLimit = this.calculator.calculateLoadLimit(char);
    const currentLoad = char.inventory.reduce((sum, item) => sum + item.weight, 0); // Assuming 'weight' is 'spaces'
    if (currentLoad > loadLimit) {
      errors.push(`Inventory Overload. Limit ${loadLimit}, Current ${currentLoad}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
