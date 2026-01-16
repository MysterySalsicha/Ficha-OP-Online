"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EducationalSheet = void 0;
const react_1 = __importDefault(require("react"));
const sheet_1 = require("./sheet");
const EducationalSheet = ({ title, triggerTerm, description, icon: Icon, children }) => {
    return (react_1.default.createElement(sheet_1.Sheet, null,
        react_1.default.createElement(sheet_1.SheetTrigger, { asChild: true },
            react_1.default.createElement("span", { className: "cursor-help underline decoration-dotted decoration-zinc-500 hover:text-zinc-200 transition-colors" }, triggerTerm)),
        react_1.default.createElement(sheet_1.SheetContent, { side: "bottom", className: "h-[50vh] bg-zinc-950 border-t border-zinc-800 text-zinc-100" },
            react_1.default.createElement(sheet_1.SheetHeader, null,
                react_1.default.createElement("div", { className: "flex items-center gap-2" },
                    Icon && react_1.default.createElement(Icon, { className: "w-6 h-6 text-purple-400" }),
                    react_1.default.createElement(sheet_1.SheetTitle, { className: "text-2xl font-bold" }, title)),
                react_1.default.createElement(sheet_1.SheetDescription, { className: "text-zinc-400 text-lg" }, description)),
            react_1.default.createElement("div", { className: "mt-6 space-y-4" },
                children,
                react_1.default.createElement("div", { className: "p-4 bg-zinc-900 rounded-lg border border-zinc-800" },
                    react_1.default.createElement("h4", { className: "font-semibold text-purple-400 mb-2" }, "Regra Oficial"),
                    react_1.default.createElement("p", { className: "text-sm text-zinc-300 italic" }, "\"O sistema Ordem Paranormal utiliza d20 para testes...\""))))));
};
exports.EducationalSheet = EducationalSheet;
//# sourceMappingURL=EducationalSheet.js.map