import { Router } from "express";
import { stkPush } from "../controllers/payment.controllers.js";

const paymentRoute = Router();

paymentRoute.post("/buyBook", stkPush);
//paymentRoute.post("/stkCallback",);

export default paymentRoute;
