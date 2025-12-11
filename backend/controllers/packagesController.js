const asyncHandler = require('express-async-handler');
const path = require('path');
const Package = require('../models/Package');
const Keywords = require('../models/Keywords');
const { getFreshAccessToken } = require('./gmailController');
const { processInvoices } = require('../services/gmailService');
const { zipDirectory, cleanOldZips } = require('../services/zipService');

const parseDates = (startDate, endDate) => {
    if (!startDate || !endDate) {
        const err = new Error('startDate and endDate are required');
        err.status = 400;
        throw err;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        const err = new Error('Invalid date format. Use YYYY-MM-DD');
        err.status = 400;
        throw err;
    }
    if (start > end) {
        const err = new Error('startDate must be before endDate');
        err.status = 400;
        throw err;
    }
    const endInclusive = new Date(end);
    endInclusive.setDate(endInclusive.getDate() + 1);
    return {
        startEpoch: Math.floor(start.getTime() / 1000),
        endEpoch: Math.floor(endInclusive.getTime() / 1000),
        batchLabel: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`
    };
};

// @desc Generar paquete ZIP con facturas
// @route POST /api/packages/generate
// @access Private
exports.generate = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.body;

    const { startEpoch, endEpoch, batchLabel } = parseDates(startDate, endDate);

    // Limpieza preventiva de zips viejos
    const baseDir = path.join(__dirname, '../uploads/zips');
    cleanOldZips(baseDir, 24);

    // Access token fresco
    const accessToken = await getFreshAccessToken(userId);

    // Keywords
    const kwDoc = await Keywords.findOne({ user: userId });
    const customKeywords = kwDoc?.custom || [];

    // Descargar adjuntos en estructura
    const results = await processInvoices({
        accessToken,
        startEpoch,
        endEpoch,
        userId,
        batchLabel,
        maxMessages: 100,
        customKeywords
    });

    // Crear ZIP del directorio
    const sourceDir = results.outputDir;
    const zipPath = path.join(sourceDir, `${batchLabel}.zip`);
    const { size } = await zipDirectory(sourceDir, zipPath);

    // Guardar metadatos
    const pkg = await Package.create({
        user: userId,
        batchLabel,
        zipPath,
        sizeBytes: size,
        filesSaved: results.filesSaved,
        messagesFound: results.messagesFound
    });

    res.json({
        msg: 'Package generated',
        packageId: pkg._id,
        zipPath,
        sizeBytes: size,
        summary: results
    });
});

// @desc Descargar paquete ZIP
// @route GET /api/packages/download/:id
// @access Private
exports.download = asyncHandler(async (req, res) => {
    const pkg = await Package.findOne({ _id: req.params.id, user: req.user.id });
    if (!pkg) {
        res.status(404);
        throw new Error('Package not found');
    }
    res.download(pkg.zipPath, path.basename(pkg.zipPath));
});
