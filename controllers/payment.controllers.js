import { MPESA_SHORTCODE, MPESA_PASSKEY,PHONE_NUMBER,CALLBACK_URL } from "../config/env.js";
import transactonSchema from "../schema/mpesaTransaction.schema.js";
import { getAccessToken } from "./accessToken.controllers.js";
import axios from "axios";

const formatPhoneNumber = (phone) => {
  if (phone.startsWith("0")) {
    return "254" + phone.substring(1);
  }
  return phone;
};

const getTimestamp = () => {
  const date = new Date();
  return date.toISOString().replace(/[-T:Z.]/g, "").substring(0, 14);
};

export const stkPush = async (req, res) => {
  const { phoneNumber, amount, reference } = req.body;
  const formattedNumber = formatPhoneNumber(phoneNumber);
  const timestamp = getTimestamp();
  const password = Buffer.from(
    `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
  ).toString("base64");

  try {
    const accessToken = await getAccessToken();
    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedNumber, // Fix: Use formatted phone here
      PartyB: MPESA_SHORTCODE,
      PhoneNumber:formattedNumber,
      CallBackURL: `${process.env.CALLBACK_URL}/stk-callback`,
      AccountReference: "FidmindBookStore",
      TransactionDesc: "Payment",
    };

    const response = await axios.post(
      `${process.env.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    console.log("STK Push Response:", response.data);

    const { CheckoutRequestID } = response.data;

    // Save transaction details
    await transactonSchema.create({
      phoneNumber: formattedNumber,
      amount,
      status: "PENDING",
      reference,
      checkoutRequestId: CheckoutRequestID,
      responsePayload: response.data,
    });

    // Send response to client immediately
    res.json({ success: true, data: response.data });

  } catch (error) {
    console.error("STK Push Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "STK Push failed",
      error: error.response?.data || error.message,
    });
  }
};

export const stkCallback = async (req, res) => {
  try {
    console.log("STK Callback Received:", req.body);

    const { Body } = req.body;
    if (!Body || !Body.stkCallback) {
      return res.status(400).json({ success: false, message: "Invalid callback data" });
    }

    const { ResultCode, CheckoutRequestID, ResultDesc } = Body.stkCallback;

    // Find the transaction using the CheckoutRequestID
    const transaction = await transactonSchema.findOne({ checkoutRequestId: CheckoutRequestID });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    // Update status based on ResultCode
    transaction.status = ResultCode === 0 ? "SUCCESS" : "FAILED";
    transaction.resultCode = ResultCode;
    transaction.resultDesc = ResultDesc;
    transaction.responsePayload = Body;

    // Save the updated transaction
    await transaction.save();

    return res.status(200).json({ success: true, message: "Transaction updated" });
  } catch (error) {
    console.error("STK Callback Error:", error.message);
    return res.status(500).json({ success: false, message: "Callback processing failed" });
  }
};

