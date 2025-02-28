import { MPESA_SHORTCODE, MPESA_PASSKEY } from "../config/env.js";
import MpesaTransaction from "../schema/mpesaTransaction.schema.js";
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

// 🚀 FIXED stkPush Function
export const stkPush = async (req, res) => {
  const { phoneNumber, amount} = req.body;
  const formattedPhone = formatPhoneNumber(phoneNumber);
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
      PartyA: formattedPhone, // ✅ Corrected PartyA
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.CALLBACK_URL}/stk-callback`,
      AccountReference: reference || "TEST123",
      TransactionDesc: "Payment",
    };

    const response = await axios.post(
      `${process.env.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    console.log("STK Push Response:", response.data);

    // ✅ Save transaction with "PENDING" status
    await MpesaTransaction.create({
      phoneNumber: formattedPhone,
      amount,
      status: "PENDING",
      
      checkoutRequestId: response.data.CheckoutRequestID, // ✅ Save ID
      responsePayload: response.data,
    });

    // ✅ Send response back to client
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

// 🚀 FIXED stkCallback Function
export const stkCallback = async (req, res) => {
  try {
    console.log("STK Callback Received:", req.body);

    const { Body } = req.body;
    if (!Body || !Body.stkCallback) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid callback data" });
    }

    const { ResultCode, CheckoutRequestID, ResultDesc } = Body.stkCallback;

    // ✅ Find transaction using CheckoutRequestID
    const transaction = await MpesaTransaction.findOne({
      checkoutRequestId: CheckoutRequestID,
    });

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    // ✅ Update status based on ResultCode
    transaction.status = ResultCode === 0 ? "SUCCESS" : "FAILED";
    transaction.resultCode = ResultCode;
    transaction.resultDesc = ResultDesc;
    transaction.responsePayload = Body;

    // ✅ Save the updated transaction
    await transaction.save();

    console.log(`✅ Transaction Updated: ${transaction.status}`);

    return res
      .status(200)
      .json({ success: true, message: "Transaction updated", status: transaction.status });
  } catch (error) {
    console.error("STK Callback Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Callback processing failed" });
  }
};

