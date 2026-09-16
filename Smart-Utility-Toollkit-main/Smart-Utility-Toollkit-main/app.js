const isEven = require("./modules/isEven");
const logger = require("./modules/logger");

logger("Application started.");

const number = 10;

if (isEven(number)) {
    console.log(number + " is even.");
} else {
    console.log(number + " is odd.");
}

logger("Application finished.");