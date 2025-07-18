import { RequestHandler } from "express";
import OrderModel from "../model/order";
import * as https from 'https';
import * as crypto from 'crypto';
import { sendEmail } from "../utils/email";
import { sendSMSOrder } from "../utils/sms";

export const createOrder: RequestHandler = async (req, res, next) => {
    const { items, amount, address, email, phone, metadata } = req.body;

if (!items || !Array.isArray(items) || items.length === 0 || !address || !email || !phone || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
}

try {
    // Validate each item in the items array
    for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity < 1) {
            return res.status(400).json({ message: "Invalid item data" });
        }
    }

    // Create and save the order
    const newOrder = new OrderModel({
        email,
        item: items.map(item => ({ product: item.productId, quantity: item.quantity })),
        address,
        phone,
        paymentType: "card",
    });

        await newOrder.save();

        const populatedOrder = await OrderModel.findById(newOrder._id)
            .populate("item.product") // Populate the product field in item array
            .exec();

        if (!populatedOrder) {
            return res.status(500).json({ message: "Failed to retrieve order details" });
        }

        // Prepare email items
        const emailItems = populatedOrder.item.map((item: any) => {
            const product = item.product; // Populated product
            return {
                name: product.name,
                quantity: item.quantity,
                amount: product.price * item.quantity,
            };
        });
   
        // Validate grand total
        const grandTotal = emailItems.reduce((sum: number, item: any) => sum + item.amount, 0);
        if (grandTotal !== amount) {
            return res.status(400).json({ message: "Amount mismatch" });
        }

        // Prepare Paystack request
        const productAmount = amount * 100; // Convert to kobo (Paystack expects amount in kobo)

        const params = JSON.stringify({
            amount: productAmount,
            email,
            metadata,
            // callback_url: `${req.headers.origin}/order-received`, // Uncomment if needed
        });

        const options = {
            hostname: "api.paystack.co",
            port: 443,
            path: "/transaction/initialize",
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
        };

        // Make Paystack request
        const reqPaystack = https.request(options, (respaystack) => {
            let data = "";

            respaystack.on("data", (chunk) => {
                data += chunk;
            });

            respaystack.on("end", async () => {
                try {
                    const parsedData = JSON.parse(data);

                    if (parsedData.status) {
                        // Update the order with the Paystack reference
                        await OrderModel.findByIdAndUpdate(newOrder._id, {
                            reference: parsedData.data.reference,
                        });

                        // send mail to the user 
                        await sendEmail({
                            email,
                            items: emailItems,
                            grandTotal: amount,     
                            address,
                            phone,
                        });
   
                        await sendSMSOrder(phone)

                        // Send success response with Paystack data
                        return res.status(200).json({
                            message: "Payment initialized successfully",
                            data: parsedData.data,
                        });
                    } else {
                        console.error("Payment initialization failed:", parsedData.message);
                        return res.status(400).json({
                            message: "Failed to initialize payment",
                            error: parsedData.message,
                        });
                    }
                } catch (error) {
                    console.error("Error processing payment initialization response:", error);
                    return res.status(500).json({
                        message: "Error processing payment initialization response",
                    });
                }
            });
        });

        reqPaystack.on("error", (error) => {
            console.error("Error with Paystack request:", error);
            return res.status(500).json({ message: "Internal Server Error", error });
        });

        reqPaystack.write(params);
        reqPaystack.end();
    } catch (error) {
        console.error("Error creating order:", error);
        return res.status(500).json({ message: "Error creating order", error });
    }
};
