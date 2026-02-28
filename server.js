const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// ========== CORS FIX - ВСТАВЬТЕ ЭТО ==========
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
// ========== КОНЕЦ CORS FIX ==========

// ДАЛЬШЕ ИДЕТ ВАШ КОД...

// ========== ПРАВИЛЬНАЯ КОНФИГУРАЦИЯ ==========
const CONFIG = {
    crystal: {
        apiKey: 'c59255224d64c57afffc67c4a88d3f9a73145ea0f', // Salt - для авторизации
        projectId: 'systememc',
        secretKey: '19c4571402d368303deeb3e6a972bf07cba9d999' // Secret - для подписей
    }
};

app.post('/api/withdraw', async (req, res) => {
    try {
        const { amount, destination, method } = req.body;
        
        console.log('Withdraw request:', { amount, destination, method });
        
        const response = await axios.post('https://api.crystalpay.io/v1/withdraw/create/', {
            amount: amount,
            currency: 'RUB',
            method: method === 'card' ? 'bank_card' : 'usdt_trc20',
            wallet: destination,
            project_id: CONFIG.crystal.projectId
        }, {
            headers: { 
                'Authorization': `Bearer ${CONFIG.crystal.apiKey}`, // Правильно: Secret
                'Content-Type': 'application/json'
            }
        });
        
        console.log('CrystalPay response:', response.data);
        
        if (response.data && response.data.id) {
            res.json({ 
                success: true, 
                message: "Заявка принята!",
                txId: response.data.id 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: response.data?.message || "Ошибка" 
            });
        }
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            message: error.response?.data?.message || error.message 
        });
    }
});

app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: "Сервер работает!",
        config: {
            project: CONFIG.crystal.projectId
            // Ключи не показываем!
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
