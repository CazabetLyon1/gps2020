module.exports = (app, upload, nodemailer) => {
  app.post('/mail', upload.single('file'), (req, res) => {
    nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "lifprojet.gps@gmail.com",
        pass: "a7H-V7W-qw3"
      }
    }).sendMail({
      from: "lifprojet.gps@gmail.com",
      to: req.body.dest,
      subject: "Votre fichier GPX",
      text: "Merci de votre visite !",
      html: "<p>Merci de votre visite !</p>",
      attachments: [
        {
          filename: req.file.originalname,
          content: req.file.buffer
        }
      ]
    }, (error, info) => {
      if(error) {
        res.json(error)
      } else {
        res.json(info)
      }
    })
  })
}
