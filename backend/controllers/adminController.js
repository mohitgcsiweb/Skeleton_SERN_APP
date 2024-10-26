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
    // const user = new User(newUser);
    // user.isActive = true;
    // user.isMfaEnabled = false;
    // user.mfaSecret = "";
    // await user.save();
    // const resetToken = sign({ id: user._id }, resetSecret);
    // await sendEmail(
    //   newUser.email,
    //   "noreply@gcsiweb.com",
    //   "New Portal Account Created",
    //   `A new account has been created for you with email as: ${user.email}. Click this <a target="_blank" href="${url}/set-password?token=${resetToken}">link</a> to set your password.`
    // );
    // await User.findByIdAndUpdate(
    //   user._id,
    //   { resetToken: resetToken },
    //   { new: true }
    // );

    // Salesforce
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
    //Mongo
    // let users = await User.find({}).populate("audience");
    // if (!users) return res.status(404).json({ message: "Users not found" });
    // res.json(users);

    //Salesforce
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
  // console.log(updatedUser);
  try {
    // Mongo Code Below

    // const user = await User.findById(req.params.id).populate("audience");
    // if (!user) return res.status(404).json({ message: "User not found" });
    // let users = await User.find({}).populate("audience");
    // users = users.filter((user) => user.audience.isAdmin);
    // if (updatedUser && user.audience.isAdmin && users.length > 1) {
    //   user.userName = updatedUser.userName;
    //   user.isActive = updatedUser.isActive;
    //   user.audience = new Types.ObjectId(updatedUser.audience);
    //   user.isMfaEnabled = updatedUser.isMfaEnabled;
    //   user.mfaSecret = updatedUser.isMfaEnabled ? user.mfaSecret : "";
    // } else if (updatedUser && user.audience.isAdmin && users.length <= 1) {
    //   return res.status(500).json({
    //     message: "User cannot be modified since it is an only admin left",
    //   });
    // } else if (updatedUser && !user.audience.isAdmin) {
    //   user.userName = updatedUser.userName;
    //   user.isActive = updatedUser.isActive;
    //   user.audience = new Types.ObjectId(updatedUser.audience);
    //   user.isMfaEnabled = updatedUser.isMfaEnabled;
    //   user.mfaSecret = updatedUser.isMfaEnabled ? user.mfaSecret : "";
    // }
    // await user.save();

    // Salesforce code Below

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

    //MongoDB
    // let audience = await Audience.findOne({
    //   role: { $regex: new RegExp(role, "i") },
    // });
    // if (audience) {
    //   res.status(302).json({ message: "Audience already present" });
    // } else {
    //   audience = new Audience(newRole);
    //   await audience.save();
    //   res.status(201).json({ message: "Audience created successfully" });
    // }


    //Salesforce
    const conn = await sfConnection();

    const query = `SELECT Id, Role__c FROM Audience__c WHERE Role__c = '${role}'`;
    const result = await conn.query(query);

     if (result.totalSize > 0) {
      return res.status(302).json({ message: "Audience already present" });
    } else {
      const newAudience = {
        Role__c: role,
        isAdmin__c: role.toLowerCase() === "admin", 
        isActive__c: newRole.isActive !== undefined ? newRole.isActive : true
      };

    const createdAudience = await conn.sobject("Audience__c").create(newAudience);
      if (createdAudience.success) {
        res.status(201).json({ message: "Audience created successfully", id: createdAudience.id });
      } else {
        throw new Error('Failed to create audience in Salesforce');
      }
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getAllAudiences(req, res) {
  try {
    // Mongo
    // let audiences = await Audience.find({});
    // if (!audiences)
    //   return res.status(404).json({ message: "Audiences not found" });
    // res.json(audiences);

    // Salesforce
    const conn = await sfConnection();
    const result = await conn.query("SELECT Id, Role__c, isActive__c FROM Audience__c");

    if (!result.records || result.records.length === 0)
      return res.status(404).json({ message: "Audiences not found" });

    const audiences = result.records.map((record) => ({
      _id: record.Id,
      role: record.Role__c,
      active: record.isActive__c,
    }));

    res.json(audiences);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateAudience(req, res) {
  console.log(req.body);
  const { tiles, updatedAudience } = req.body;
  try {
    const audience = await Audience.findById(req.params.id).populate("tiles");
    if (!audience)
      return res.status(404).json({ message: "Audience not found" });
    if (updatedAudience && !updatedAudience.isActive) {
      const users = await User.find({ audience: req.params.id });
      if (users.length > 0)
        return res.status(500).json({
          message:
            "Audience cannot be deactivated since it has users associated with it. Please de-link the associated users before deactivating the audience.",
        });
    }
    if (updatedAudience) {
      audience.role = updatedAudience.role;
      audience.isActive = updatedAudience.isActive;
      audience.seeNotes = updatedAudience.seeNotes;
    }
    if (tiles) {
      audience.tiles = tiles;
    }
    await audience.save();
    res.json({ message: "Audience updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getAllTiles(req, res) {
  try {
    let tiles = await Tile.find({});
    if (!tiles) return res.status(404).json({ message: "Tiles not found" });
    res.json(tiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
