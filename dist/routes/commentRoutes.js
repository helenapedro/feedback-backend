"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const commentController_1 = require("../controllers/commentController");
const router = express_1.default.Router();
router.post('/add', auth_1.authMiddleware, commentController_1.addComment);
router.get('/:resumeId', commentController_1.getCommentsByResume);
router.delete('/:commentId', auth_1.authMiddleware, commentController_1.deleteComment);
exports.default = router;
