const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI ||
    'mongodb://127.0.0.1:27017/wastewise';

/* 🔗 CONNECT TO MONGODB */
mongoose
    .connect(MONGO_URI)
    .then(() => console.log(`MongoDB Connected to ${MONGO_URI}`))
    .catch((err) => console.log('MongoDB connection error:', err));

/* MULTER CONFIG FOR FILE UPLOADS */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const PYTHON_COMMAND = process.env.PYTHON_CMD || (process.platform === 'win32' ? 'py' : 'python3');
const PYTHON_ARGS = process.platform === 'win32' ? ['-3'] : [];

/* SCHEMA */
const wasteSchema = new mongoose.Schema({
    wasteType: String,
    binLevel: Number,
    time: { type: Date, default: Date.now },
});

const Waste = mongoose.model('Waste', wasteSchema);

const NLP_CATEGORIES = ['Organic', 'Plastic', 'Metal'];
const NLP_INSTRUCTIONS = {
    Organic: 'Compost or wet waste bin',
    Plastic: 'Dry waste / recycling bin',
    Metal: 'Scrap / recycling center',
};

const NLP_KEYWORDS = {
    Organic: [
        'banana', 'apple', 'mango', 'orange', 'grape', 'grapes', 'guava', 'papaya',
        'pineapple', 'watermelon', 'muskmelon', 'strawberry', 'berry', 'berries',
        'pomegranate', 'pear', 'peach', 'plum', 'kiwi', 'lemon', 'lime', 'coconut',
        'sapota', 'chikoo', 'jackfruit', 'fruit', 'fruits', 'peel', 'core', 'seed',
        'seeds', 'vegetable', 'vegetables', 'veggie', 'veggies', 'potato', 'tomato',
        'onion', 'carrot', 'cabbage', 'cauliflower', 'spinach', 'beans', 'peas',
        'brinjal', 'eggplant', 'okra', 'ladyfinger', 'beetroot', 'radish', 'pumpkin',
        'cucumber', 'garlic', 'ginger', 'chilli', 'chili', 'leaf', 'leaves',
        'flower', 'flowers', 'petal', 'petals', 'rose', 'jasmine', 'marigold',
        'hibiscus', 'bouquet', 'garland', 'food', 'leftover', 'leftovers', 'scrap',
        'scraps', 'waste', 'compost', 'tea', 'coffee', 'eggshell', 'egg', 'organic',
        'wet', 'wet waste',
    ],
    Plastic: [
        'plastic', 'plastics', 'polymer', 'polymers', 'poly', 'polythene', 'polyethylene',
        'pet', 'pvc', 'hdpe', 'ldpe', 'pp', 'ps', 'acrylic', 'nylon', 'thermocol',
        'bottle', 'bottles', 'packet', 'packets', 'wrapper', 'wrappers', 'container',
        'containers', 'carry', 'bag', 'bags', 'toothpaste', 'tube', 'tubes', 'shampoo',
        'cap', 'caps', 'chair', 'bucket', 'stool', 'toy', 'keyboard', 'mouse', 'cover',
        'case', 'mug', 'crate', 'disposable', 'fork', 'spoon', 'plate', 'cup', 'straw',
        'water bottle', 'milk packet', 'plastic bottle', 'plastic bag',
    ],
    Metal: [
        'metal', 'metals', 'alloy', 'alloys', 'aluminum', 'aluminium', 'iron', 'steel',
        'stainless', 'stainless steel', 'tin', 'copper', 'brass', 'bronze', 'nickel',
        'zinc', 'lead', 'silver', 'gold', 'platinum', 'wire', 'scrap', 'can', 'cans',
        'nail', 'nails', 'bolt', 'bolts', 'screw', 'screws', 'nut', 'nuts', 'key', 'keys',
        'lock', 'chain', 'lid', 'watch', 'utensil', 'utensils', 'knife', 'pan', 'pot',
        'vessel', 'rod', 'pipe', 'frame', 'laptop', 'computer', 'phone', 'mobile',
        'charger', 'battery', 'cpu', 'monitor', 'electronics', 'electronic', 'appliance',
        'aluminium foil', 'foil', 'aluminum can', 'steel bottle',
    ],
};

function normalizeText(text = '') {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function classifyTextWaste(text = '') {
    const normalized = normalizeText(text);
    const tokenList = normalized.split(' ').filter(Boolean);

    if (!tokenList.length) {
        return {
            item: text,
            category: 'Organic',
            disposal_instructions: NLP_INSTRUCTIONS.Organic,
            confidence: 0.2,
        };
    }

    const scores = { Organic: 0, Plastic: 0, Metal: 0 };
    const strongMetalTokens = new Set([
        'steel', 'iron', 'copper', 'aluminium', 'aluminum', 'silver', 'gold',
        'brass', 'bronze', 'nickel', 'zinc', 'lead', 'platinum',
    ]);

    let strongMetalHit = false;
    for (const token of tokenList) {
        if (strongMetalTokens.has(token)) {
            strongMetalHit = true;
        }
        for (const category of NLP_CATEGORIES) {
            if (NLP_KEYWORDS[category].includes(token)) {
                scores[category] += 1;
            }
        }
    }

    let category = 'Organic';
    let maxScore = 0;
    for (const currentCategory of NLP_CATEGORIES) {
        if (scores[currentCategory] > maxScore) {
            maxScore = scores[currentCategory];
            category = currentCategory;
        }
    }

    if (maxScore === 0) {
        // Unknown words: prefer metal/plastic-looking common objects before organic fallback.
        const compact = normalized.replace(/\s+/g, '');
        const likelyMetal = /(watch|plate|spoon|fork|knife|steel|iron|metal|utensil|scrap|can|key|lid|laptop|computer|phone|mobile|charger|battery|cpu|monitor|electronics|electronic|appliance)/.test(compact);
        const likelyPlastic = /(bottle|packet|wrapper|container|bag|plastic|poly|tube|cap|chair|bucket|stool|toy|keyboard|mouse|cover|case)/.test(compact);
        if (likelyMetal) {
            category = 'Metal';
        } else if (likelyPlastic) {
            category = 'Plastic';
        } else {
            category = 'Organic';
        }
    }

    // Resolve metal-vs-plastic ties using strong metal material words.
    if (scores.Metal === scores.Plastic && scores.Metal > 0 && strongMetalHit) {
        category = 'Metal';
    }

    const confidence = maxScore > 0
        ? Math.min(0.98, 0.62 + maxScore * 0.12)
        : 0.55;

    return {
        item: text,
        category,
        disposal_instructions: NLP_INSTRUCTIONS[category],
        confidence: Number(confidence.toFixed(4)),
    };
}

function chatWasteAssistant(text = '') {
    const normalized = normalizeText(text);
    if (normalized.includes('plastic')) {
        return { answer: 'Throw plastic waste in the dry waste / recycling bin.' };
    }
    if (normalized.includes('metal')) {
        return { answer: 'Dispose metal in a scrap / recycling center.' };
    }
    if (normalized.includes('organic') || normalized.includes('wet waste')) {
        return { answer: 'Organic waste goes to compost or a wet waste bin.' };
    }
    if (normalized.includes('where to throw') || normalized.includes('how to dispose')) {
        return { answer: 'Tell me the waste type (Organic, Plastic, or Metal), and I will guide you.' };
    }
    return { answer: "I can help with waste disposal. Try: 'Where to throw plastic?' or 'How to dispose metal?'" };
}

app.get('/status', (req, res) => {
    res.json({ status: 'ok', nlp: true });
});

app.post('/nlp/classify', (req, res) => {
    const text = (req.body?.text || '').toString().trim();
    if (!text) {
        return res.status(400).json({ error: 'text cannot be empty' });
    }
    res.json(classifyTextWaste(text));
});

app.post('/nlp/chat', (req, res) => {
    const text = (req.body?.text || '').toString().trim();
    if (!text) {
        return res.status(400).json({ error: 'text cannot be empty' });
    }
    res.json(chatWasteAssistant(text));
});

/* POST */
app.post('/data', async (req, res) => {
    const { wasteType, binLevel, waste_type, bin_level } = req.body || {};
    const finalWasteType = wasteType ?? waste_type;
    const finalBinLevel = binLevel ?? bin_level;

    if (!finalWasteType || finalBinLevel == null) {
        return res.status(400).json({
            error: 'Missing wasteType or binLevel. Send JSON { wasteType, binLevel }.',
        });
    }

    try {
        const newData = new Waste({
            wasteType: finalWasteType,
            binLevel: Number(finalBinLevel),
        });
        await newData.save();
        res.json({ message: 'Data stored in MongoDB', data: newData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save data', details: err.message });
    }
});

/* GET */
app.get('/data', async (req, res) => {
    try {
        const data = await Waste.find();
        // Transform data to match frontend expectations
        const transformedData = data.map(item => ({
            waste_type: item.wasteType,
            bin_level: item.binLevel,
            timestamp: item.time.toISOString()
        }));
        res.json(transformedData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch data', details: err.message });
    }
});

/* CLASSIFY WASTE IMAGE */
app.post('/classify', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
    }

    const imagePath = path.join(__dirname, req.file.path);
    const scriptPath = path.join(__dirname, 'classify.py');

    const python = spawn(PYTHON_COMMAND, [...PYTHON_ARGS, scriptPath, imagePath], {
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    let result = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
        result += data.toString();
    });

    python.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });

    python.on('error', (spawnError) => {
        console.error('Failed to start Python process:', spawnError);
        res.status(500).json({
            error: 'Classification process could not start',
            details: spawnError.message,
        });
    });

    python.on('close', (code) => {
        if (res.headersSent) {
            return;
        }

        if (code !== 0) {
            console.error('Python classification failed:', errorOutput);
            return res.status(500).json({ error: 'Classification failed', details: errorOutput });
        }

        try {
            const classification = JSON.parse(result.trim());

            if (classification.error) {
                console.error('Classification script error:', classification.error);
                return res.status(500).json({ error: 'Classification failed', details: classification.error });
            }

            const inferredBinLevel = Number.isFinite(classification.confidence)
                ? Math.round(classification.confidence * 100)
                : 0;

            const newData = new Waste({
                wasteType: classification.class,
                binLevel: inferredBinLevel
            });

            newData.save().then(() => {
                res.json({
                    message: 'Waste classified and stored',
                    classification: classification,
                    data: {
                        waste_type: classification.class,
                        bin_level: newData.binLevel,
                        timestamp: newData.time.toISOString()
                    }
                });
            }).catch(err => {
                console.error('Database save error:', err);
                res.status(500).json({ error: 'Failed to save classification', details: err.message });
            });
        } catch (parseError) {
            console.error('JSON parse error:', parseError, 'raw:', result);
            res.status(500).json({ error: 'Failed to parse classification result', details: parseError.message });
        }
    });
});

/* START SERVER */
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});