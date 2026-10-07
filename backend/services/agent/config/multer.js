import fs from "fs"
import path from "path"
import multer from "multer"


const uploadDir = path.resolve("./temp")

if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, {recursive: true})
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})
    
const filterFile =  (req, file, cb) => {
    if(file.mimetype.startsWith("image/") || file.mimetype.startsWith("application/pdf")){
        cb(null, true)
    } else {
        cb(new Error("Only images and PDFs a re allowed"), false)
    }
}

const upload = multer({storage, fileFilter: filterFile})

export default upload