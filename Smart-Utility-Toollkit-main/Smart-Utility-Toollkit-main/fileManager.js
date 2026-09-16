const fs = require("fs");

const fileName = "test.txt";

// CREATE FILE
fs.writeFile(fileName, "Hello Node.js", (err) => {

    if (err) {
        console.log("Error creating file:", err);
        return;
    }

    console.log("File Created");

    // READ FILE
    fs.readFile(fileName, "utf8", (err, data) => {

        if (err) {
            console.log("Error reading file:", err);
            return;
        }

        console.log("File Content:", data);

        // UPDATE FILE
        fs.appendFile(fileName, "\nLearning FS Module", (err) => {

            if (err) {
                console.log("Error updating file:", err);
                return;
            }

            console.log("File Updated");

            // READ UPDATED FILE
            fs.readFile(fileName, "utf8", (err, data) => {

                if (err) {
                    console.log("Error reading updated file:", err);
                    return;
                }

                console.log("Updated Content:");
                console.log(data);

                // DELETE FILE
                fs.unlink(fileName, (err) => {

                    if (err) {
                        console.log("Error deleting file:", err);
                        return;
                    }

                    console.log("File Deleted");
                });
            });
        });
    });
});