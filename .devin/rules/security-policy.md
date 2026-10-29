# Security Policy - Bảo Mật API Keys & Sensitive Data

## 🚨 QUAN TRỌNG - KHÔNG BAO GIỜ COMMIT SECRETS ĐẾN GIT

### Nguyên tắc cốt lõi
**TẤT CẢ sensitive information phải được giữ riêng tư và KHÔNG ĐƯỢC push lên Git repository.**

---

## 📋 Những gì KHÔNG ĐƯỢC commit

### 1. Environment Files (.env)
- ❌ `.env` - File environment chứa real API keys, secrets
- ❌ `.env.local` - Environment local
- ❌ `.env.development.local` - Development secrets
- ❌ `.env.production.local` - Production secrets
- ❌ `.env.*.local` - Bất kỳ file local nào

### 2. API Keys & Secrets
- ❌ Database connection strings (MongoDB, PostgreSQL, MySQL)
- ❌ JWT_SECRET or JWT keys
- ❌ API keys cho dịch vụ bên ngoài:
  - Stripe API keys
  - AWS Access Keys
  - Google Cloud API keys
  - Firebase config
  - SendGrid API keys
  - Cloudinary API keys
  - Payment gateway keys
  - Email service keys
  - Third-party OAuth secrets
- ❌ Encryption keys
- ❌ Certificates (.pem, .crt, .key)
- ❌ SSH keys

### 3. Account Credentials
- ❌ Username/password cho production
- ❌ Admin account credentials
- ❌ Database passwords
- ❌ Service account credentials

### 4. Sensitive Configuration
- ❌ Production URLs không công khai
- ❌ Internal service endpoints
- ❌ API endpoints không được public
- ❌ Webhook URLs với secrets

---

## ✅ Những gì ĐƯỢC commit

### 1. Environment Templates (.env.example)
```bash
# .env.example - Template cho reference
MONGODB_URI=mongodb://localhost:27017/shop-project
JWT_SECRET=your_jwt_secret_here
PORT=5000
NODE_ENV=development
```

### 2. Documentation
- ✅ README với hướng dẫn setup environment variables
- ✅ Comments trong code mô tả những env vars cần thiết
- ✅ Documentation API public endpoints

### 3. Public Configuration
- ✅ Public API endpoints
- ✅ Frontend config không chứa secrets
- ✅ Constants và config values an toàn

---

## 🔒 Quy trình làm việc

### Trước khi push code:
1. **Kiểm tra .gitignore** đảm bảo tất cả sensitive files được ignore
2. **Chạy git status** để xem những files đang được staged
3. **Review diff** với `git diff --staged` để đảm bảo không có secrets
4. **Không bao giờ hardcode** secrets trong source code

### Khi cần environment variables:
1. **Tạo .env.example** với placeholder values
2. **Commit .env.example** để team biết cần setup gì
3. **Add .env đến .gitignore** (nếu chưa có)
4. **Tạo .env local** với real values (KHÔNG commit)
5. **Document** trong README hoặc docs folder

---

## 🛡️ .gitignore Configuration

### Root .gitignore
```gitignore
# Environment files
.env
.env.local
.env.*.local
*.env

# Secrets
*.pem
*.key
*.crt
secrets/
credentials/

# Logs có thể chứa sensitive info
*.log
logs/
```

### Backend .gitignore
```gitignore
node_modules/
.env
.env.local
.env.*.local
*.log
*.pem
*.key
secrets/
```

### Frontend .gitignore
```gitignore
node_modules/
dist/
.env
.env.local
.env.*.local
*.log
```

---

## 📝 Best Practices

### 1. Code Review Checklist
- [ ] Không có real API keys trong code
- [ ] Không có .env files trong staging area
- [ ] Không có secrets trong comments
- [ ] .env.example được commit
- [ ] .gitignore includes .env patterns

### 2. Environment Variables in Code
```javascript
// ❌ BAD - Hardcoded secrets
const dbUri = 'mongodb://user:password@localhost:27017/db';

// ✅ GOOD - Use environment variables
const dbUri = process.env.MONGODB_URI;
```

### 3. Logs & Debugging
```javascript
// ❌ BAD - Logging secrets
console.log('API Key:', process.env.API_KEY);

// ✅ GOOD - Safe logging
console.log('Database connected');
```

### 4. Error Messages
```javascript
// ❌ BAD - Exposing sensitive info
res.status(500).json({ error: process.env.DB_PASSWORD });

// ✅ GOOD - Generic error message
res.status(500).json({ error: 'Database connection failed' });
```

---

## 🔍 Tools & Automation

### Pre-commit Hooks (Optional)
Sử dụng git-secrets hoặc similar tools để tự động detect secrets:
```bash
# Install git-secrets
brew install git-secrets  # macOS
# hoặc
apt-get install git-secrets  # Linux

# Setup
git secrets --register-aws
git secrets --add 'password'
git secrets --add 'api_key'
git secrets --add 'secret'
```

### Git TruffleHog
```bash
# Scan repository cho secrets
trufflehog git https://github.com/your-repo
```

---

## 🚨 Nếu secrets đã bị commit

### Immediate Actions:
1. **Xóa secrets từ commit history** (git filter-branch hoặc BFG Repo-Cleaner)
2. **Rotate tất cả exposed keys** ngay lập tức
3. **Review access logs** cho bất kỳ suspicious activity
4. **Notify team** về incident
5. **Update .gitignore** để ngăn chặn lại

### Remove from History:
```bash
# Sử dụng BFG Repo-Cleaner
bfg --replace-text passwords.txt  # file chứa patterns để xóa
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

---

## 📚 Reference Files Location

### Backend
- `.env.example` - Template cho environment variables
- `.gitignore` - Ensure `.env` is ignored

### Frontend
- `.env.example` - Template cho frontend env vars
- `.gitignore` - Ensure `.env` is ignored

### Root
- `.gitignore` - Global ignore patterns
- `README.md` - Setup instructions

---

## ⚠️ Consequences

Violating this security policy can lead to:
- **Security breaches** và data leaks
- **Financial loss** từ API abuse
- **Legal issues** với compliance (GDPR, PCI-DSS)
- **Reputation damage** cho project và team
- **Account suspension** từ service providers

---

## 📞 Reporting Security Issues

Nếu bạn phát hiện security vulnerability:
1. KHÔNG commit secrets đến repo
2. Report ngay lập tức đến project lead
3. Follow responsible disclosure
4. Help fix the issue properly

---

**REMEMBER:** Nếu không chắc chắn - KHÔNG COMMIT. Luôn hỏi trước khi push bất kỳ gì có vẻ như sensitive information.
