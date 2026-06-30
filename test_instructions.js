import { prepareInstructions } from './app/constants/index.js';

try {
    const result = prepareInstructions("test title", "test description");
    console.log("Result length:", result.length);
    console.log("Result starts with:", result.substring(0, 50));
} catch (e) {
    console.error("Error calling prepareInstructions:", e);
}
