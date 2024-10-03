import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import cors from "cors";
import { connect } from "mongoose";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import authRouter from "./routes/authRouter.js";
import adminRouter from "./routes/adminRouter.js";
import { mongoURI, port } from "./config.js";
import sfConnection from "./database/conn.js";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const app = express();

// Connect to Salesforce
async function initializeSalesforceConnection() {
  try {
    const conn = await sfConnection();
    if (conn) {
      console.log("Connected to Salesforce");
    } else {
      console.error("Failed to connect to Salesforce");
    }
  } catch (error) {
    console.error("Error connecting to Salesforce:", error);
  }
}

// Connect to MongoDB
connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Middleware
app.use(cors());
app.use(compression());
app.use(helmet());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Catch-all route to serve the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

// Start server

const PORT = port || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initializeSalesforceConnection();
});
