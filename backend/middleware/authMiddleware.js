import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { jwtSecret } from "../config.js";
import sfConnection from "../database/conn.js";

const { verify } = jwt;

const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token)
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    const verified = verify(token, jwtSecret);
    if (!verified) {
      return res
        .status(401)
        .json({ message: "Token verification failed, authorization denied" });
    }
    // req.user = await User.findById(verified.id).populate("audience"); //Mongo
    //Salesforce
    const conn = await sfConnection();
    const query = `
      SELECT Id, Contact__r.FirstName, Contact__r.Name, Contact__r.LastName, Contact__r.Email, isActive__c,
             Audience__r.Name, Audience__r.Id, Audience__r.Role__c, Audience__r.isAdmin__c
      FROM Portal_User__c
      WHERE Id = '${verified.id}'`;

    const result = await conn.query(query);

    if (result.totalSize === 0) {
      console.log("User not found or inactive");
      return res.status(404).json({ message: "User not found or is inactive" });
    }

    const user = result.records[0];
    req.user = {
      id: user.Id,
      Name: user.Contact__r.Name,
      firstName: user.Contact__r.FirstName,
      lastName: user.Contact__r.LastName,
      email: user.Contact__r.Email,
      isActive: user.isActive__c,
      audience: {
        id: user.Audience__r.Id,
        name: user.Audience__r.Name,
        role: user.Audience__r.Role__c,
        isAdmin: user.Audience__r.isAdmin__c,
      },
    };
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

export default authenticate;
