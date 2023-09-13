
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const port = process.env.PORT || 3001;
const { ObjectId } = require('mongodb');

const uri = `mongodb+srv://pavangattu5:${process.env.PASSWORD}@cluster0.go1mcti.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'] }))
app.use(express.json());


const secretKey = process.env.JWT_SECRET; // Replace with your actual secret key

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  console.log("token",token)
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Token is missing' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
    req.user = decoded; // Store the user data in the request object
    next();
  });
};

module.exports = verifyToken;


app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    await client.connect();

    if(!email || !password || !name){
      return res.status(401).json({message:"Fill all the required fields"})
    }


    if(password.length<6){
      return res.status(401).json({message:"Password must be more than 6 characters"})
    }

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

  console.log(req.body)

  try {
    await client.connect();

    const collection = client.db('openinapp').collection('users');


    if(!email || !password){
      return res.status(401).json({message:"Enter all the required fields"})
    }

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



app.post('/comments',async (req, res)=>{
  const{comment,email,username,image_id}=req.body



  try {
    await client.connect();

    const collection = client.db('openinapp').collection('comments');

    if (!comment || !email || !image_id || !username){
      return res.status(401).json({error:"Enter all the input fields (comment,email,image_id,username)"})
    }



    const newComment = {
      username,
      comment,email,image_id,comment_id:uuidv4(),date:new Date()
    }



    const result = await collection.insertOne(newComment)

    return res.status(200).json({message:"comment successfully added!",result})



  } catch (error) {
    console.log('Error posting comment in:', error);
    return res.status(500).json({ message: 'Internal server error',error });
  }
  finally{
    await client.close()
  }
})



app.get("/comments", async (req,res)=>{

  const {image_id} = req.query

try {
  await client.connect();

  const collection = client.db('openinapp').collection('comments');

  if(!image_id){
    return res.status(401).json({message:"Please Provide the image_id"})
  }

  const comments = await  collection.find({image_id}).toArray()

  return res.status(200).json({message:"successfully retrived comments",comments})

} catch (error) {
  console.log('Error getting comments in:', error);
  return res.status(500).json({ message: 'Internal server error',error });
}
finally{
  await client.close()
}
})



app.post("/images",async (req,res)=>{
  const {image_url,email,name,description} = req.body 
  console.log(req.body)

  try {
    await client.connect();
  
    const collection = client.db('openinapp').collection('images');

    if(!image_url || !email || !name){
      return res.status(401).json({error:"Provide the url,email,name"})
    }

    const imageData = {
      username:name,
      email,
      image_url,image_id:uuidv4(),date:new Date(),
      description
    }


    const result = await collection.insertOne(imageData)

    return res.status(200).json({message:"Successfully uploaded image",result})

  }
  catch(error){
    console.log('Error uploading image in:', error);
    return res.status(500).json({ message: 'Internal server error',error });
  }
  finally{
    await client.close()
  }
  
})


app.get("/images",async (req,res)=>{

  try {
    await client.connect()
    const collection = client.db('openinapp').collection('images');

    const result = await collection.find().toArray()

    return res.status(200).json({message:"successfully retrieved images",result})
  

  } catch (error) {
    console.log('Error uploading image in:', error);
    return res.status(500).json({ message: 'Internal server error',error});
  }
  finally{
    await client.close()
  }
})


// function isValidObjectId(id) {
//   return ObjectId.isValid(id) && id.length === 24;
// }

app.get("/comments/count", async (req, res) => {
  const { image_id } = req.query;

  try {
    await client.connect();

    const collection = client.db('openinapp').collection('comments');

    if (!image_id) {
      return res.status(400).json({ message: "Please provide the image_id" });
    }

    const result = await collection.countDocuments({ image_id });

    console.log("Comment count:", result);
    return res.status(200).json({ message: "Successfully retrieved", count: result });

  } catch (error) {
    console.log('Error getting comments count:', error);
    return res.status(500).json({ message: 'Internal server error', error });
  } finally {
    await client.close();
  }
});




app.get("/users",verifyToken, async (req,res)=>{

  const {email} = req.query

try {
  await client.connect();

  const collection = client.db('openinapp').collection('users');



  const userData = await  collection.find({email}).project({ password: 0 }).toArray()

  return res.status(200).json({message:"successfully retrived comments",userData})

} catch (error) {

  return res.status(500).json({ message: 'Internal server error',error });
}
finally{
  await client.close()
}
})



app.get("/",(req,res)=>{
    return res.json({message:"working"})
})



app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
