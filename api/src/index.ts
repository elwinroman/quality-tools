import { createAllRouter } from './config/all.route'
import { ALLOWED_ORIGINS, PORT } from './config/enviroment'
import { Server } from './config/server.controller'

new Server({
  port: PORT,
  routes: createAllRouter(),
  allowedOrigins: ALLOWED_ORIGINS,
}).start()
