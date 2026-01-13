import { Validator } from '../engine/validator';
import { Blocker } from '../engine/blocker';
import { Calculator } from '../engine/calculator';
import { CharacterSheet } from '../engine/types';

const validator = new Validator();
const blocker = new Blocker();
const calculator = new Calculator();

function runTest(name: string, char: CharacterSheet, expectedValid: boolean, expectedErrors: string[] = []) {
  console.log(`\n🧪 RUNNING TEST: ${name}`);
  const result = validator.validate(char);

  if (result.valid === expectedValid) {
    if (!expectedValid) {
       // Check if expected errors are present
       const missingErrors = expectedErrors.filter(err => !result.errors.some(e => e.includes(err)));
       if (missingErrors.length > 0) {
           console.error(`❌ FAILED: Expected specific errors not found: ${missingErrors.join(', ')}`);
           console.log(`Found: ${result.errors.join(', ')}`);
           process.exit(1);
       }
       console.log(`✅ PASSED (Invalid as expected). Errors caught: ${result.errors.length}`);
    } else {
       console.log(`✅ PASSED (Valid as expected).`);
    }
  } else {
    console.error(`❌ FAILED: Expected ${expectedValid}, got ${result.valid}`);
    if (!result.valid) console.log(`Errors: ${result.errors.join('\n')}`);
    process.exit(1);
  }
}

// Case 1: NEX 0 Valid (Mundane)
const mundano: CharacterSheet = {
  name: "John Doe",
  nex: 0,
  attributes: { agi: 2, for: 2, int: 2, pre: 2, vig: 1 }, // Sum 9
  skills: [],
  hp: { current: 9, max: 9, temp: 0 }, // 8 + 1 vig
  pe: { current: 3, max: 3 }, // 1 + 2 pre
  san: { current: 8, max: 8 }, // 8 base
  inventory: []
};

runTest("NEX 0 Valid", mundano, true);

// Case 2: NEX 5 Valid (Combatente)
const combatente: CharacterSheet = {
  name: "Jane Soldier",
  nex: 5,
  class: "Combatente",
  attributes: { agi: 3, for: 2, int: 1, pre: 1, vig: 2 }, // Sum 9
  skills: ["Luta", "Pontaria"],
  hp: { current: 22, max: 22, temp: 0 }, // Base 20 + 2 Vig + 0
  pe: { current: 3, max: 3 }, // Base 2 + 1 Pre
  san: { current: 12, max: 12 }, // Base 12
  inventory: []
};

runTest("NEX 5 Valid", combatente, true);

// Case 3: Invalid Attributes (Sum > 9)
const cheater: CharacterSheet = {
  ...combatente,
  name: "Cheater",
  attributes: { agi: 6, for: 5, int: 5, pre: 5, vig: 5 } // Sum 26! One is 6 (Invlid global)
};
// Max HP/PE would also be wrong if not updated, but Validator checks attributes first.
// Actually Validator checks derived stats against attributes.
// Let's expect Attribute Errors AND Stat Errors.

runTest("Invalid Attributes", cheater, false, ["Attribute out of bounds", "Attribute exceeds limit", "Invalid Total Attributes"]);

// Case 4: Invalid Progression (NEX 5 No Class)
const noClass: CharacterSheet = {
  ...mundano,
  name: "Lost Soul",
  nex: 5,
  hp: { current: 9, max: 9, temp: 0 } // Wrong HP for NEX 5 anyway
};

runTest("Invalid Progression (No Class)", noClass, false, ["Character at NEX 5 must have a Class"]);

// Blocker Test
console.log("\n🛡️ TESTING BLOCKER (State Transitions)");
const victim = { ...combatente, hp: { ...combatente.hp } }; // Clone
victim.hp.current = 1;

// Check state
let state = blocker.deriveState(victim);
console.log(`State at 1 HP: ${state.vitality} (Expected: vivo)`);
if (state.vitality !== 'vivo') { console.error("❌ Failed State Check"); process.exit(1); }

// Apply damage to -5
victim.hp.current = -5;
state = blocker.deriveState(victim);
console.log(`State at -5 HP: ${state.vitality} (Expected: inconsciente)`);
if (state.vitality !== 'inconsciente') { console.error("❌ Failed State Check"); process.exit(1); }

// Check Block Action
const actionCheck = blocker.canPerformAction(victim, "attack");
if (!actionCheck.allowed) {
    console.log(`✅ Action Blocked Correctly: ${actionCheck.reason}`);
} else {
    console.error("❌ FAILED: Action should have been blocked for Unconscious character");
    process.exit(1);
}

console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY");
