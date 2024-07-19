import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

const validateToken = (req, res, next) => {
    try {
        let { token } = req.query;
        if(!token){
            return res.status(401).json({message: 'Usted necesita iniciar sesión para continuar.'})
        }
        let decoded = jwt.verify(token, jwtSecret);
        req.usuario = decoded;
        console.log(decoded);

        next();
    } catch (error) {
        return res.status(500).json({
            message: 'Error en proceso de verificación de credencial.'
        })
    }
};
export default validateToken;

// const verificarToken = async (req, res, next) => {
//     try {
//         const { authorization } = req.headers;
//         let token;
//         if (authorization) {
//             token = authorization.split(' ')[1];
//         } else if (req.query.token) {
//             token = req.query.token;
//         } else {
//             if (req.url.includes('api/')) {
//                 return res.status(401).json({
//                     message: 'Debe proporcionar un token.'
//                 });
//             } else {
//                 return res.render('error', {
//                     message: 'Petición incorrecta.'
//                 })
//             }
//         };
//         const decoded = jwt.verify(token, jwtSecret);
//         log('DECODED', decoded)
//         req.usuario = decoded
//         let { rows } = await db.query('SELECT admin FROM usuarios WHERE id = $1 ', [decoded.id]);
//         req.usuario.admin = rows[0].admin
//         next();
//     } catch (error) {
//         log(error.message)
//         if (req.url.includes('api/')) {
//             return res.status(400).json({
//                 message: 'Debe proporcionar un token válido.'
//             })
//         } else {
//             return res.render('error', {
//                 message: 'Debe proporcionar un token válido.'
//             }) // res.render()
//         }
//     }
// };