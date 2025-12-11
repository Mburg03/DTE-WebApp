# Factura Automate (Backend)

API en Node.js/Express para autenticar usuarios, conectar Gmail por OAuth, gestionar keywords y buscar/descargar facturas (PDF/JSON) desde Gmail. Se conecta a MongoDB (Atlas o local) y guarda los adjuntos en `backend/uploads/zips/<userId>/<lote>/`.

## Requisitos
- Node.js 18+  
- MongoDB (Atlas recomendado)  
- Credenciales OAuth de Google (Gmail API habilitada)

## Variables de entorno (`backend/.env`)
```
PORT=5001
MONGO_URI=mongodb+srv://.../dte-webapp?retryWrites=true&w=majority
JWT_SECRET=clave_larga
ENCRYPTION_KEY=32_caracteres_exactos
CORS_ORIGIN=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:5001/api/gmail/callback
# opcional: timeout hacia Google en ms (default 45000)
GOOGLE_API_TIMEOUT_MS=60000
```

## Setup rápido
```
cd backend
npm install
npm run dev   # o npm start para producción local
```

## OAuth Gmail (dev)
1) En Google Cloud: habilita Gmail API, crea OAuth consent (External, añade Test Users), y un OAuth Client tipo Web con redirect `http://localhost:5001/api/gmail/callback`.
2) Coloca CLIENT_ID/SECRET/REDIRECT en `.env`.
3) Flujo: `GET /api/gmail/auth` (con Bearer) → abre la URL → acepta permisos → callback guarda el refresh_token cifrado.

## Endpoints clave
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- Gmail: `GET /api/gmail/status`, `GET /api/gmail/auth`, `GET /api/gmail/callback`, `DELETE /api/gmail`, `POST /api/gmail/search` (body `{ startDate, endDate }`, usa keywords base+custom)
- Keywords: `GET /api/keywords`, `POST /api/keywords` (agrega custom), `DELETE /api/keywords/:keyword`

## Descargas
Los adjuntos se guardan en `backend/uploads/zips/<userId>/<lote>/JSON_y_PDFS` (carpeta por correo) y `.../SOLO_PDF` (plano). Añade `uploads/zips` al `.gitignore` para no versionar archivos.

## Scripts
- `npm run dev` (nodemon, ignora uploads/downloads)
- `npm start` (node server.js)

## Notas
- JWT es stateless: logout = borrar token en cliente.
- Keywords base están en `config/searchConfig.js`; las custom son por usuario.
- Límite de búsqueda actual: máx. 100 mensajes por lote; ajusta en `gmailService.processInvoices`.
