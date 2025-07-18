import nodemailer from "nodemailer";

// Interface for email item data
interface EmailItem {
    name: string;
    quantity: number;
    amount: number; // Price × Quantity
}

// Interface for email payload
interface EmailPayload {
    email: string;
    items: EmailItem[];
    grandTotal: number;
    address: string; 
    phone: string;
}

interface CreateUserPayload {
    email: string;
    password: string;
    role: string;
}

 const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

export const sendEmail = async ({ email, items, grandTotal, address, phone }: EmailPayload) => {

    const htmlContent = `
        <h2>Order Confirmation</h2>
        <p>Thank you for your order! Below are the details:</p>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Amount (NGN)</th>
                </tr>
            </thead>
            <tbody>
                ${items
                    .map(
                        (item) => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>${item.amount.toFixed(2)}</td>
                            </tr>
                        `
                    )
                    .join("")}
                <tr style="font-weight: bold;">
                    <td colspan="2">Grand Total</td>
                    <td>${grandTotal.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
        <p><strong>Shipping Address:</strong> ${address}</p>
        <p><strong>Contact Phone:</strong> ${phone}</p>
        <p>We will notify you once your order is shipped.</p>
    `;

    const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Successful Order",
        html: htmlContent,
    });

    return info;
};

export const sendCreateUserEmail = async ({email, password, role}: CreateUserPayload) => {
    const appName = "Native Delight"
const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New User Account Created</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                <h2 style="color: #1a73e8; text-align: center;">Welcome to ${appName}!</h2>
                <p>Dear User,</p>
                <p>Your account has been successfully created. Below are your account details:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Email:</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Password:</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${password}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">Role:</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${role}</td>
                    </tr>
                </table>
                <p>Please use these credentials to log in to your account. For security, we recommend changing your password after your first login.</p>
               
                <p>Thank you for joining ${appName}!</p>
                <p>Best regards,<br>The ${appName} Team</p>
            </div>
            <div style="text-align: center; font-size: 12px; color: #777; margin-top: 20px;">
                <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
        </body>
        </html>
    `;
    const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "New User Created",
        html: htmlContent,
    })
    return info;
}