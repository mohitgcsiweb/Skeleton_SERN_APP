import { User } from "../models/index.js";
import sfConnection from "../database/conn.js";

const adminOnly = async (req, res, next) => {
  try {
    // const user = await User.findById(req.user._id).populate("audience"); // Mongo
    //Salesforce

    const conn = await sfConnection();
    const query = `
      SELECT Id, Contact__r.FirstName, Contact__r.Name, Contact__r.LastName, Contact__r.Email, isActive__c,
             Audience__r.Name, Audience__r.Id, Audience__r.Role__c, Audience__r.isAdmin__c
      FROM Portal_User__c
      WHERE Id = '${req.user.id}'`;

    const result = await conn.query(query);

    if (result.totalSize === 0) {
      console.log("User not found or inactive");
      return res.status(404).json({ message: "User not found or is inactive" });
    }

    const user = result.records[0];
    if (!user.Audience__r.isAdmin__c) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default adminOnly;
