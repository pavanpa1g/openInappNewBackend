
const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 3001;

const uri = `mongodb+srv://pavangattu5:${process.env.PASSWORD}@cluster0.go1mcti.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.json());

app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    await client.connect();

    const collection = client.db('openinapp').collection('users');


    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }


    const newUser = { name, email, password };
    const result = await collection.insertOne(newUser);

    console.log('User created:', result.insertedId);

    return res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.log('Error signing up:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    // Close the MongoDB connection
    await client.close();
  }
});




app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    await client.connect();

    const collection = client.db('openinapp').collection('users');

    const user = await collection.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }


    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

    return res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.log('Error logging in:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await client.close();
  }
});


app.get("/",(req,res)=>{
    return res.json({message:"working"})
})



app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
