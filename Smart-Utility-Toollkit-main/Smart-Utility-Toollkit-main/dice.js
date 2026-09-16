const crypto = require("crypto");

function rollDice() {
    return crypto.randomInt(1, 7);
}

console.log("Rolling dice...");

for (let i = 1; i <= 5; i++) {
    console.log(`Roll ${i}: ${rollDice()}`);
}