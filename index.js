const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const verifyJWT = (req,res,next)=>{
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true,message:'unauthorize access'})
  }

  const token = authorization.split(' ')[1]

  jwt.verify(token,process.env.SECREAT_TOKEN, (error,decoded)=>{
    if(error){
      return res.status(403).send({error:true,message:'unauthorize access'})
    }
    req.decoded = decoded;
    next()
  })
}

// Replace the uri string with your MongoDB deployment's connection string.

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.watftgx.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const menuCollection = client.db("bossDB").collection("menu")
    const shopCollection = client.db("bossDB").collection("shop")
    const userCollection = client.db("bossDB").collection("user")

    app.post('/jwt',(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.SECREAT_TOKEN,{ expiresIn: '1h' })
      res.send({token})
    })

    const verifyAdmin = async(req,res,next) =>{
      const email = req.decoded.email;
      const query = {email:email}
      const user = await userCollection.findOne(query)
      if(user?.role !== 'admin'){
        return res.status(401).send({error:true,message:'forbidden access'})
      }
      next()
    }

    app.get('/menu',async(req,res)=>{
        const result = await menuCollection.find().toArray()
        res.send(result)
    })

    app.post('/menu',verifyJWT,verifyAdmin,async(req,res)=>{
      const newItem = req.body;
      const result = await menuCollection.insertOne(newItem)
      res.send(result)
    })

    app.get('/user',verifyJWT,verifyAdmin,async(req,res)=>{
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    app.get('/user/admin/:email',verifyJWT,async(req,res)=>{
      const email = req.params.email;
      const decodedEmail = req.decoded.email;

      if(email !== decodedEmail){
           return res.status(401).send({error:true,message:'forbidden access'})
      }

      const query = {email:email}
      const user = await userCollection.findOne(query)
      const result = {admin: user?.role === 'admin'}
      res.send(result)
    })

    app.patch('/user/:id',async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.post('/user',async(req,res)=>{
      const user = req.body;
      const email = {email:user.email}
      const existEmail = await userCollection.findOne(email)
      if(existEmail){
        return res.send({message:'user already axist'})
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
    })

    app.delete('/user/:id',async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const result = await userCollection.deleteOne(filter)
      res.send(result)
    })

    app.get('/shop',async(req,res)=>{
      const email = req.query.email;
      if(!email){
        return []
      }
      const query = {email:email}
      const result = await shopCollection.find(query).toArray()
      res.send(result)
    })

    app.post('/shop',async(req,res)=>{
      const body = req.body;
        const result = await shopCollection.insertOne(body)
        res.send(result)
    })

    app.delete('/shop/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await shopCollection.deleteOne(query)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
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