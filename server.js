const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3000;

const PRODUCTS_FILE = 'products.csv';
const CUPONS_FILE = 'cupons.csv';
const USERS_FILE = 'users.csv';

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Servir arquivos de imagem estaticamente (CAMINHO CORRIGIDO)
app.use('/imagens', express.static(path.join(__dirname, 'imagens')));

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Criar diretório na mesma pasta do servidor
    const dir = path.join(__dirname, 'imagens');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

let products = [];
let cupons = [];
let users = [];

function loadDataFromCSV() {
    // Produtos
    if (fs.existsSync(PRODUCTS_FILE)) {
        const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
        const lines = data.split('\n').filter(l => l.trim() !== '');
        if (lines.length > 1) {
            products = lines.slice(1).map(line => {
                // Função para dividir CSV respeitando aspas
                const parseCSVLine = (line) => {
                    const result = [];
                    let current = '';
                    let inQuotes = false;
                    
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        
                        if (char === '"' && (i === 0 || line[i-1] === ',')) {
                            inQuotes = true;
                        } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
                            inQuotes = false;
                        } else if (char === ',' && !inQuotes) {
                            result.push(current.trim());
                            current = '';
                            continue;
                        } else {
                            current += char;
                        }
                    }
                    result.push(current.trim());
                    return result;
                };

                const fields = parseCSVLine(line);
                const [name, price, image, category] = fields;
                
                console.log('Carregando produto:', { name, price, image, category }); // Debug
                
                return { 
                    name: name || '', 
                    price: parseFloat(price) || 0, 
                    image: image || '', 
                    category: category || '' 
                };
            });
        }
    } else {
        fs.writeFileSync(PRODUCTS_FILE, 'name,price,image,category\n');
    }

    // Cupons
    if (fs.existsSync(CUPONS_FILE)) {
        const data = fs.readFileSync(CUPONS_FILE, 'utf8');
        const lines = data.split('\n').filter(l => l.trim() !== '');
        if (lines.length > 1) {
            cupons = lines.slice(1).map(line => {
                const [code, discount] = line.split(',').map(x => x?.trim());
                return { 
                    code, 
                    discount: parseFloat(discount) || 0 
                };
            });
        }
    } else {
        fs.writeFileSync(CUPONS_FILE, 'code,discount\n');
    }

    // Usuários
    if (fs.existsSync(USERS_FILE)) {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        const lines = data.split('\n').filter(l => l.trim() !== '');
        if (lines.length > 1) {
            users = lines.slice(1).map(line => {
                const parseCSVLine = (line) => {
                    const result = [];
                    let current = '';
                    let inQuotes = false;
                    
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        
                        if (char === '"' && (i === 0 || line[i-1] === ',')) {
                            inQuotes = true;
                        } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
                            inQuotes = false;
                        } else if (char === ',' && !inQuotes) {
                            result.push(current.trim());
                            current = '';
                            continue;
                        } else {
                            current += char;
                        }
                    }
                    result.push(current.trim());
                    return result;
                };

                const fields = parseCSVLine(line);
                const [username, email, password, tipo] = fields;
                
                return { 
                    username, 
                    email, 
                    password, 
                    tipo: tipo || 'cliente' 
                };
            });
        }
    } else {
        fs.writeFileSync(USERS_FILE, 'username,email,password,tipo\n');
    }
}

function saveDataToCSV() {
    try {
        // Produtos
        let productsCSV = 'name,price,image,category\n';
        products.forEach(p => {
            // Escapar vírgulas e aspas nos campos de texto
            const escapeField = (field) => {
                if (!field) return '';
                const str = String(field);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            };

            const name = escapeField(p.name);
            const price = p.price || 0;
            const image = escapeField(p.image);
            const category = escapeField(p.category);
            
            productsCSV += `${name},${price},${image},${category}\n`;
            
            console.log('Salvando produto:', { name, price, image, category }); // Debug
        });
        fs.writeFileSync(PRODUCTS_FILE, productsCSV);

        // Cupons
        let cuponsCSV = 'code,discount\n';
        cupons.forEach(c => {
            cuponsCSV += `${c.code},${c.discount}\n`;
        });
        fs.writeFileSync(CUPONS_FILE, cuponsCSV);

        // Usuários
        let usersCSV = 'username,email,password,tipo\n';
        users.forEach(u => {
            const escapeField = (field) => {
                if (!field) return '';
                const str = String(field);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            };

            const username = escapeField(u.username);
            const email = u.email;
            const password = u.password;
            const tipo = u.tipo || 'cliente';
            
            usersCSV += `${username},${email},${password},${tipo}\n`;
        });
        fs.writeFileSync(USERS_FILE, usersCSV);

        console.log('Dados salvos com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
    }
}

loadDataFromCSV();

// Rota para upload de imagens (CORRIGIDA)
app.post('/upload-image', upload.single('image'), (req, res) => {
   console.log("chegou aqui no uploadimagem")
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Nenhum arquivo foi enviado' });
        }

        // Retornar URL relativa que será salva no CSV
        const imageUrl = `/imagens/${req.file.filename}`;
        
        console.log('Imagem salva:', req.file.filename);
        console.log('URL da imagem:', imageUrl);
        
        res.json({ 
            success: true, 
            imageUrl: imageUrl,
            message: 'Imagem enviada com sucesso'
        });
    } catch (error) {
        console.error('Erro no upload:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// --- Produtos ---
app.get('/produtos', (req, res) => {
    console.log('Enviando produtos:'); // Debug
    res.json(products);
});

app.post('/produtos', (req, res) => {
    const { name, price, image, category } = req.body;
    if (!name || price === undefined) {
        return res.status(400).json({ message: 'Nome e preço são obrigatórios' });
    }

    if (products.find(p => p.name === name)) {
        return res.status(400).json({ message: 'Produto já existe' });
    }

    const newProduct = { 
        name, 
        price: parseFloat(price), 
        image: image || '', 
        category: category || '' 
    };
    
    products.push(newProduct);
    saveDataToCSV();
    
    console.log('Produto adicionado:', newProduct);
    res.status(201).json(newProduct);
});

app.put('/produtos/:name', (req, res) => {
    const nameParam = decodeURIComponent(req.params.name);
    const { name, price, image, category } = req.body;
    const index = products.findIndex(p => p.name === nameParam);
    
    if (index === -1) return res.status(404).json({ message: 'Produto não encontrado' });

    products[index] = {
        name: name || products[index].name,
        price: price !== undefined ? parseFloat(price) : products[index].price,
        image: image !== undefined ? image : products[index].image,
        category: category !== undefined ? category : products[index].category
    };

    saveDataToCSV();
    console.log('Produto atualizado:', products[index]);
    res.json(products[index]);
});

app.delete('/produtos/:name', (req, res) => {
    const nameParam = decodeURIComponent(req.params.name);
    const index = products.findIndex(p => p.name === nameParam);
    
    if (index === -1) return res.status(404).json({ message: 'Produto não encontrado' });

    const removed = products.splice(index, 1)[0];
    saveDataToCSV();
    res.json(removed);
});

// --- Cupons ---
app.get('/cupons', (req, res) => {
    res.json(cupons);
});

app.post('/cupons', (req, res) => {
    const { code, discount } = req.body;
    if (!code || discount === undefined) {
        return res.status(400).json({ message: 'Código e desconto são obrigatórios' });
    }

    if (cupons.find(c => c.code === code)) {
        return res.status(400).json({ message: 'Cupom já existe' });
    }

    const newCupom = { code, discount: parseFloat(discount) };
    cupons.push(newCupom);
    saveDataToCSV();
    res.status(201).json(newCupom);
});

app.put('/cupons/:code', (req, res) => {
    const codeParam = decodeURIComponent(req.params.code);
    const { code, discount } = req.body;
    const index = cupons.findIndex(c => c.code === codeParam);
    
    if (index === -1) return res.status(404).json({ message: 'Cupom não encontrado' });

    cupons[index] = {
        code: code || cupons[index].code,
        discount: discount !== undefined ? parseFloat(discount) : cupons[index].discount
    };

    saveDataToCSV();
    res.json(cupons[index]);
});

app.delete('/cupons/:code', (req, res) => {
    const codeParam = decodeURIComponent(req.params.code);
    const index = cupons.findIndex(c => c.code === codeParam);
    
    if (index === -1) return res.status(404).json({ message: 'Cupom não encontrado' });

    const removed = cupons.splice(index, 1)[0];
    saveDataToCSV();
    res.json(removed);
});

// Rota para validar cupom
app.post('/cupons/validar', (req, res) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ message: 'Código do cupom é obrigatório' });
    }

    const cupom = cupons.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (!cupom) {
        return res.status(404).json({ message: 'Cupom não encontrado' });
    }

    res.json({ 
        valid: true, 
        discount: cupom.discount,
        message: `Cupom válido! Desconto de ${(cupom.discount * 100).toFixed(0)}%`
    });
});

// --- Usuários ---
app.get('/users', (req, res) => {
    res.json(users);
});

// Rota de login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios' });
    }

    const found = users.find(u =>
        u.email === email &&
        u.password === password
    );

    if (found) {
        res.json({ 
            success: true, 
            message: 'Login bem-sucedido', 
            user: {
                username: found.username,
                email: found.email,
                tipo: found.tipo
            }
        });
    } else {
        res.status(401).json({ success: false, message: 'Email ou senha inválidos' });
    }
});

// Rota de cadastro
app.post('/cadastro', (req, res) => {
    const { username, email, password, tipo } = req.body;
    if (!email || !username || !password) {
        return res.status(400).json({ message: 'Email, usuário e senha são obrigatórios' });
    }

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'E-mail já cadastrado' });
    }

    const newUser = { 
        username, 
        email, 
        password, 
        tipo: tipo || 'cliente' 
    };
    users.push(newUser);
    saveDataToCSV();
    res.status(201).json({ 
        success: true, 
        user: { 
            username: newUser.username, 
            email: newUser.email, 
            tipo: newUser.tipo 
        },
        message: 'Cadastro realizado com sucesso'
    });
});

app.post('/users', (req, res) => {
    const { username, email, password, tipo } = req.body;
    if (!email || !username || !password) {
        return res.status(400).json({ message: 'Email, usuário e senha são obrigatórios' });
    }

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'Usuário já existe' });
    }

    const newUser = { 
        username, 
        email, 
        password, 
        tipo: tipo || 'cliente' 
    };
    users.push(newUser);
    saveDataToCSV();
    res.status(201).json(newUser);
});

app.put('/users/:email', (req, res) => {
    const emailParam = decodeURIComponent(req.params.email);
    const { username, email, password, tipo } = req.body;
    const index = users.findIndex(u => u.email === emailParam);
    
    if (index === -1) return res.status(404).json({ message: 'Usuário não encontrado' });

    users[index] = {
        username: username || users[index].username,
        email: email || users[index].email,
        password: password || users[index].password,
        tipo: tipo || users[index].tipo || 'cliente'
    };

    saveDataToCSV();
    res.json(users[index]);
});

app.delete('/users/:email', (req, res) => {
    const emailParam = decodeURIComponent(req.params.email);
    const index = users.findIndex(u => u.email === emailParam);
    
    if (index === -1) return res.status(404).json({ message: 'Usuário não encontrado' });

    const removed = users.splice(index, 1)[0];
    saveDataToCSV();
    res.json(removed);
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});