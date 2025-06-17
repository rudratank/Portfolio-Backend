// controllers/AdminController.js
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import Admin from "../Models/AdminModel.js";
import dotenv from "dotenv";
dotenv.config();

const maxAge = 3 * 24 * 60 * 60 * 1000;
const ADMIN_EMAIL = process.env.EMAIL_USER;

const createToken = (email, adminId) => {
  return jwt.sign({ email, adminId }, process.env.JWT_KEY, {
    expiresIn: maxAge,
  });
};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  debug: process.env.NODE_ENV === "development",
  logger: process.env.NODE_ENV === "development",
});

const sendOTPEmail = async (loginEmail, otp) => {
  try {
    const mailOptions = {
      from: `Admin Portal <${process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: "Portfolio Admin Login OTP",
      html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Portfolio Admin Login OTP</h2>
                    <p>A login attempt was made with email: ${loginEmail}</p>
                    <p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
                    <p>It will expire in 5 minutes.</p>
                    <p style="color: #666;">If you didn't attempt to login, please secure your account immediately.</p>
                </div>
            `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email);

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (admin.isLocked) {
      if (Date.now() > admin.lockExpires) {
        admin.isLocked = false;
        admin.failedLoginAttempts = 0;
        await admin.save();
      } else {
        return res.status(403).json({
          message: "Account is locked",
          lockExpires: admin.lockExpires,
        });
      }
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      admin.failedLoginAttempts += 1;
      if (admin.failedLoginAttempts >= 3) {
        admin.isLocked = true;
        admin.lockExpires = Date.now() + 15 * 60 * 1000;
      }
      await admin.save();
      return res.status(400).json({
        message: "Invalid password",
        attemptsRemaining: Math.max(0, 3 - admin.failedLoginAttempts),
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    await sendOTPEmail(email, otp);

    admin.otp = otp;
    admin.otpExpires = Date.now() + 5 * 60 * 1000;
    admin.failedLoginAttempts = 0;
    admin.lastLoginAttempt = Date.now();
    await admin.save();

    return res.status(200).json({
      message: "OTP sent to admin email",
      user: { id: admin.id },
      otpRequired: true,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (
      admin.otp.toString() !== otp.toString() ||
      admin.otpExpires < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const token = createToken(admin.email, admin.id);

    // Set admin as active upon successful login
    admin.isAdminActive = true;
    admin.otp = null;
    admin.otpExpires = null;
    admin.lastSuccessfulLogin = Date.now();
    await admin.save();

    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // For HTTPS
      sameSite: "None", // For cross-site access
      path: "/", // Accessible across all paths
      maxAge: maxAge, // Match your token expiration
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: admin.id,
        email: admin.email,
        lastLogin: admin.lastSuccessfulLogin,
        isAdminActive: admin.isAdminActive,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    const admin = req.admin;
    admin.lastLogout = Date.now();
    admin.isAdminActive = false; // Set admin as inactive on logout
    await admin.save();

    res.cookie("token", "", { maxAge: 1 });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const unlockAccount = async (req, res) => {
  try {
    const { email, unlockCode } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (unlockCode !== "Rudrarhutu007") {
      return res.status(403).json({ message: "Invalid unlock code" });
    }

    admin.isLocked = false;
    admin.failedLoginAttempts = 0;
    admin.lockExpires = null;
    await admin.save();

    return res.status(200).json({ message: "Account unlocked successfully" });
  } catch (error) {
    console.error("Account unlock error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      console.log("admin not found");
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.status(200).json({
      id: admin.id,
      email: admin.email,
      lastLogin: admin.lastSuccessfulLogin,
      lastLogout: admin.lastLogout,
      isAdminActive: admin.isAdminActive,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Health check endpoint
export const healthCheck = async (req, res) => {
  try {
    return res.status(200).json({
      status: "online",
      server: "running",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Health check failed",
    });
  }
};
