const express = require("express");
const authmiddleware = require("../Middlewwares/Tokengenrater");
const invoiceModel = require("../models/invoice.model");
const Invoicerouter = express.Router();
const nodemailer = require("nodemailer");
const pdfdocument = require("pdfkit");
const { content } = require("pdfkit");
const { default: mongoose } = require("mongoose");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MY_EMAIL,
    pass: process.env.MY_PASSWORD, // Ensure this uses the app password or regular Gmail password
  },
  tls: { rejectUnauthorized: false },
});
const formatDate = (timestamp) => {
  const date = new Date(timestamp);

  // Extract the day, month, and year
  const day = String(date.getDate()).padStart(2, "0"); // Add leading zero if needed
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

const generateInvoicePDF = (invoice) => {
  const doc = new pdfdocument();
  let buffers = [];

  // Collect chunks as they are generated
  doc.on("data", (chunk) => buffers.push(chunk));
  return new Promise((resolve, reject) => {
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer); // Resolve the Promise with the concatenated Buffer
    });

    doc.on("error", (err) => reject(err)); // Reject the Promise if an error occurs

    // Add Page Border
    doc.rect(40, 40, 515, 750).stroke("#333333");

    // Header Section
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .fillColor("#4A90E2")
      .text("Jaydeep Creates", 50, 50)
      .fontSize(12)
      .fillColor("#333333")
      .text("near jspm collage bhairvnath nagar", 50, 80)
      .text("Uruli devachi pune 413308", 50, 95)
      .text("Phone: 9579022411", 50, 110);

    // doc
    //   .image("logo.png", 450, 50, { width: 50, height: 50 }) // Add company logo
    //   .moveDown();

    // Add Invoice Header
    doc
      .fontSize(22)
      .fillColor("#4A90E2")
      .text("INVOICE", 50, 140, { align: "center" });

    // Add Invoice Details
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#333333")
      .text("Invoice Number:", 50, 180)
      .font("Helvetica")
      .text(Math.floor(Math.random(10) * 100), 150, 180);

    doc
      .font("Helvetica-Bold")
      .text("Invoice Date:", 50, 200)
      .font("Helvetica")
      .text(formatDate(Date.now()), 150, 200);

    // Add Client Details Section
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Client Details:", 50, 240, { underline: true });

    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Name: ${invoice.Clientname}`, 50, 260)
      .text(`Email: ${invoice.Clientemail}`, 50, 280);

    // Draw Divider Line
    doc.moveTo(50, 300).lineTo(550, 300).stroke("#AAAAAA");

    // Add Items Table Header
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Item", 50, 320)
      .text("Quantity", 300, 320, { align: "center" })
      .text("Price", 400, 320, { align: "center" });

    doc.moveTo(50, 340).lineTo(550, 340).stroke("#000000");

    // Add Items Table Content with Alternating Row Colors
    invoice.items.forEach((item, index) => {
      const rowY = 350 + index * 20;
      if (index % 2 === 0) {
        doc
          .rect(50, rowY - 5, 500, 20)
          .fillAndStroke("#F9F9F9", "#FFFFFF")
          .stroke();
      }
      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#333333")
        .text(`${index + 1}. ${item.name}`, 50, rowY)
        .text(`${item.quantity}`, 300, rowY, { align: "center" })
        .text(`$${item.price.toFixed(2)}`, 400, rowY, { align: "center" });
    });

    doc.moveDown();

    // Add Total Amount Box
    const totalY = 350 + invoice.items.length * 20 + 20;
    doc.rect(350, totalY, 200, 30).fillAndStroke("#D9534F", "#FFFFFF").stroke();

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#FFFFFF")
      .text(`Total: $${invoice.totalamount.toFixed(2)}`, 360, totalY + 7);

    // Footer Section
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333333")
      .text("Thank you for your business!", 50, 780, { align: "center" })
      .text(
        "Please make payment to Bank Account XXXX-XXXX-XXXX-XXXX",
        50,
        800,
        {
          align: "center",
        }
      );

    // Finish the document
    doc.end();
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
      createdBy: req.user._id,
    });
    console.log(invoice, req.user._id);

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
    console.log(req.user,typeof(id))
    const objectid = new mongoose.Types.ObjectId(id)
    console.log(typeof(objectid))
  try {
    const invoice = await invoiceModel.findOneAndDelete({
      _id:objectid,
      createdBy:req.user._id
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" }); // Early return
    }

    return res.status(200).json({ message: "Invoice deleted successfully", invoice }); // Early return
  } catch (error) {
    return res.status(500).json({ message: "Error deleting invoice", details: error.message }); // Early return
  }
});



module.exports = Invoicerouter;
