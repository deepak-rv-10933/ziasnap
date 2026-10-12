'use strict';

const crypto = require('crypto');
const Busboy = require('busboy');
const catalyst = require('zcatalyst-sdk-node');
const { analyzeMealPhoto } = require('./zia-client');

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function applyLocalCors(req, res) {
  const origin = req.headers.origin || '';
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}

function readMultipartPhoto(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers, limits: { fileSize: 15 * 1024 * 1024 } });
    const chunks = [];
    let fileName = 'meal.jpg';
    let mimeType = 'image/jpeg';
    let sawFile = false;
    const fields = {};

    busboy.on('file', (_fieldname, file, info) => {
      sawFile = true;
      fileName = info.filename || fileName;
      mimeType = info.mimeType || mimeType;
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('limit', () => reject(new Error('Photo exceeds the 15MB limit')));
    });
    busboy.on('field', (name, value) => {
      fields[name] = value;
    });
    busboy.on('error', reject);
    busboy.on('finish', () => {
      if (!sawFile) return reject(new Error('No photo file found in the upload'));
      resolve({ buffer: Buffer.concat(chunks), fileName, mimeType, fields });
    });

    req.pipe(busboy);
  });
}

/** Maps the agent's raw item shape onto ZiaSnap's FoodItem contract (src/types/food.ts). */
function toFoodItem(rawItem) {
  const quantity = Number(rawItem?.portion?.quantity) || 1;
  const nutrition = {
    calories: Number(rawItem?.nutrition?.calories) || 0,
    proteinG: Number(rawItem?.nutrition?.proteinG) || 0,
    carbsG: Number(rawItem?.nutrition?.carbsG) || 0,
    fatG: Number(rawItem?.nutrition?.fatG) || 0,
    fiberG: Number(rawItem?.nutrition?.fiberG) || 0,
  };
  const perUnitNutrition = {
    calories: nutrition.calories / quantity,
    proteinG: nutrition.proteinG / quantity,
    carbsG: nutrition.carbsG / quantity,
    fatG: nutrition.fatG / quantity,
    fiberG: nutrition.fiberG / quantity,
  };

  return {
    id: crypto.randomUUID(),
    name: rawItem?.name || 'Unknown item',
    portion: {
      quantity,
      unit: rawItem?.portion?.unit || 'serving',
      label: rawItem?.portion?.label || `${quantity}`,
    },
    nutrition,
    perUnitNutrition,
    confidence: ['high', 'medium', 'low'].includes(rawItem?.confidence) ? rawItem.confidence : 'medium',
    preparationNote: rawItem?.preparationNote || undefined,
    isUserAdded: false,
    isEdited: false,
  };
}

module.exports = async (req, res) => {
  applyLocalCors(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const catalystApp = catalyst.initialize(req, { scope: 'admin' });
    const { buffer, fileName, mimeType } = await readMultipartPhoto(req);
    const analyzedAt = new Date().toISOString();

    const agentResult = await analyzeMealPhoto(catalystApp, buffer, fileName, mimeType);

    const detectedItems = Array.isArray(agentResult.detectedItems)
      ? agentResult.detectedItems.map(toFoodItem)
      : [];

    sendJson(res, 200, {
      analysisId: crypto.randomUUID(),
      status: 'completed',
      detectedItems,
      overallConfidence: ['high', 'medium', 'low'].includes(agentResult.overallConfidence)
        ? agentResult.overallConfidence
        : 'medium',
      notes: agentResult.notes || undefined,
      analyzedAt,
    });
  } catch (error) {
    console.error('ziasnap-meal-analyze error:', error);
    sendJson(res, 500, { error: error.message || 'Meal analysis failed' });
  }
};
