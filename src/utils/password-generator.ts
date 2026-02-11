/**
 * Checks password strength
 * Returns score: 0 (Weak) to 4 (Very Strong)
 */
export const calculateStrength = (password: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } => {
    if (!password) return { score: 0, label: '无', color: 'bg-gray-200 dark:bg-gray-700' };

    let score = 0;
    if (password.length > 6) score++;
    if (password.length > 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // Cap score at 4
    if (score > 4) score = 4;
    // Penalty for short passwords even if complex
    if (password.length < 8 && score > 2) score = 2;

    switch (score) {
        case 0:
        case 1:
            return { score: 1, label: '弱', color: 'bg-red-500' };
        case 2:
            return { score: 2, label: '一般', color: 'bg-orange-500' };
        case 3:
            return { score: 3, label: '强', color: 'bg-yellow-500' };
        case 4:
            return { score: 4, label: '非常强', color: 'bg-green-500' };
        default:
            return { score: 0, label: '无', color: 'bg-gray-200 dark:bg-gray-700' };
    }
};

/**
 * Generates a secure random password
 */
export const generatePassword = (length: number, options: {
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
}): string => {
    const charset = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    let chars = '';
    if (options.uppercase) chars += charset.uppercase;
    if (options.lowercase) chars += charset.lowercase;
    if (options.numbers) chars += charset.numbers;
    if (options.symbols) chars += charset.symbols;

    if (!chars) return '';

    let password = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
        password += chars[array[i] % chars.length];
    }

    return password;
};
