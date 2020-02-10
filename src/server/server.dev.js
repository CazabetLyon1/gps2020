import path from 'path'
import fs from 'fs'
import express from 'express'
import bodyParser from 'body-parser'
import mysql from 'mysql2'

const PORT = process.env.PORT || 8080
const app = express()
const jsonParser = bodyParser.json()

app.use(express.static('dist'))

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  let file = fs.readdirSync(__dirname).find(file => file.match(new RegExp('index.(.*?).html')))
  res.sendFile(file, {root: __dirname})
})

app.listen(PORT, () => {
    console.log(`App listening to ${PORT}....`)
    console.log('Press Ctrl+C to quit.')
})
