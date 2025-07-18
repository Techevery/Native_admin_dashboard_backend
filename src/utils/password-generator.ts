export const generatePassword = () => {
    const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const specialChars = '!@#$%^&*_+=?';
    const allChars = letters + digits + specialChars;
    
    let password = '';
    for (let i = 0; i < 6; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    return password;
};

// Example usage
console.log(generatePassword()); 