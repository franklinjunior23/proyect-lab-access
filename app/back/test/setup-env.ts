// Carga las variables de entorno antes de que NestJS inicialice los módulos
import 'dotenv/config';

// Usa una BD separada para no contaminar dev.db
process.env.DATABASE_URL = 'file:./test.db';
