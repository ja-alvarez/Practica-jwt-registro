import express from 'express';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import fileUpload from 'express-fileupload';
import moment from 'moment';
import dotenv from 'dotenv';                                    //////////
dotenv.config();                                                //////////
import db from './database/config.js';
import { create } from 'express-handlebars';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import validateToken from './utils/jwtVerify.js'
import validateAdmin from './utils/adminVerify.js'

const app = express();
const log = console.log;
const jwtSecret = process.env.JWT_SECRET;                       //////////

// Inicio configuracion handlebars
const hbs = create({
    partialsDir: [
        path.resolve(__dirname, "./views/partials/"),
    ],
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", path.resolve(__dirname, "./views"));
// Fin configuracion handlebars

// MIDDLEWARES GENERALES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload()); //permite procesar ademas de imagenes, data recibidos del formdata
app.use(morgan('tiny'));

//DEJAR PÚBLICA LA CARPETA PUBLIC
app.use(express.static('public'));

app.listen(3000, () => {
    log('Servidor escuchando en http://localhost:3000')
});

const verificarToken = async (req, res, next) => {
    try {
        const { authorization } = req.headers;
        let token;
        if (authorization) {
            token = authorization.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        } else {
            if (req.url.includes('api/')) {
                return res.status(401).json({
                    message: 'Debe proporcionar un token.'
                });
            } else {
                return res.render('error', {
                    message: 'Petición incorrecta.'
                })
            }
        };
        const decoded = jwt.verify(token, jwtSecret);
        log('DECODED', decoded)
        req.usuario = decoded
        let { rows } = await db.query('SELECT admin FROM usuarios WHERE id = $1 ', [decoded.id]);
        req.usuario.admin = rows[0].admin
        next();
    } catch (error) {
        log(error.message)
        if (req.url.includes('api/')) {
            return res.status(400).json({
                message: 'Debe proporcionar un token válido.'
            })
        } else {
            return res.render('error', {
                message: 'Debe proporcionar un token válido.'
            }) // res.render()
        }
    }
};

// Vistas
app.get('/', (req, res) => {
    res.render('home', {
        homeView: true
    })
});

app.get('/login', (req, res) => {
    res.render('login', {
        loginView: true
    })
});

app.get('/registro', (req, res) => {
    res.render('registro', {
        registroView: true
    })
});

app.get('/perfil', verificarToken, async (req, res) => { //verificarToken  validateToken
    try {
        //log(req.usuario.id)
        let { rows } = await db.query('SELECT id, nombre, email, admin, imagen FROM usuarios WHERE id = $1', [req.usuario.id])
        let usuario = rows[0];
        if (usuario) {
            res.render('perfil', {
                perfilView: true,
                usuario
            });
        } else {
            throw new Error("No existe el usuario.")
        }

        // res.render('perfil')
    } catch (error) {
        log(error)

        res.render('perfil', {
            perfilView: true,
            error: 'No fue posible mostrar sus datos, intente más tarde.'
        })
    }
});

app.get('/administracion', validateToken, validateAdmin, async (req, res) => {
    res.render('adminUsuarios', {
        adminView: true
    })
});


// Endpoints
// Registro de usuarios
app.post('/api/v1/registro', async (req, res) => {
    //Como recibimos los datos, json o formData
    try {
        let { nombre, email, password } = req.body;
        let imagen;
        if (imagen) {
            imagen = req.files.imagen;
            // Ruta donde se guardará la imagen
            let imagenType = imagen.mimetype.split('/')[1]
            let nombreArchivo = `IMG_${nombre}_${moment().format('YYMMDD-HHmmss')}.${imagenType}`
            let uploadPath = path.join(__dirname, '/public/avatars/', nombreArchivo);
            // Guardar imagen
            imagen.mv(uploadPath, (error) => {
                if (error) {
                    log(error)
                    return res.status(500).json({ message: 'No se pudo guardar la imagen en el servidor.' })
                }
            });
            //Guardar info en la base de datos
            let consulta = {
                text: 'INSERT INTO usuarios VALUES (DEFAULT, $1, $2, $3, DEFAULT, $4) ',
                values: [nombre, email, password, `avatars/${nombreArchivo}`]
            };
            await db.query(consulta)

            res.status(201).json({ message: 'ok.' })
        } else {
            let consulta = {
                text: 'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3)',
                values: [nombre, email, password]
            };
            await db.query(consulta)
            res.status(201).json({ message: 'ok.' })
        }
    } catch (error) {
        log(error)
        res.status(500).json({ message: 'Error en proceso de registro usuario' })
    }
});

// Inicio de sesión
app.post('/api/v1/login', async (req, res) => {
    try {
        let { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Debe proporcionar todos los datos para la autenticación.' })
        };

        let consulta = {
            text: 'SELECT id, nombre, email, admin, imagen FROM usuarios WHERE email = $1 AND password = $2',
            values: [email, password]
        };
        let respuesta = await db.query(consulta)

        let usuario = respuesta.rows[0]

        if (!usuario) {
            return res.status(400).json({
                message: "Credenciales inválidas."
            })
        };
        //Generación token jwt
        const token = jwt.sign(usuario, jwtSecret)
        res.status(200).json({
            //data: respuesta.rows,
            message: 'Login correcto.',
            token,
            usuario
        });
    } catch (error) {
        log(error.message)
        res.status(500).json({ message: 'Error en el proceso de login del usuario.' })
    }


});



app.all('/api/*', (req, res) => {
    res.status(404).json({ message: 'El recurso no existe, verifique la documentación.' })
});

app.get('*', (req, res) => {
    res.status(404).render('404')
});