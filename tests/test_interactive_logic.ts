console.log("STARTING TEST SCRIPT...");
import { useSheetStore } from '../src/store/useSheetStore';
import { ActionResult } from '../src/types/Types';
import itemsSeed from '../src/data/seed_items.json';

async function testInteractiveLogic() {
    console.log("🧪 Testing Interactive UX Logic...");
    const store = useSheetStore.getState();

    // 1. Initial State Check
    console.log(`Initial PV: ${store.character.stats_max.pv}`);
    if (store.character.stats_max.pv !== 20) throw new Error("Initial PV wrong");

    // 2. Increase Vigor -> Check Feedback & Impact
    console.log("Action: Increase Vigor");
    const result: ActionResult = useSheetStore.getState().increaseAttribute('vig');

    if (!result.success) throw new Error("Increase Vigor failed");
    console.log(`Msg: ${result.message}`);
    if (!result.impact?.pv_increase) throw new Error("Missing PV Increase Impact flag");

    const newPV = useSheetStore.getState().character.stats_max.pv;
    console.log(`New PV: ${newPV}`);
    // Base 20 + 2 Vig + 0 = 22.
    if (newPV !== 22) throw new Error(`PV Calc Wrong. Expected 22, got ${newPV}`);

    // 3. Increase NEX -> Check Trigger
    console.log("Action: Increase NEX to 10%");
    const resNex = useSheetStore.getState().increaseNEX(5); // 5 -> 10
    console.log(`Msg: ${resNex.message}`);

    if (resNex.trigger !== 'LEVEL_UP_TRAIL') throw new Error(`Missing Trigger. Got ${resNex.trigger}`);
    console.log("✅ Trigger Correct: LEVEL_UP_TRAIL");

    // 4. Equip Item -> Check Slots
    console.log("Action: Equip Retalhadora");
    // @ts-ignore
    const item = { ...itemsSeed[0], character_id: 'temp' };
    useSheetStore.getState().equipItem(item);

    // Slots used
    const slotsUsed = useSheetStore.getState().items.reduce((a: number, b: any) => a + b.slots * b.quantity, 0);
    console.log(`Slots Used: ${slotsUsed}`);
    if (slotsUsed !== 1) throw new Error("Slots calculation wrong");

    console.log("✅ All Interactive Logic Tests Passed");
}

testInteractiveLogic().catch(e => {
    console.error("❌ Test Failed:", e);
    process.exit(1);
});
