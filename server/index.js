require('dotenv').config();
const express = require('express');
const dbconnection = require('./db');
const { use } = require('./Routes/Auth.routes');
const router = require('./Routes/Auth.routes');
const Invoicerouter = require('./Routes/invoice.routes');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json())
app.use('/auth',router)
app.use("/invoice",Invoicerouter) 
app.listen(port, async(req,res)=>{
    await dbconnection();   
    console.log(`Server is running on port ${port}`)
 
   
   
})