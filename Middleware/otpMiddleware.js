import Admin from "backend/models/AdminModels.js";

export const requireOTPVerification = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required." });
        }

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({ message: "Admin not found." });
        }

        if (admin.otp.toString() !== otp.toString() || admin.otpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        // OTP is valid, clear OTP
        admin.otp = null;
        admin.otpExpires = null;
        await admin.save();

        req.admin = admin; // Attach admin to request for further use
        next();
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
