const express = require('express')
const app = express()
const cors = cors()
const { MongoClient } = require("mongodb");
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Replace the uri string with your MongoDB deployment's connection string.
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@<cluster-url>?retryWrites=true&writeConcern=majority`;
const client = new MongoClient(uri);
async function run() {
  try {
    await client.connect();
    

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})