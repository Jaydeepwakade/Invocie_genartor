const express = require("express");
const authmiddleware = require("../Middlewwares/Tokengenrater");
const invoiceModel = require("../models/invoice.model");
const Invoicerouter = express.Router();
const nodemailer = require("nodemailer");
const pdfdocument = require("pdfkit");
const { content } = require("pdfkit");

const transporter = nodemailer.createTransport({

  service: "gmail",
  auth: {
    user:process.env.MY_EMAIL,
    pass:process.env.MY_PASSWORD, // Ensure this uses the app password or regular Gmail password
  },tls: {rejectUnauthorized: false}
 
});

const generateInvoicePDF = (invoice) => {
    const doc = new pdfdocument();
    let buffers = [];
  
    // Collect chunks as they are generated
    doc.on("data", (chunk) => buffers.push(chunk));
  
    // Once the document is finished, concatenate the chunks into a single Buffer
    return new Promise((resolve, reject) => {
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);  // Resolve the Promise with the concatenated Buffer
      });
  
      doc.on("error", (err) => reject(err));  // Reject the Promise if an error occurs
  
      // Add Invoice Content
      doc
        .fontSize(18)
        .text(`Invoice for ${invoice.Clientname}`, { align: "center" });
      doc.moveDown();
      doc.fontSize(14).text(`Email: ${invoice.Clientemail}`);
      doc.moveDown();
      doc.text("Items:");
      invoice.items.forEach((item, index) => {
        doc.text(`${index + 1}. ${item.name} - ${item.quantity} x $${item.price}`);
      });
      doc.moveDown();
      doc
        .fontSize(16)
        .text(`Total Amount: $${invoice.totalamount}`, { align: "right" });
  
      doc.end();  // Finish the document
    });
  };
  

Invoicerouter.post("/createinvoice", authmiddleware, async (req, res) => {
  const { Clientname, Clientemail, items, totalamount } = req.body;

  try {
    const invoice = await new invoiceModel({
      Clientname,
      Clientemail,
      items,
      totalamount,
      createdBy:req.user._id,
    });
    console.log(invoice,req.user._id)

    await invoice.save();

    const pdfbuffer = await generateInvoicePDF(invoice);

    const mailoptions = {
      from: process.env.MY_EMAIL,
      to: Clientemail,
      subject: "your invoice",
      text: `Dear ${Clientname}, please find attached your invoice`,
      attachments: [
        {
          filename: `invoice.pdf`,
          content: pdfbuffer,
          contentType: "application/pdf",
        },
      ],
    };

    transporter.sendMail(mailoptions, (error, info) => {
      if (error) {
        return res
          .status(500)
          .json({ message: "error sending email", details: error.message });
      }
      res
        .status(200)
        .json({ message: "invoice created and sent successfully", invoice });
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "error creating invoice", details: error.message });
  }
});

Invoicerouter.get("/getinvoice", authmiddleware, async (req, res) => {
  try {
    const invoices = await invoiceModel.find({ createdBy: req.user._id });
    if (!invoices) {
      res.status(404).json({ message: "invoice not  found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "error getting invoice", details: error.message });
  }
});

Invoicerouter.get("/getinvoice/:id", authmiddleware, async (req, res) => {
  const id = req.params.id;
  try {
    const invoice = await invoiceModel.findOne({
      _id: id,
      createdBy: req.user.id,
    });

    if (!invoice) {
      req.status(404).json({ message: "invoice not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "error getting invoice", details: error.message });
  }
});

Invoicerouter.delete("/deleteinvoice/:id", authmiddleware, async (req, res) => {
  const id = req.params.id;
  try {
    const invoice = await invoicemoddel.findOneAndDelete({
      _id: id,
      createdby: req.user.id,
    });
    if (!invoice) {
      res.status(404).json({ message: "invoice not found" });
    }
    res.status(200).json({ message: "inovoice deleted successfully", invoice });
  } catch (error) {
    res
      .status(500)
      .json({ message: "error deleting invoice", details: error.message });
  }
});

module.exports = Invoicerouter;
