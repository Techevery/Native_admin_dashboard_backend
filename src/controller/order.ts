import { RequestHandler } from "express";
import OrderModel from "../model/order";
import * as https from 'https';
import * as crypto from 'crypto';
import { sendEmail } from "../utils/email";
import { sendSMSOrder } from "../utils/sms";
import { startOfMonth, startOfYear } from "date-fns";
import productModel from "../model/product";


// export const createOrder: RequestHandler = async (req, res, next) => {
//     const { items, amount, address, email, phone, metadata } = req.body;

// if (!items || !Array.isArray(items) || items.length === 0 || !address || !email || !phone || !amount) {
//     return res.status(400).json({ message: "Missing required fields" });
// }

// try {
//     // Validate each item in the items array
//     for (const item of items) {
//         if (!item.productId || !item.quantity || item.quantity < 1) {
//             return res.status(400).json({ message: "Invalid item data" });
//         }
//     }

//             // Validate grand total
//         const grandTotal = emailItems.reduce((sum: number, item: any) => sum + item.amount, 0);
//         if (grandTotal !== amount) {
//             return res.status(400).json({ message: "Amount mismatch" });
//         }

//     // Create and save the order
//     const newOrder = new OrderModel({
//         email,
//         items: items.map(item => ({ product: item.productId, quantity: item.quantity })),
//         address,
//         phone,
//         paymentType: "card",
//         total: amount, // Store the total amount in the order
//     });

//         await newOrder.save();

//         const populatedOrder = await OrderModel.findById(newOrder._id)
//             .populate("items.product") // Populate the product field in item array
//             .exec();

//         if (!populatedOrder) {
//             return res.status(500).json({ message: "Failed to retrieve order details" });
//         }

//         // Prepare email items
//         const emailItems = populatedOrder.items.map((item: any) => {
//             const product = item.product; // Populated product
//             return {
//                 name: product.name,
//                 quantity: item.quantity, 
//                 amount: product.price * item.quantity,   
//             };
//         });


//         // Prepare Paystack request
//         const productAmount = amount * 100; // Convert to kobo (Paystack expects amount in kobo)

//         const params = JSON.stringify({  
//             amount: productAmount,
//             email,
//             metadata,
//             callback_url: `${req.headers.origin}`,
//         }); 

//         const options = {
//             hostname: "api.paystack.co",
//             port: 443,
//             path: "/transaction/initialize", 
//             method: "POST",
//             headers: {
//                 Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//                 "Content-Type": "application/json",
//             },
//         };

//         // Make Paystack request
//         const reqPaystack = https.request(options, (respaystack) => {
//             let data = "";

//             respaystack.on("data", (chunk) => {
//                 data += chunk;
//             });

//             respaystack.on("end", async () => {
//                 try {
//                     const parsedData = JSON.parse(data);

//                     if (parsedData.status) {
//                         // Update the order with the Paystack reference
//                         await OrderModel.findByIdAndUpdate(newOrder._id, {
//                             reference: parsedData.data.reference,
//                         });

//                         // send mail to the user 
//                         // await sendEmail({
//                         //     email,
//                         //     items: emailItems,
//                         //     grandTotal: amount,     
//                         //     address,
//                         //     phone,
//                         // });
   
//                         await sendSMSOrder(phone)

//                         // Send success response with Paystack data
//                         return res.status(200).json({
//                             message: "Payment initialized successfully",
//                             data: parsedData.data,
//                         });
//                     } else {
//                         console.error("Payment initialization failed:", parsedData.message);
//                         return res.status(400).json({
//                             message: "Failed to initialize payment",
//                             error: parsedData.message,
//                         });
//                     }
//                 } catch (error) {
//                     console.error("Error processing payment initialization response:", error);
//                     return res.status(500).json({
//                         message: "Error processing payment initialization response",
//                     });
//                 }
//             });
//         });

//         reqPaystack.on("error", (error) => {
//             console.error("Error with Paystack request:", error);
//             return res.status(500).json({ message: "Internal Server Error", error });
//         });

//         reqPaystack.write(params);
//         reqPaystack.end();
//     } catch (error) {
//         console.error("Error creating order:", error);
//         return res.status(500).json({ message: "Error creating order", error });
//     }
// };

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

        // Fetch product details to validate the grand total
        const productIds = items.map(item => item.productId);
        const products = await productModel.find({ _id: { $in: productIds } }).select('price name').exec();

        // Create a map of productId to price for easy lookup
        const productMap = new Map(products.map(product => [product._id.toString(), product.price]));

        // Calculate grand total
        const grandTotal = items.reduce((sum: number, item: any) => {
            const productPrice = productMap.get(item.productId.toString());
            if (!productPrice) {
                throw new Error(`Product with ID ${item.productId} not found`);
            }
            return sum + productPrice * item.quantity;
        }, 0);

        // Validate grand total
        if (grandTotal !== amount) {
            return res.status(400).json({ message: "Amount mismatch" });
        }

        // Create and save the order
        const newOrder = new OrderModel({
            email,
            items: items.map(item => ({ product: item.productId, quantity: item.quantity })),
            address,
            phone,
            paymentType: "card",
            total: amount,
        });

        await newOrder.save();

        const populatedOrder = await OrderModel.findById(newOrder._id)
            .populate("items.product")
            .exec();

        if (!populatedOrder) {
            return res.status(500).json({ message: "Failed to retrieve order details" });
        }

        // Prepare email items
        const emailItems = populatedOrder.items.map((item: any) => {
            const product = item.product; // Populated product
            return {
                name: product.name,
                quantity: item.quantity,
                amount: product.price * item.quantity,
            };
        });

        // Prepare Paystack request
        const productAmount = amount * 100; // Convert to kobo (Paystack expects amount in kobo)

        const params = JSON.stringify({
            amount: productAmount,
            email,
            metadata,
            callback_url: `${req.headers.origin}`,
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

                        // Send email and SMS
                        await sendEmail({
                            email,
                            items: emailItems,
                            grandTotal: amount,
                            address,
                            phone,
                        });  

                        await sendSMSOrder(phone);

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

export const fetchOrders: RequestHandler = async (req, res, next) => {
    try {
        // Get pagination parameters from query string with defaults
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10; 
        const skip = (page - 1) * limit;

        // Define date ranges for monthly and yearly counts
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);
        const startOfCurrentYear = startOfYear(now);

        // Aggregate query to get orders and statistics
        const [result] = await OrderModel.aggregate([
            {
                $facet: {
                    // Paginated orders with populated product details
                    paginatedOrders: [
                        // Unwind items to process each item individually
                        { $unwind: "$items" },
                        {
                            $lookup: {
                                from: "products",
                                localField: "items.product",
                                foreignField: "_id",
                                as: "items.product",
                            },
                        },
                        // Unwind the product array to get a single product object
                        { $unwind: "$items.product" },
                        // Group back to restore the items array structure
                        {
                            $group: {
                                _id: "$_id",
                                email: { $first: "$email" },
                                items: {
                                    $push: {
                                        productId: "$items.product._id",
                                        productName: "$items.product.name",
                                        price: "$items.product.price",
                                        quantity: "$items.quantity",
                                    },
                                },
                                address: { $first: "$address" },
                                phone: { $first: "$phone" },
                                paymentType: { $first: "$paymentType" },
                                status: { $first: "$status" },
                                reference: { $first: "$reference" },
                                total: { $first: "$total" },
                                createdAt: { $first: "$createdAt" },
                                updatedAt: { $first: "$updatedAt" },
                                __v: { $first: "__v" },
                            },
                        },
                        { $sort: { createdAt: -1 } }, // Sort by createdAt descending
                        { $skip: skip },
                        { $limit: limit },
                    ],
                    // Total count of all orders
                    totalCount: [{ $count: "count" }],
                    // Count of orders for current month
                    monthlyCount: [
                        {
                            $match: {
                                createdAt: { $gte: startOfCurrentMonth },
                            },
                        },
                        { $count: "count" },
                    ],
                    // Count of orders for current year
                    yearlyCount: [
                        {
                            $match: {
                                createdAt: { $gte: startOfCurrentYear },
                            },
                        },
                        { $count: "count" },
                    ],
                    // Count of pending orders
                    pendingCount: [
                        {
                            $match: {
                                status: "pending",
                            },
                        },
                        { $count: "count" },
                    ],
                    processingCount: [
                        {
                            $match: {
                                status: "processing",
                            },
                        },
                        { $count: "count" },
                    ],
                    // Count of completed orders
                    completedCount: [
                        {
                            $match: {
                                status: "completed",
                            },
                        },
                        { $count: "count" },
                    ],
                    // Count of cancelled orders
                    cancelledCount: [
                        {
                            $match: {
                                status: "cancelled",
                            },
                        },
                        { $count: "count" },
                    ],
                },
            },
            {
                $project: {
                    orders: "$paginatedOrders",
                    total: { $arrayElemAt: ["$totalCount.count", 0] },
                    monthly: { $arrayElemAt: ["$monthlyCount.count", 0] },
                    yearly: { $arrayElemAt: ["$yearlyCount.count", 0] },
                    pending: { $arrayElemAt: ["$pendingCount.count", 0] },
                    completed: { $arrayElemAt: ["$completedCount.count", 0] },
                    cancelled: { $arrayElemAt: ["$cancelledCount.count", 0] },
                    processing: { $arrayElemAt: ["$processingCount.count", 0] },
                },
            },
        ]);

        // Handle case when counts are empty
        const total = result.total || 0;
        const monthly = result.monthly || 0;
        const yearly = result.yearly || 0;
        const pending = result.pending || 0;
        const completed = result.completed || 0;
        const cancelled = result.cancelled || 0;
        const  processing = result.processing || 0;

        // Calculate total pages
        const totalPages = Math.ceil(total / limit);

        // Send response
        res.status(200).json({
            success: true,
            data: {
                orders: result.orders,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalOrders: total,
                    monthlyOrders: monthly,
                    yearlyOrders: yearly,
                    pendingOrders: pending,
                    completedOrders: completed,
                    cancelledOrders: cancelled,
                    processingOrders: processing,
                },
            },
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        next(error);
    }
};

export const updateOrderStatus: RequestHandler = async (req, res, next) => {
    const { orderId } = req.params;
    const { status } = req.body;
    if (!status || !["pending", "completed", "cancelled", "processing"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }
    try {
        const updatedOrder = await OrderModel.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        ).exec();
        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.status(200).json({
            message: "Order status updated successfully",
            data: updatedOrder,
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        next(error);
    }
};
