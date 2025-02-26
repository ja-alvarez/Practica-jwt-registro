import jwt from 'jsonwebtoken';
import responseFormat from './responseFormat.js';
import dotenv from 'dotenv';
dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

const validateToken = (req, res, next) => {
    try {
        let { token } = req.query;
        if (!token) {
            let message = 'Necesita iniciar sesión para continuar.';
            responseFormat(res, req.url, message, 401)
        }
        let decoded = jwt.verify(token, jwtSecret);
        req.usuario = decoded;
        console.log(decoded);
        next();
    } catch (error) {
        let message = 'Error en proceso de verificación de credenciales.';
        responseFormat(res, req.url, message, 500)
    }
};
export default validateToken;