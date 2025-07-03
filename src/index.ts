import express from 'express'
import 'dotenv/config';
// import "@db/connect"
import { dbConnect } from './db';

const app = express()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

dbConnect()
app.listen(4001, () => {
    console.log('Server is running on http://localhost:4001')
})