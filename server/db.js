const mongoose = require('mongoose');


const dbconnection = async () => {
    try {
        await mongoose.connect(process.env.dbURI)
        console.log("Connected to MongoDB")
    } catch (error) {
        console.log("Error connecting to MongoDB", error)
        
    }
}
 module.exports = dbconnection;