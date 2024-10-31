// generateKey.js
import crypto from 'crypto';

// 生成新的加密密钥
function generateEncryptionKey() {
    // 修改为生成32字节（64个十六进制字符）的随机密钥
    const key = crypto.randomBytes(32).toString('hex');
    
    console.log('Generated Encryption Key:');
    console.log(key);
    
    // 验证密钥格式
    if (key.length === 64 && /^[0-9a-f]+$/.test(key)) {
        console.log('\n✅ 密钥格式正确！');
        console.log('\n将以下行添加到你的 .env 文件：');
        console.log(`ENCRYPTION_KEY=${key}`);
    } else {
        console.log('\n❌ 警告：生成的密钥格式不正确！');
    }
}

// 验证现有密钥
function validateKey(key) {
    if (typeof key !== 'string') {
        return false;
    }
    
    // 修改为检查64个字符的长度
    if (key.length !== 64) {
        return false;
    }
    
    // 检查是否只包含十六进制字符
    return /^[0-9a-f]+$/.test(key);
}

// 生成新密钥
console.log('正在生成新的加密密钥...\n');
generateEncryptionKey();

// 使用示例：
const testKey = process.env.ENCRYPTION_KEY;
if (testKey) {
    console.log('\n检查当前环境变量中的密钥：');
    if (validateKey(testKey)) {
        console.log('✅ 当前密钥格式正确');
    } else {
        console.log('❌ 当前密钥格式不正确！请使用新生成的密钥');
    }
}