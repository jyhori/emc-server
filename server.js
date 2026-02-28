const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// ========== CORS FIX ==========
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// ========== ПРАВИЛЬНАЯ КОНФИГУРАЦИЯ ==========
const CONFIG = {
    crystal: {
        apiKey: 'c59255224d64c57afffc67c4a88d3f9a73145ea0f', // Secret - для Bearer
        projectId: 'systememc',
        secretKey: '19c4571402d368303deeb3e6a972bf07cba9d999' // Salt - для подписей
    }
};

app.post('/api/withdraw', async (req, res) => {
    try {
        const { amount, destination, method } = req.body;
        
        console.log('=== НОВЫЙ ЗАПРОС НА ВЫВОД ===');
        console.log('1. Данные от клиента:', { amount, destination, method });
        console.log('2. Использую apiKey:', CONFIG.crystal.apiKey.substring(0, 10) + '...');
        console.log('3. Project ID:', CONFIG.crystal.projectId);
        
        // ПОДГОТОВКА ЗАПРОСА К CRYSTALPAY
        const crystalMethod = method === 'card' ? 'bank_card' : 'usdt_trc20';
        const payload = {
            amount: amount,
            currency: 'RUB',
            method: crystalMethod,
            wallet: destination,
            project_id: CONFIG.crystal.projectId
        };
        
        console.log('4. Отправляю в CrystalPay:', JSON.stringify(payload, null, 2));
        
        const response = await axios.post('https://api.crystalpay.io/v1/withdraw/create/', payload, {
            headers: { 
                'Authorization': `Bearer ${CONFIG.crystal.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('5. Успешный ответ от CrystalPay:', response.data);
        
        if (response.data && response.data.id) {
            res.json({ 
                success: true, 
                message: "Заявка принята!",
                txId: response.data.id 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: response.data?.message || "Ошибка CrystalPay" 
            });
        }
        
    } catch (error) {
        console.error('=== ОШИБКА ===');
        console.error('Статус ошибки:', error.response?.status);
        console.error('Данные ошибки:', JSON.stringify(error.response?.data, null, 2));
        console.error('Сообщение:', error.message);
        
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
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔑 Проект: ${CONFIG.crystal.projectId}`);
});
