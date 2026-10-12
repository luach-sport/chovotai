// Bundled by esbuild into www/cap-runtime.js so the plain-JS app can reach native plugins.
import { Capacitor, registerPlugin } from '@capacitor/core';

window.ChovotaiCap = { Capacitor, registerPlugin };
