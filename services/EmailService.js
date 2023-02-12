const nodeMailer = require('nodemailer');

class EmailService {
    constructor() {
        this.host = process.env.SMTP_HOST;
        this.port = process.env.SMTP_PORT;
        this.username = process.env.SMTP_USERNAME;
        this.password = process.env.SMTP_PASSWORD;

        this.nodemonTransport = nodeMailer.createTransport({
            host: this.host, 
            port: this.port,
            auth: {
                user: this.username,
                password: this.password,
            }
        });
    }
    /**
     * Function for sending the email
     * @param {Object} mailDetails
     * @return  
     */
    async sendMail(mailDetails) {
        let mailOptions = {
            from: mailDetails.from,
            to: mailDetails.to,
            subject: mailDetails.subject,
            html: mailDetails.body
        };
        return new Promise((resolve, reject) => {
            this.nodemonTransport.sendMail(mailOptions, (error, info) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(info);
                }
            })
        });
    }
}
module.exports = EmailService;