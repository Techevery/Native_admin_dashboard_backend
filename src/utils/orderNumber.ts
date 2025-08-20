export const generateOrderId = (length = 12) => {
    // Define characters to use in the random part
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charactersLength = characters.length;
    
    // Get timestamp for uniqueness
    const timestamp = Date.now();
    
    // Generate random string
    let randomString = '';
    for (let i = 0; i < length - 6; i++) {
        randomString += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    
    // Combine timestamp (last 6 digits) with random string
    const orderId = timestamp.toString().slice(-6) + randomString;
    
    return orderId.toUpperCase();
};

