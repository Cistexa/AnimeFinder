import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendEmailNotification = async (userEmail, htmlContent) => {
    try {
        if (!process.env.SMTP_USER) {
            console.log(`[Mock Email] To: ${userEmail}`);
            return;
        }
        await transporter.sendMail({
            from: `"AnimeFinder" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: "Your Daily Anime & Manga Updates",
            html: htmlContent,
        });
        console.log(`Email sent to ${userEmail}`);
    } catch (err) {
        console.error(`Failed to send email to ${userEmail}:`, err);
    }
};
