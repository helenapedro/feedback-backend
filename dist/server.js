"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("./config");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const resumeRoutes_1 = __importDefault(require("./routes/resumeRoutes"));
const commentRoutes_1 = __importDefault(require("./routes/commentRoutes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const logging_1 = require("./middlewares/logging");
const app = (0, express_1.default)();
const limiter = (0, express_rate_limit_1.default)(config_1.rateLimitConfig);
// Middleware
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(logging_1.requestLogger);
app.use(logging_1.errorLogger);
app.use(limiter);
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/resumes', resumeRoutes_1.default);
app.use('/api/comments', commentRoutes_1.default);
// Error Handling
app.use(errorHandler_1.errorHandler);
app.get('/', (req, res) => {
    res.send('Resume Feedback API');
});
exports.default = app;
