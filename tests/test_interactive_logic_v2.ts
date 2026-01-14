import * as fs from 'fs';
import { useSheetStore } from '../src/store/useSheetStore';
import { ActionResult } from '../src/types/Types';
import itemsSeed from '../src/data/seed_items.json';

async function testInteractiveLogic() {
    const results: string[] = [];
    const log = (msg: string) => results.push(msg);

    log("🧪 Testing Interactive UX Logic...");
    const store = useSheetStore.getState();

    // 1. Initial State Check
    if (store.character.stats_max.pv !== 20) throw new Error(`Initial PV wrong: ${store.character.stats_max.pv}`);
    log("✅ Initial PV Correct");

    // 2. Increase Vigor
    const result: ActionResult = useSheetStore.getState().increaseAttribute('vig');
    if (!result.success) throw new Error("Increase Vigor failed");
    if (!result.impact?.pv_increase) throw new Error("Missing PV Increase Impact flag");
    log("✅ Vigor Increase Feedback Correct");

    // 3. Increase NEX
    const resNex = useSheetStore.getState().increaseNEX(5); // 5 -> 10
    if (resNex.trigger !== 'LEVEL_UP_TRAIL') throw new Error(`Missing Trigger. Got ${resNex.trigger}`);
    log("✅ Trigger Correct: LEVEL_UP_TRAIL");

    // 4. Equip Item
    // @ts-ignore
    const item = { ...itemsSeed[0], character_id: 'temp' };
    useSheetStore.getState().equipItem(item);

    const slotsUsed = useSheetStore.getState().items.reduce((a: number, b: any) => a + b.slots * b.quantity, 0);
    if (slotsUsed !== 1) throw new Error("Slots calculation wrong");
    log("✅ Slots Calculation Correct");

    fs.writeFileSync('test_result.txt', results.join('\n'));
}

testInteractiveLogic().catch(e => {
    fs.writeFileSync('test_result.txt', `❌ FAILED: ${e.message}`);
    process.exit(1);
});
