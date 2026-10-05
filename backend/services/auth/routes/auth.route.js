import express from 'express'
import { login, logout, updateUserPayment, deductCredits } from '../controllers/auth.controllers.js'

const router = express.Router()

router.post('/login', login)
router.post('/logout', logout)
router.post('/update-plan', updateUserPayment)
router.post('/deduct-credits', deductCredits)

export default router