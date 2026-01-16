
import { useSheetStore } from '../src/store/useSheetStore';
import { ItemDB } from '../src/types/Types';

// Mock console.log to keep output clean or just use it directly
const log = (msg: string) => console.log(`[TEST] ${msg}`);

async function runTest() {
    log("Starting Verification...");

    const store = useSheetStore.getState();

    // 1. Check Class Support
    log("Check 1: Setting Class to 'Sobrevivente'...");
    try {
        // @ts-ignore - explicitly ignoring TS error to test runtime/store behavior
        store.character.class = 'sobrevivente';
        log("FAIL: Store allowed setting 'sobrevivente' directly (expected failure if types were strict, but at runtime JS allows it. The real test is if the Logic supports it).");
    } catch (e) {
        log("PASS: Error setting class (unexpected in JS runtime unless Proxy used).");
    }

    // 2. Check Strict Mode (Evolution)
    log("Check 2: Increasing Attribute in Default Mode...");
    const resultAttr = store.increaseAttribute('for');
    if (resultAttr.success) {
        log("FAIL: Attribute increased without Evolution Mode (Strict rules not enforced).");
    } else {
        log("PASS: Attribute increase blocked.");
    }

    // 3. Check Ammo Consumption
    log("Check 3: Attacking with Weapon needing Ammo...");
    // Mock weapon
    const weapon: ItemDB = {
        id: 'pistol',
        character_id: 'temp',
        name: 'Pistola',
        category: 'arma',
        slots: 1,
        quantity: 1,
        weight: 1,
        access_category: 1,
        is_custom: false,
        stats: { uses_ammo: true }
    };
    store.equipItem(weapon);

    // Attempt attack (using a mock function since performAttack doesn't exist yet)
    // We expect this to fail compilation if I try to call performAttack,
    // but here I'm checking if the LOGIC exists.
    if ('performAttack' in store) {
        // @ts-ignore
        const resultAttack = store.performAttack(weapon.id);
        log(`Attack Result: ${JSON.stringify(resultAttack)}`);
    } else {
        log("FAIL: performAttack function does not exist.");
    }

    log("Verification Complete.");
}

runTest();
