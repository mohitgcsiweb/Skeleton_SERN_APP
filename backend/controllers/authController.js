import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { User, Audience } from "../models/index.js";
import sendEmail from "../utils/sendEmail.js";
import { jwtSecret, sessionTimeout, resetSecret, url } from "../config.js";
import sfConnection from "../database/conn.js";

const { sign, verify } = jwt;
const LOWERCASE = /[a-z]/g;
const UPPERCASE = /[A-Z]/g;
const NUMBERS = /[0-9]/g;


export async function login(req, res) {
  const { email, password } = req.body;
  try {
    // const user = await User.findOne({ email, isActive: true }).populate(
    //   "audience"
    // );
    // if (!user || !(await user.comparePassword(password))) {
    //   return res.status(401).json({ message: "Invalid credentials" });
    // }
    // if (user.isMfaEnabled) {
    //   if (user.mfaSecret === "") {
    //     const secret = speakeasy.generateSecret({ length: 20 });
    //     if (secret.otpauth_url) {
    //       secret.otpauth_url = speakeasy.otpauthURL({
    //         label: "GCS App",
    //         secret: secret.ascii,
    //       });
    //     }
    //     return new Promise(function (resolve, reject) {
    //       QRCode.toDataURL(secret.otpauth_url, function (err, url) {
    //         if (err) {
    //           reject(err);
    //         } else {
    //           resolve(url);
    //           res.json({
    //             isMfaEnabled: user.isMfaEnabled,
    //             mfaSecret: user.mfaSecret,
    //             secret: secret.base32,
    //             qrCodeUrl: url,
    //           });
    //         }
    //       });
    //     });
    //   }
    //   res.json({ isMfaEnabled: user.isMfaEnabled, mfaSecret: user.mfaSecret });
    // } else {
    //   const jwtToken = sign({ id: user._id }, jwtSecret, {
    //     expiresIn: sessionTimeout,
    //   });
    //   user.lastLogin = Date.now();
    //   await user.save();
    //   res.json({
    //     token: jwtToken,
    //     userData: user,
    //     message: "Login Successful",
    //   });
    // }

    const conn = await sfConnection();
    const query = `SELECT Id, Password__c, isActive__c, Audience__c, mfaSecret__c, isMfaEnabled__c FROM Portal_User__c WHERE Contact_Email__c = '${email}' AND isActive__c = true LIMIT 1`;

    const result = await conn.query(query);
    if (result.totalSize === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const user = result.records[0];
    console.log(user);
    const isMatch = await bcrypt.compare(password, user.Password__c);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const jwtToken = jwt.sign({ id: user.Id }, jwtSecret, {
      expiresIn: sessionTimeout,
    });
    res.json({
      token: jwtToken,
      userData: {
        id: user.Id,
        email: email,
        isActive: user.isActive__c,
        Password: user.Password__c,
        resetToken: user.isMfaEnabled__c,
        isMfaEnabled: user.isMfaEnabled__c,
        Audience: user.Audience__c,
        mfaSecret: user.mfaSecret__c,
      },
      message: "Login successful",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
    //Cast to ObjectId failed for value "undefined" (type string) at path "_id" for model "User"
  }
}

export async function verifyMFA(req, res) {
  const { email, secret, token } = req.body;
  try {
    const user = await User.findOne({ email, isActive: true }).populate(
      "audience"
    );
    if (!user) return res.status(400).json({ message: "User not found" });
    const verified = speakeasy.totp.verify({
      secret: secret || user.mfaSecret,
      encoding: "base32",
      token,
    });
    if (!verified)
      return res.status(401).json({ message: "Invalid MFA token" });
    const jwtToken = sign({ id: user._id }, jwtSecret, {
      expiresIn: sessionTimeout,
    });
    if (secret) user.mfaSecret = secret;
    user.lastLogin = Date.now();
    await user.save();
    res.json({ token: jwtToken, userData: user, message: "Login Successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function setPassword(req, res) {
  const { token, email, newPassword } = req.body;
  try {
    if (!newPassword.match(LOWERCASE)) {
      return res
        .status(401)
        .json({ message: "Password should contain lowercase letters" });
    } else if (!newPassword.match(UPPERCASE)) {
      return res
        .status(401)
        .json({ message: "Password should contain uppercase letters" });
    } else if (!newPassword.match(NUMBERS)) {
      return res
        .status(401)
        .json({ message: "Password should contain number" });
    } else if (newPassword.length < 8) {
      return res
        .status(401)
        .json({ message: "Password length should be at least 8" });
    }

    const decoded = verify(token, resetSecret);
    // const user = await User.findOne({
    //   _id: decoded.id,
    //   email: email,
    //   resetToken: token,
    // });
    // if (!user)
    //   return res.status(404).json({
    //     message: "Token Expired. Please contact admin for more information.",
    //   });

    // user.password = newPassword;
    // user.resetToken = "";
    // await user.save();

    // Salesforce connection
    const conn = await sfConnection();

    // Hash the password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    console.log(hashedPassword);

    const query = `SELECT Id, Contact__r.Email FROM Portal_User__c WHERE Contact__r.Email = '${email}' LIMIT 1`;
    const result = await conn.query(query);
    if (result.totalSize === 1) {
      const PortalId = result.records[0].Id;
      const updateResult = await conn.sobject("Portal_User__c").update({
        Id: PortalId,
        Password__c: hashedPassword,
        resetToken__c: "",
      });
    } else {
      return res
        .status(404)
        .json({ message: "No corresponding contact found in Salesforce." });
    }
    res.json({ message: "Password has been set. Please login to continue." });
  } catch (err) {
    res.status(500).json({ message: err.message });
    console.error(err);
  }
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const resetToken = sign({ id: user._id }, resetSecret, {
      expiresIn: "1h",
    });
    await sendEmail(
      email,
      "noreply@gcsiweb.com",
      "GCS App Password Reset",
      `Click the link to reset your password: ${url}/reset-password?token=${resetToken}`
    );
    res.json({ message: "Check your email for reset password link" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function resetPassword(req, res) {
  const { token, newPassword } = req.body;
  try {
    if (!newPassword.match(LOWERCASE)) {
      return res
        .status(401)
        .json({ message: "Password should contain lowercase letters" });
    } else if (!newPassword.match(UPPERCASE)) {
      return res
        .status(401)
        .json({ message: "Password should contain uppercase letters" });
    } else if (!newPassword.match(NUMBERS)) {
      return res
        .status(401)
        .json({ message: "Password should contain number" });
    } else if (newPassword.length < 8) {
      return res
        .status(401)
        .json({ message: "Password length should be atleast 8" });
    }
    const decoded = verify(token, resetSecret);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.password = newPassword;
    user.resetToken = "";
    await user.save();
    res.json({ message: "Password has been reset" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function manageProfile(req, res) {
  const { userName } = req.body;
  try {
    const user = await User.findById(req.params.id).populate("audience");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (userName) user.userName = userName;
    await user.save();
    res.json({ userData: user, message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function verifySession(req, res) {
  try {
    console.log("In verify Seesion ");
    const user = await User.findById(req.params.id).populate("audience");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ userData: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getTilesByAudienceId(req, res) {
  try {
    let tiles = await Audience.findOne({ _id: req.params.audienceId }).populate(
      "tiles"
    );
    if (!tiles) return res.status(404).json({ message: "Tiles not found" });
    res.json(tiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
