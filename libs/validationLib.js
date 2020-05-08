let validationsLib = {
    email: (email) => {
        let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (email.match(emailRegex)) {
            return email;
        } else {
            return false;
        }
    },
    password: (password) => {
        let passwordRegex = /^[A-Za-z0-9]\w{7,}$/; /* Minimum 8 characters which contain only characters,numeric digits, underscore and first character must be a letter */
        if (password.match(passwordRegex)) {
            return password;
        } else {
            return false;
        }
    }
}

module.exports = validationsLib;