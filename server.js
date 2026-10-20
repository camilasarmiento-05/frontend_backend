import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";

import dbConnection from "./database.js";
import { validateJWT } from "./middlewares/validateJWT.js";
import { routerUsuario } from "./routes/usuarios.routes.js";
import { routerCurso } from "./routes/cursos.routes.js";
import { routerAprendiz } from "./routes/aprendices.routes.js";

dotenv.config();

// En modulos ES no existe __dirname; se reconstruye a partir de import.meta.url.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Representa el servidor de la aplicacion.
 * @class
 */
class Server {
  /**
   * @constructor
   */
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 4500;
    // Carpeta con el frontend (Vue) ya compilado. Se llena con "npm run deploy:backend"
    // (dentro de /frontend) y este mismo servidor lo sirve junto con la API: asi el
    // frontend y el backend comparten IP y puerto, y no hay URL que cambiar.
    this.publicPath = path.join(__dirname, "public");
    this.middlewares();
    this.routes();
    this.conexionBd();
  }

  /**
   * Middlewares globales (se ejecutan en TODAS las peticiones).
   */
  middlewares() {
    this.app.use(express.json()); // permite leer req.body en formato JSON
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors()); // permite que el frontend (otro puerto) consuma la API
    this.app.use(morgan("dev")); // muestra en consola cada peticion que llega

    // Sirve el frontend ya compilado (index.html, /assets, favicon...). Si aun
    // no has copiado el build, la carpeta "public" no existe y esto simplemente
    // no sirve nada; util en desarrollo, cuando el frontend corre aparte con
    // "npm run dev" en el puerto 5173.
    this.app.use(express.static(this.publicPath));
  }

  /**
   * Registra las rutas de la aplicacion.
   * Cada modelo tiene su propio router montado bajo /api/<recurso>
   *
   * Aqui se ve de un vistazo QUE ESTA PROTEGIDO: el middleware validateJWT se
   * pone entre la URL y el router. Todo lo que pase por ahi necesita mandar la
   * cabecera x-token; si no, corta con un 401 y el controlador ni se entera.
   */
  routes() {
    // Publico: es por donde se consigue el token.
    this.app.use("/api/usuarios", routerUsuario);

    // Privado: requieren token.
    this.app.use("/api/cursos", validateJWT, routerCurso);
    this.app.use("/api/aprendices", validateJWT, routerAprendiz);

    // Ruta de cortesia para comprobar rapido que el servidor responde.
    // El nombre "/life" es un identificador y no se traduce; el mensaje si.
    this.app.use("/life", (req, res) => {
      res.send("El servidor esta funcionando");
    });

    // Una ruta de API (/api/...) que no coincide con las de arriba cae aqui y
    // responde 404 en JSON. Este msg lo muestra el frontend tal cual en un
    // Notify, por eso va en español igual que los demas mensajes del backend.
    this.app.use("/api/*", (req, res) => {
      res.status(404).json({ msg: "La ruta solicitada no existe" });
    });

    // Cualquier OTRA ruta devuelve el index.html del frontend, para que se abra
    // la aplicacion de Vue (asi tambien funciona entrar por una URL directa,
    // ademas del modo hash que usa el router). Si todavia no se ha copiado el
    // build, la carpeta public no existe y responde como antes (util en dev).
    this.app.get("*", (req, res) => {
      const indexHtml = path.join(this.publicPath, "index.html");
      if (fs.existsSync(indexHtml)) {
        return res.sendFile(indexHtml);
      }
      res.status(404).json({ msg: "La ruta solicitada no existe" });
    });
  }

  /**
   * Conecta a la base de datos.
   */
  async conexionBd() {
    await dbConnection();
  }

  /**
   * Inicia el servidor.
   * Escucha en "0.0.0.0" (todas las interfaces de red) para que otros equipos y el
   * celular puedan entrar con la IP de este computador, no solo con "localhost".
   */
  listen() {
    this.app.listen(this.port, "0.0.0.0", () => {
      console.log(`Servidor en http://localhost:${this.port}`);
      // Muestra las IP de la red local para abrir el sistema desde otro equipo.
      Object.values(os.networkInterfaces())
        .flat()
        .filter((i) => i && i.family === "IPv4" && !i.internal)
        .forEach((i) => console.log(`En la red:   http://${i.address}:${this.port}`));
    });
  }
}

export default Server;
