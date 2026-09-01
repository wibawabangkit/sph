const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_enterprise_jwt_key_2026';

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Akses ditolak. Token autentikasi tidak ditemukan.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Token tidak valid atau telah kadaluarsa.' });
    }
}

function tenantScope(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'User belum terautentikasi.' });
    }
    // Super Admin global (without impersonation) can see all data
    if (req.user.role === 'SUPER_ADMIN' && !req.user.is_impersonated) {
        req.tenantCompanyId = req.query.company_id || null;
    } else {
        req.tenantCompanyId = req.user.company_id;
    }
    next();
}

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User belum terautentikasi.' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Hak akses tidak mencukupi untuk melakukan tindakan ini.' });
        }
        next();
    };
}

module.exports = {
    JWT_SECRET,
    verifyToken,
    tenantScope,
    requireRole
};
