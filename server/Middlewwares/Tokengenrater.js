 const  jwt =  require ( 'jsonwebtoken' );
const userModel = require('../models/user.model');


 const  authmiddleware=  async(req, res, next) => {

    const token = req.headers.authorization?.split(" ")[1]   
    if(!token){
        return res.status(401).json({error: `unauthorized`})
    }

    try {

        const decodetoken = jwt.verify(token,process.env.JWT_SECRET)
        req.user= await userModel.findById(decodetoken.userId).select('-password')
        next()
         
    } catch (error) {
         res.status(401).json({error: `unauthorized token`, errorrmessage:error.message})
    }


 }
module.exports = authmiddleware;