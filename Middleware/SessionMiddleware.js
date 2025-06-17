import session from "express-session";
import MongoStore from "connect-mongo";

export const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,  // Changed to false for better security
    store: MongoStore.create({
        mongoUrl: process.env.DATABASE_URL,
        ttl: 24 * 60 * 60, // Session TTL in seconds (24 hours)
        crypto: {
            secret: process.env.SESSION_SECRET || 'your-secret-key'
        }
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: 'lax'
    }
});