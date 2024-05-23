const express = require("express");
const app = express();
const authRoute = require("./routes/auth");
const userRoute = require("./routes/user");
const postRoute = require("./routes/post");
const uploadRoute = require("./routes/upload");
const cors = require("cors");
const path = require("path")
port = 5000;

// const corsOption = {
//     origin: "https://main.jsx"
// }

app.use(express.json());
app.use(cors());

app.use("/images", express.static(path.join(__dirname, "public/images")))
app.use("/api/auth", authRoute)
app.use("/api/user", userRoute)
app.use("/api/post", postRoute)
app.use("/api/upload", uploadRoute)

app.listen(port, () => {
    console.log("Server is running");
})

