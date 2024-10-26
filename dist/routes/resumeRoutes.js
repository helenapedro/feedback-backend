"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const resumeController_1 = require("../controllers/resumeController");
const auth_1 = require("../middlewares/auth");
const s3Service_1 = require("../services/s3Service");
const router = express_1.default.Router();
router.post('/upload', auth_1.authMiddleware, s3Service_1.upload.single('resume'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        yield (0, resumeController_1.uploadResume)(req, res);
    }
    catch (error) {
        next(error);
    }
}));
router.get('/:id', auth_1.authMiddleware, resumeController_1.getResumeById);
router.get('/', auth_1.authMiddleware, resumeController_1.getAllResumes);
router.delete('/:id', auth_1.authMiddleware, resumeController_1.deleteResumeById);
exports.default = router;
