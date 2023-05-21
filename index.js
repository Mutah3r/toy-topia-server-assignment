const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongoDB uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zdihtln.mongodb.net/?retryWrites=true&w=majority`;

// mongoDB client
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// connect client to mongoDB
async function run() {
    try {
        // await client.connect();

        // database collection
        const toyCollection = client.db('toyTopia').collection('allToys');

        // indexing for searching
        const indexKeys = { title: 1, category: 1 };
        const indexOptions = { name: "titleCategory" };
        const result = await toyCollection.createIndex(indexKeys, indexOptions);

        app.get('/toySearchByText/:text', async (req, res) => {
            const searchText = req.params.text;

            const result = await toyCollection.find({
                $or: [
                    { title: { $regex: searchText, $options: "i" } },
                    { category: { $regex: searchText, $options: "i" } },
                ],
            }).toArray();

            res.send(result);
        })

        app.get('/', async (req, res) => {
            const result = await toyCollection.find().toArray();
            res.send(result);
        });

        app.get('/categories', async (req, res) => {
            const categories = [];
            const projection = { _id: 0, category: 1 };
            
            const result = await toyCollection.find().project(projection).toArray();

            for (const category of result) {
                if (!categories.includes(category.category)) {
                    categories.push(category.category);
                }
            }

            res.send(categories);
        });

        app.get('/toys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const toy = await toyCollection.findOne(query);
            res.send(toy);
        });

        app.get('/myToys/:email', async (req, res) => {
            const email = req.params.email;
            const query = { sellerEmail: email }
            const toys = await toyCollection.find(query).toArray();
            res.send(toys);
        });

        app.get('/myToys/ascending/:email', async (req, res) => {
            const email = req.params.email;
            const query = { sellerEmail: email }
            // const options = { sort: { price: 1 } };
            // const toys = await toyCollection.find(query, options).toArray();
            const toys = await toyCollection.find(query).toArray();
            res.send(toys);
        });

        app.get('/myToys/descending/:email', async (req, res) => {
            const email = req.params.email;
            const query = { sellerEmail: email }
            // const options = { sort: { price: -1 } };
            // const toys = await toyCollection.find(query, options).toArray();
            const toys = await toyCollection.find(query).toArray();
            res.send(toys);
        });

        app.post('/addToy', async (req, res) => {
            const toyInfo = req.body;
            const result = await toyCollection.insertOne(toyInfo);
            res.send(result);
        })

        app.delete('/toys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toyCollection.deleteOne(query);
            res.send(result);
        })

        app.put('/toys/:id', async (req, res) => {
            const id = req.params.id;
            const toy = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedToy = {
                $set: {
                    title: toy.title,
                    category: toy.category,
                    image: toy.image,
                    price: toy.price,
                    rating: toy.rating,
                    quantity: toy.quantity,
                    description: toy.description
                }
            };

            const result = await toyCollection.updateOne(filter, updatedToy, options);

            res.send(result);
        });


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

// listen app
app.listen(PORT, () => {
    console.log(`ToyTopia server is running on port ${PORT}`);
});
