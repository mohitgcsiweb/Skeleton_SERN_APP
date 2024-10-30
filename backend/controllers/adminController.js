import jwt from "jsonwebtoken";
import { User, Audience, Tile } from "../models/index.js";
import { Types } from "mongoose";
import sendEmail from "../utils/sendEmail.js";
import { resetSecret, url } from "../config.js";
import sfConnection from "../database/conn.js";

const { sign } = jwt;

export async function createUser(req, res) {
  const { newUser } = req.body;
  console.log(req.body);
  try {
    const conn = await sfConnection();
    if (newUser.email) {
      let accountId;
      let contactId;

      // Account
      const accounts = await conn.query(
        "SELECT Id FROM Account WHERE Name = 'GCS'"
      );
      if (accounts.records.length > 0) {
        accountId = accounts.records[0].Id;
      } else {
        const newAccount = await conn
          .sobject("Account")
          .create({ Name: "GCS" });
        accountId = newAccount.id;
      }

      // Contact
      const contacts = await conn.query(
        `SELECT Id FROM Contact WHERE Email = '${newUser.email}'`
      );
      if (contacts.records.length > 0) {
        contactId = contacts.records[0].Id;
      } else {
        const contact = await conn.sobject("Contact").create({
          AccountId: accountId,
          LastName: newUser.lastName,
          FirstName: newUser.firstName,
          Email: newUser.email,
        });
        contactId = contact.id;
      }

      // Portal User
      const portalUser = await conn.sobject("Portal_User__c").create({
        Contact__c: contactId,
        isActive__c: true,
        isMfaEnabled__c: false,
        resetToken__c: "",
        Audience__c: newUser.audience,
      });

      const resetTokenSF = sign({ id: portalUser._id }, resetSecret);
      await conn.sobject("Portal_User__c").update({
        Id: portalUser.id,
        resetToken__c: resetTokenSF,
      });

      // Send Email
      await sendEmail(
        newUser.email,
        "noreply@gcsiweb.com",
        "New Portal Account Created",
        `A new account has been created for you with email as: ${newUser.email}. Click this <a target="_blank" href="${url}/set-password?token=${resetTokenSF}">link</a> to set your password.`
      );
    }
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
    console.error(err);
  }
}

export async function getAllUsers(req, res) {
  try {
    const conn = await sfConnection();

    const query = `
    SELECT Id, isActive__c, Contact__r.FirstName, Contact__r.LastName, Contact__r.Email, lastLogin__c, isMfaEnabled__c, 
           Audience__r.Name, Audience__r.Id, Audience__r.Role__c, Audience__r.isAdmin__c
    FROM Portal_User__c`;

    const result = await conn.query(query);
    if (result.totalSize === 0) {
      return res.status(404).json({ message: "Users not found" });
    }

    const users = result.records.map((user) => ({
      id: user.Id,
      isActive: user.isActive__c,
      lastLogin: user.lastLogin__c,
      isMfaEnabled: user.isMfaEnabled__c,
      contact: {
        firstName: user.Contact__r.FirstName,
        lastName: user.Contact__r.LastName,
        email: user.Contact__r.Email,
      },
      audience: {
        id: user.Audience__r.Id,
        name: user.Audience__r.Name,
        role: user.Audience__r.Role__c,
        isAdmin: user.Audience__r.isAdmin__c,
      },
    }));

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateUser(req, res) {
  const { updatedUser } = req.body;
  const userId = updatedUser.id;

  try {
    const conn = await sfConnection();

    // Retrieve the existing Portal User
    const userQuery = `
      SELECT Id, isActive__c, Contact__c, isMfaEnabled__c, Audience__c
    FROM Portal_User__c
      WHERE Id = '${userId}'`;

    const userResult = await conn.query(userQuery);
    const userContactId = userResult.records[0].Contact__c;

    if (userResult.totalSize === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = userResult.records[0];

    // Check for admin rules before update
    const idofAdmin = `
    SELECT Id
    FROM Audience__c
    WHERE Role__c = 'Admin'`;

    const idofAdmin2 = await conn.query(idofAdmin);
    const adminAudienceId = idofAdmin2.records[0].Id;
    const adminQuery = `SELECT Id FROM Portal_User__c WHERE Audience__c = '${adminAudienceId}' AND  Id != '${userId}'`;
    const adminResult = await conn.query(adminQuery);

    if (adminResult.totalSize < 1) {
      return res.status(500).json({
        message: "User cannot be modified since it is the only admin left",
      });
    }

    await conn.sobject("Portal_User__c").update({
      Id: user.Id,
      isActive__c: updatedUser.isActive,
      isMfaEnabled__c: updatedUser.isMfaEnabled,
      Audience__c: updatedUser.audience,
    });

    const [firstName, lastName] = updatedUser.userName.split(" ");
    if (firstName && lastName) {
      await conn.sobject("Contact").update({
        Id: userContactId,
        FirstName: firstName,
        LastName: lastName,
      });
    }

    res.json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createAudience(req, res) {
  const { newRole } = req.body;
  try {
    const role = newRole.role;

    const conn = await sfConnection();

    const query = `SELECT Id, Role__c FROM Audience__c WHERE Role__c = '${role}'`;
    const result = await conn.query(query);

    if (result.totalSize > 0) {
      return res.status(302).json({ message: "Audience already present" });
    } else {
      const newAudience = {
        Role__c: role,
        isAdmin__c: role.toLowerCase() === "admin",
        isActive__c: newRole.isActive !== undefined ? newRole.isActive : true,
      };

      const createdAudience = await conn
        .sobject("Audience__c")
        .create(newAudience);
      if (createdAudience.success) {
        res.status(201).json({
          message: "Audience created successfully",
          id: createdAudience.id,
        });
      } else {
        throw new Error("Failed to create audience in Salesforce");
      }
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getAllAudiences(req, res) {
  try {
    const conn = await sfConnection();
    const result = await conn.query(
      "SELECT Id, Role__c, isActive__c, isAdmin__c FROM Audience__c WHERE isActive__c = true"
    );

    if (!result.records || result.records.length === 0)
      return res.status(404).json({ message: "Audiences not found" });

    const audiences = result.records.map((record) => ({
      _id: record.Id,
      role: record.Role__c,
      active: record.isActive__c,
      isAdmin: record.isAdmin__c,
    }));

    res.json(audiences);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateAudience(req, res) {
  const { tiles, updatedAudience } = req.body;
  try {
    const conn = await sfConnection();
    const audienceQuery = `SELECT Id, Role__c, isActive__c FROM Audience__c WHERE Id = '${req.params.id}'`;
    const audienceResult = await conn.query(audienceQuery);
    if (audienceResult.totalSize === 0) {
      return res.status(404).json({ message: "Audience not found" });
    }

    const audience = audienceResult.records[0];

    // Check if the audience can be deactivated
    if (updatedAudience && !updatedAudience.isActive) {
      const userQuery = `SELECT Id FROM Portal_User__c WHERE Audience__c = '${req.params.id}'`;
      const userResult = await conn.query(userQuery);
      if (userResult.totalSize > 0) {
        return res.status(500).json({
          message:
            "Audience cannot be deactivated since it has users associated with it. Please de-link the associated users before deactivating the audience.",
        });
      }
    }

    // Update the audience details in Salesforce
    if (updatedAudience) {
      await conn.sobject("Audience__c").update({
        Id: audience.Id,
        Role__c: updatedAudience.role,
        isActive__c: updatedAudience.isActive,
      });

      res.json({ message: "Audience updated successfully" });
    }

    // Update tile field in Audience in Salesforce
    if (tiles) {
      const newTilesString = tiles.join(",");

      const updateResult = await conn.sobject("Audience__c").update({
        Id: req.params.id,
        Tiles__c: newTilesString,
      });

      if (updateResult.success) {
        res.json({ message: "Audience updated successfully" });
      } else {
        throw new Error("Failed to update the audience");
      }
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
