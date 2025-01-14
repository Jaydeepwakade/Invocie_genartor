const moongose = require("mongoose");
const { create } = require("./user.model");

const invocieschem = new moongose.Schema({
  Clientname: {
    type: String,
    required: true,
  },
  Clientemail: {
    type: String,
    required: true,
  },
  items: [
    {
      name: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  totalamount: {
    type: Number,
    required: true,
  },
  createdat: {
    type: Date,
    default: Date.now,
  },

  createdBy: {
    type: moongose.Schema.Types.ObjectId,
    ref: "user",
  },
});


const invoiceModel = moongose.model("invoice", invocieschem);

module.exports = invoiceModel;