import path from 'path'
import fs from 'fs'
import express from 'express'
import bodyParser from 'body-parser'
import mysql from 'mysql2'

const PORT = process.env.PORT || 8080
const HOST = "lif.sci-web.net"
const app = express()
const jsonParser = bodyParser.json()

app.use(express.static('dist'))
app.use('/img', express.static('src/img'))

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  let file = fs.readdirSync(__dirname).find(file => file.match(new RegExp('index.(.*?).html')))
  file ? res.sendFile(file, {root: __dirname}) : res.send("error")
})

app.listen(PORT, HOST, () => {
    console.log(`App listening to http://${HOST}:${PORT}....`)
    console.log('Press Ctrl+C to quit.')
})
