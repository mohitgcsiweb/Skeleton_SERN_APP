import jsforce from "jsforce";

let currentConnection;
let instanceUrl;
let accessToken;

async function createConnection() {
  try {
    currentConnection = new jsforce.Connection({
      loginUrl: process.env.LOGIN_URL,
      maxRequest: 200,
    });
    await currentConnection.login(
      process.env.SERVER_USERNAME,
      process.env.SERVER_PASSWORD + process.env.SALESFORCE_SECURITY_TOKEN
    );
    instanceUrl = currentConnection.instanceUrl;
    accessToken = currentConnection.accessToken;
    console.log("Salesforce connected");
  } catch (err) {
    console.error("Salesforce connection error:", err);
    throw err; // Throw error to handle it in your controller
  }
}

async function connection() {
  if (!currentConnection) {
    await createConnection();
  }
  return currentConnection;
}

export default connection;
