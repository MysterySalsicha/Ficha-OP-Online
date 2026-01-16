"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const client_1 = __importDefault(require("react-dom/client"));
const App_1 = __importDefault(require("./App"));
require("./index.css");
const AuthContext_1 = require("./contexts/AuthContext");
const OpToast_1 = require("./components/ui-op/OpToast");
client_1.default.createRoot(document.getElementById('root')).render(react_1.default.createElement(react_1.default.StrictMode, null,
    react_1.default.createElement(AuthContext_1.AuthProvider, null,
        react_1.default.createElement(OpToast_1.ToastProvider, null,
            react_1.default.createElement(App_1.default, null)))));
//# sourceMappingURL=main.js.map