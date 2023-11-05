const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.21hcnfr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Custom Middlwares for JWT
const verifyToken = async(req, res, next) => {
    const token = req?.cookies?.token;

    if(!token){
        return res.status(401).send({ message : 'UnAuthorized Access'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err){
            return res.status(401).send({ message: 'UnAuthorized Access' } )
        }
        req.user = decoded;
        next()
    })
}

async function run() {
    try {
        // await client.connect();
        const blogsCollection = client.db('blogDB').collection('blogs');
        const wishlistCollection = client.db('blogDB').collection('wishlist');
        const commentsCollection = client.db('blogDB').collection('comments');

        // Auth Related Apis 
        app.post('/jwt', async(req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr'})
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
            .send({ success: true });
        })
        
        app.post('/logout', async(req, res) => {
            const user = req.body;
            res.clearCookie('token', { maxAge: 0}).send({ success: true })
        })

        // Blogs Related Apis 
        app.get('/blogs', async(req, res) => {
            const cursor = blogsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/blogs/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await blogsCollection.findOne(query);
            res.send(result);
        })

        app.post('/blogs', async(req, res) => {
            const newBlog = req.body;
            const result = await blogsCollection.insertOne(newBlog);
            res.send(result);
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Blog Website is running');
})

app.listen(port, () => {
    console.log('Blog Website running on Port', port);
})