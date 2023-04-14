const nodemailer = require("nodemailer");

const sendEmail = async(subject, message, send_to, sent_from, reply_to) => {
  //Create email Transporter

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  //Options for sending email when they want to reset their password
  const options = {
    from: sent_from,
    to: send_to,
    reply_to: reply_to,
    subject: subject,
    html: message,
  }

  //Check if email was sent successfully
  transporter.sendMail(options, function (err, info) {
    if(err) {
      console.log('====================================');
      console.log(err);
      console.log('====================================');
    } else {
      console.log('====================================');
      console.log(info);
      console.log('====================================');
    }
  });
};

module.exports = sendEmail
