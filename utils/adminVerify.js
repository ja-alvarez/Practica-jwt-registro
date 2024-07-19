import db from '../database/config.js';
import dotenv from 'dotenv';
dotenv.config();


const validateAdmin = async (req, res, next) => {
    try {
        console.log('id USUARIO',req.usuario.id)
        let consulta = {
            text: 'SELECT admin FROM usuarios WHERE id = $1',
            values: [req.usuario.id]
        };
        let { rows } = await db.query(consulta);
        let admin = rows[0].admin;
        if (admin){
            next();
        } else {
            res.status(403).json({
                message: 'Usted no tiene el nivel de acceso para entrar a la vista.'
            })
        }

    } catch (error) {
        console.log('adminVerify', error)
        res.status(500).json({
            message: 'Error en proceso de verificación de credenciales. Intente más tarde.'
        })
    }
};

export default validateAdmin;