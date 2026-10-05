import express from 'express'
import { createOrder, getPlans, verifyPayment } from '../controllers/billing.controller.js'
const router = express.Router()

router.get('/plans', getPlans)
router.post('/create', createOrder)
router.post('/verify', verifyPayment)

export default router
