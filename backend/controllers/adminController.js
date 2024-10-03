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
    let users = await User.find({}).populate("audience");
    if (!users) return res.status(404).json({ message: "Users not found" });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateUser(req, res) {
  const { updatedUser } = req.body;
  try {
    const user = await User.findById(req.params.id).populate("audience");
    if (!user) return res.status(404).json({ message: "User not found" });
    let users = await User.find({}).populate("audience");
    users = users.filter((user) => user.audience.isAdmin);
    if (updatedUser && user.audience.isAdmin && users.length > 1) {
      user.userName = updatedUser.userName;
      user.isActive = updatedUser.isActive;
      user.audience = new Types.ObjectId(updatedUser.audience);
      user.isMfaEnabled = updatedUser.isMfaEnabled;
      user.mfaSecret = updatedUser.isMfaEnabled ? user.mfaSecret : "";
    } else if (updatedUser && user.audience.isAdmin && users.length <= 1) {
      return res.status(500).json({
        message: "User cannot be modified since it is an only admin left",
      });
    } else if (updatedUser && !user.audience.isAdmin) {
      user.userName = updatedUser.userName;
      user.isActive = updatedUser.isActive;
      user.audience = new Types.ObjectId(updatedUser.audience);
      user.isMfaEnabled = updatedUser.isMfaEnabled;
      user.mfaSecret = updatedUser.isMfaEnabled ? user.mfaSecret : "";
    }
    await user.save();
    res.json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createAudience(req, res) {
  const { newRole } = req.body;
  try {
    const role = newRole.role;
    let audience = await Audience.findOne({
      role: { $regex: new RegExp(role, "i") },
    });
    if (audience) {
      res.status(302).json({ message: "Audience already present" });
    } else {
      audience = new Audience(newRole);
      await audience.save();
      res.status(201).json({ message: "Audience created successfully" });
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
    const result = await conn.query("SELECT Id, Role__c FROM Audience__c");

    if (!result.records || result.records.length === 0)
      return res.status(404).json({ message: "Audiences not found" });

    const audiences = result.records.map((record) => ({
      _id: record.Id,
      role: record.Role__c,
    }));

    res.json(audiences);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateAudience(req, res) {
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
