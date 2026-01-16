"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log("STARTING TEST SCRIPT...");
const useSheetStore_1 = require("../src/store/useSheetStore");
const seed_items_json_1 = __importDefault(require("../src/data/seed_items.json"));
async function testInteractiveLogic() {
    var _a;
    console.log("🧪 Testing Interactive UX Logic...");
    const store = useSheetStore_1.useSheetStore.getState();
    // 1. Initial State Check
    console.log(`Initial PV: ${store.character.stats_max.pv}`);
    if (store.character.stats_max.pv !== 20)
        throw new Error("Initial PV wrong");
    // 2. Increase Vigor -> Check Feedback & Impact
    console.log("Action: Increase Vigor");
    const result = useSheetStore_1.useSheetStore.getState().increaseAttribute('vig');
    if (!result.success)
        throw new Error("Increase Vigor failed");
    console.log(`Msg: ${result.message}`);
    if (!((_a = result.impact) === null || _a === void 0 ? void 0 : _a.pv_increase))
        throw new Error("Missing PV Increase Impact flag");
    const newPV = useSheetStore_1.useSheetStore.getState().character.stats_max.pv;
    console.log(`New PV: ${newPV}`);
    // Base 20 + 2 Vig + 0 = 22.
    if (newPV !== 22)
        throw new Error(`PV Calc Wrong. Expected 22, got ${newPV}`);
    // 3. Increase NEX -> Check Trigger
    console.log("Action: Increase NEX to 10%");
    const resNex = useSheetStore_1.useSheetStore.getState().increaseNEX(5); // 5 -> 10
    console.log(`Msg: ${resNex.message}`);
    if (resNex.trigger !== 'LEVEL_UP_TRAIL')
        throw new Error(`Missing Trigger. Got ${resNex.trigger}`);
    console.log("✅ Trigger Correct: LEVEL_UP_TRAIL");
    // 4. Equip Item -> Check Slots
    console.log("Action: Equip Retalhadora");
    // @ts-ignore
    const item = { ...seed_items_json_1.default[0], character_id: 'temp' };
    useSheetStore_1.useSheetStore.getState().equipItem(item);
    // Slots used
    const slotsUsed = useSheetStore_1.useSheetStore.getState().items.reduce((a, b) => a + b.slots * b.quantity, 0);
    console.log(`Slots Used: ${slotsUsed}`);
    if (slotsUsed !== 1)
        throw new Error("Slots calculation wrong");
    console.log("✅ All Interactive Logic Tests Passed");
}
testInteractiveLogic().catch(e => {
    console.error("❌ Test Failed:", e);
    process.exit(1);
});
//# sourceMappingURL=test_interactive_logic.js.map