import path from 'path'
import fs from 'fs'
import express from 'express'
import bodyParser from 'body-parser'
import mysql from 'mysql2'

const PORT = process.env.PORT || 8080
const app = express()
const jsonParser = bodyParser.json()

app.use(express.static('dist'))
app.use('/img', express.static('src/img'))

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  let file = fs.readdirSync(__dirname).find(file => file.match(new RegExp('index.(.*?).html')))
  file ? res.sendFile(file, {root: __dirname}) : res.send("error")
})

app.listen(PORT, "lif.sci-web.net/~lifprojet-gps"() => {
    console.log(`App listening to ${PORT}....`)
    console.log('Press Ctrl+C to quit.')
})
