const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;


// Middle ware
app.use(cors({
  origin: [
    'https://regal-gumption-008d0b.netlify.app'
  ],
  credentials:true
}))
app.use(express.json());
app.use(cookieParser())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster1.gsyh7hk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


  //selfmade middle ware 
  const logger = (req,res, next)=>{
    console.log('logInfo:', req.method, req.url)
    next();
  }


  // TOKEN Verification 
  const verifyToken =(req,res, next)=>{
    const token = req.cookies?.token;
    // console.log('token in the middlewere', token)
      if(!token){
        return res.status(401).send({message: "Unauthorized access"})
      }
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
          return res.status(401).send({message: "Unauthorised Access"})
        }
        req.user= decoded;
        next();
      })

  }


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const blogsCollection = client.db('EndlessExploration').collection('blogs');
    const wishListCollection = client.db('EndlessExploration').collection('wishlist');
    const commentCollection = client.db('EndlessExploration').collection('comments');


/* ---------------------
    JWT Related API
----------------------
*/
    app.post('/jwt', async(req,res)=>{
      const user = req.body;
      console.log('token backend:', user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'5h'});

      res
      .cookie('Token', token, {
        httpOnly: true,
        secure:true
      })
      .send({success:true})
    })

    app.post('/logout', async( req,res)=>{
      const user = req.body;
      console.log('Log out user:', user)
      res.clearCookie('token', {maxAge:0}).send({success:true})
    })






/*========================
       Main Part
===========================   
*/
    // Create Blogs (Post Method)
    app.post('/blogs', async(req,res)=>{
        const newBlogs = req.body;
        const result = await blogsCollection.insertOne(newBlogs)
        res.send(result)
       })

    // Show Blogs in UI (Get Method)
    app.get('/blogs', async(req,res)=>{
        const cursor = blogsCollection.find();
        const result = await cursor.toArray();
        res.send(result)
    })


    // Show single blog in UI (Get Operation)
    app.get('/blog-details/:id', async (req, res)=>{
      const blogId = req.params.id;
      const filter = {_id: new ObjectId(blogId)};
      const result = await blogsCollection.findOne(filter);
      res.send(result);
     })


/*======================
    This 2 for Update
========================= 
*/
    //  Update route
    app.get('/update-blog/:id', async (req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const result = await blogsCollection.findOne(filter);
      res.send(result);
     })

    //  Update Blog
    app.put('/blog-details/:id', async(req,res)=>{
      const updateId= req.params.id;
      const filter = {_id: new ObjectId(updateId)}
      const options = {upsert: true};
      const updatedBlog= req.body;
      const blog = {
        $set:{
          title:updatedBlog.title,
          category:updatedBlog.category, 
          shortDis:updatedBlog.shortDis, 
          longDis:updatedBlog.longDis, 
          photo:updatedBlog.photo, 
        }
      }
      const result= await blogsCollection.updateOne(filter,blog,options)
      res.send(result)
    })

/*===========================
            Wishlist
 ============================= 
*/

    // WishList Post method( New Data base)
    app.post('/wishlist', async(req,res)=>{
      const wishlist= req.body;
      const result = await wishListCollection.insertOne(wishlist);
      res.send(result);
    })

    // WishList Get method(New database)
    app.get('/wishlist', async(req,res)=>{ 
      const cursor = wishListCollection.find();
      const result = await cursor.toArray()
      res.send(result)
      })


      // Wishlist delete
      app.delete('/blog-details/:id', async(req, res)=>{
        const deletedId = req.params.id;
        const filter = {_id : new ObjectId(deletedId)};
        const result = await wishListCollection.deleteOne(filter);
        res.send(result)
      })



/* ==========================
    Comment Post & Get
 =============================
  */
    app.post('/comments', async(req, res)=>{
      const comment = req.body;
      const result = await commentCollection.insertOne(comment);
      res.send(result);
    })

    app.get('/comments', async(req, res)=>{
      const cursor= commentCollection.find();
      const result = await cursor.toArray();
      res.send(result);
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


app.get('/', async(req, res) => {
  res.send('Endless exploration is running')
})

app.listen(port , async(rq, res)=>{
    console.log(`Endless exploration is running on port ${port}`)
})