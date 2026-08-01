import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import Otp from "../models/Otp.model.js";
import RevokedToken from "../models/RevokedToken.model.js";
import { generateToken } from "../utils/generateToken.js";
import { generateOtp, otpExpiryDate } from "../utils/otp.js";
import { sendEmail } from "../utils/email.js";

/**
 * User Registration
 * Creates a new user account and sends OTP for email verification
 */
export const register = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, street, city, district, province, postalCode } = req.body;

    if (!fullName || !email || !password)
      return res.status(400).json({ message: "fullName, email, password are required" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be 6+ chars" });

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });

    if (exists?.isEmailVerified) {
      return res.status(409).json({ message: "Email already registered" });
    }

    if (exists && exists.role !== "USER") {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let user = exists;
    const isNewUser = !user;

    if (user) {
      user.fullName = fullName.trim();
      user.passwordHash = passwordHash;
      user.role = "USER";
      user.isEmailVerified = false;
      user.phone = phone || "";
      user.address = {
        street: street || "",
        city: city || "",
        district: district || "",
        province: province || "",
        postalCode: postalCode || "",
        country: "Sri Lanka"
      };
      await user.save();
    } else {
      user = await User.create({
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "USER",
        isEmailVerified: false,
        phone: phone || "",
        address: {
          street: street || "",
          city: city || "",
          district: district || "",
          province: province || "",
          postalCode: postalCode || "",
          country: "Sri Lanka"
        }
      });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await Otp.deleteMany({ userId: user._id, purpose: "EMAIL_VERIFY" });
    await Otp.create({
      userId: user._id,
      otpHash,
      expiresAt: otpExpiryDate(),
      purpose: "EMAIL_VERIFY"
    });

    try {
      await sendEmail({
        to: user.email,
        subject: `Verify your email - ${process.env.APP_NAME || "E-Waste Platform"}`,
        html: `<p>Your OTP is <b>${otp}</b>. Expires in ${process.env.OTP_EXPIRES_MIN || 10} minutes.</p>`
      });
    } catch (emailErr) {
      console.error("REGISTER EMAIL FAILED:", emailErr.cause || emailErr);

      if (isNewUser) {
        try {
          await Otp.deleteMany({ userId: user._id, purpose: "EMAIL_VERIFY" });
          await User.deleteOne({ _id: user._id });
        } catch (cleanupErr) {
          console.error("REGISTER CLEANUP FAILED:", cleanupErr);
        }
      }

      return res.status(500).json({ message: "Failed to send verification email. Please try again." });
    }

    res.status(201).json({
      message: "Registered successfully. Verification OTP sent to email.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Email OTP Verification
 * Verifies the OTP sent to user's email and marks email as verified
 */
export const verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({ 
        message: "Email is already verified. Please login.",
        email: user.email 
      });
    }
  
    const otpDoc = await Otp.findOne({ userId: user._id, purpose: "EMAIL_VERIFY" });
    if (!otpDoc) {
      return res.status(400).json({ message: "No OTP found. Please request resend OTP." });
    }

    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new OTP." });
    }

    const isValidOtp = await bcrypt.compare(otp.toString().trim(), otpDoc.otpHash);
    if (!isValidOtp) {
      return res.status(400).json({ message: "Incorrect OTP. Please try again." });
    }

    user.isEmailVerified = true;
    await user.save();
    await Otp.deleteMany({ userId: user._id, purpose: "EMAIL_VERIFY" });

    const token = generateToken({ id: user._id, role: user.role });

    res.json({
      message: "Email verified successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Resend OTP to User Email
 * Generates a new OTP and sends it to the user's registered email
 * Only allows resend if email is not already verified
 */
export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || email.trim() === "") {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail, role: "USER" });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({ message: "Email is already verified. You can now login." });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await Otp.deleteMany({ userId: user._id, purpose: "EMAIL_VERIFY" });
    await Otp.create({
      userId: user._id,
      otpHash,
      expiresAt: otpExpiryDate(),
      purpose: "EMAIL_VERIFY"
    });

    await sendEmail({
      to: user.email,
      subject: `Verify your email - ${process.env.APP_NAME || "E-Waste Platform"}`,
      html: `<p>Your OTP is <b>${otp}</b>. Expires in ${process.env.OTP_EXPIRES_MIN || 10} minutes.</p>`
    });

    res.json({
      message: "OTP resent to your email",
      email: user.email
    });
  } catch (err) {
    console.error("RESEND OTP FAILED:", err.cause || err);
    next(err);
  }
};

/**
 * User Login
 * Authenticates user credentials and returns JWT token if email is verified
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.role === "ADMIN") {
      return res.status(403).json({ message: "Admin accounts must login through /admin/login" });
    }
    if (user.deletedAt) return res.status(401).json({ message: "Account deleted" });
    if (user.isBlocked) return res.status(403).json({ message: "Account blocked" });

    // ✅ lockout check
    if (user.lockUntil && user.lockUntil > new Date()) {
      const mins = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res.status(429).json({ message: `Account locked. Try again in ${mins} minute(s).` });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);

    // ✅ wrong password → increase attempts
    if (!ok) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.loginAttempts = 0;
      }

      await user.save();
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: "Email not verified. Please verify OTP." });
    }

    // ✅ success login reset lock fields
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken({ id: user._id, role: user.role });

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * User Logout
 * Revokes the JWT token by adding it to blacklist
 */
export const logout = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) return res.status(400).json({ message: "No token" });

    const token = auth.split(" ")[1];

    // decode exp so blacklist doc auto-deletes when token expires
    const decoded = jwt.decode(token);
    const expMs = decoded?.exp ? decoded.exp * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000;

    await RevokedToken.create({ token, expiresAt: new Date(expMs) });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
/**
 * Forgot Password
 * Initiates password reset by sending OTP to user's email
 */
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  // TEMP: forgot password flow disabled while email system is bypassed
  return res.status(200).json({ message: "If the email exists, OTP will be sent (temporarily disabled)." });
};

/**
 * Reset Password
 * Resets user password after OTP verification
 */
export const resetPassword = async (req, res, next) => {
  // TEMP: reset password flow disabled while email system is bypassed
  return res.status(200).json({ message: "Password reset flow is temporarily disabled." });
};