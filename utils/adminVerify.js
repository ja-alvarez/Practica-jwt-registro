import db from '../database/config.js';
import responseFormat from './responseFormat.js';
import dotenv from 'dotenv';
dotenv.config();

const validateAdmin = async (req, res, next) => {
    try {
        console.log('id USUARIO', req.usuario.id)
        let consulta = {
            text: 'SELECT admin FROM usuarios WHERE id = $1',
            values: [req.usuario.id]
        };
        let { rows } = await db.query(consulta);
        let admin = rows[0].admin;
        if (admin) {
            next();
        } else {
            let message = 'Usted no tiene el nivel de acceso para entrar a la vista.';
            responseFormat(res, req.url, message, 403)
        }
    } catch (error) {
        let message = 'Error en proceso de verificación de credenciales. Intente más tarde.';
        responseFormat(res, req.url, message, 500)
    };
};

export default validateAdmin;