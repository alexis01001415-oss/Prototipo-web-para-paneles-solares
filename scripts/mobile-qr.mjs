import QRCode from 'qrcode';
import { networkInterfaces } from 'node:os';
import { isIP } from 'node:net';
import { mkdir, writeFile } from 'node:fs/promises';

const addresses = Object.entries(networkInterfaces()).flatMap(([name, entries]) =>
  (entries || []).filter(item => item.family === 'IPv4' && !item.internal && /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(item.address)).map(item => ({ name, address: item.address }))
).sort((a,b) => Number(/virtual|wsl|docker|vpn/i.test(a.name)) - Number(/virtual|wsl|docker|vpn/i.test(b.name)));
const host = process.argv[2] || addresses[0]?.address;
if (!host || isIP(host) !== 4) throw new Error('No se encontró una IP de red local. Conecta la PC al router y ejecuta npm run qr -- 192.168.x.x');
const url = `http://${host}:5174/`;
await mkdir('output', { recursive: true });
await QRCode.toFile('output/helio-qr.png', url, { width: 480, margin: 3, errorCorrectionLevel: 'M', color: { dark: '#132a13', light: '#ffffff' } });
const qr = await QRCode.toDataURL(url, { width: 400, margin: 3, color: { dark: '#132a13', light: '#ffffff' } });
await writeFile('acceso-movil.html', `<!doctype html><html lang="es-MX"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>HELIO · Acceso desde tu celular</title><style>body{font-family:system-ui;background:#132a13;color:#ecf39e;min-height:100svh;margin:0;display:grid;place-items:center}main{max-width:600px;padding:32px;text-align:center}h1{font-size:36px;font-weight:500}img{max-width:100%;width:300px;border-radius:12px}a{color:#fff;overflow-wrap:anywhere}p{line-height:1.5;color:#e2e9d8}.note{font-size:14px}</style><main><p>HELIO / REVISIÓN MÓVIL</p><h1>Escanea. Explora. Prueba.</h1><img src="${qr}" alt="Código QR para abrir HELIO en la red local"><p><a href="${url}">${url}</a></p><p>Conecta tu celular al mismo router o Wi-Fi que esta PC. Mantén encendida la computadora y abierto el servidor.</p><p class="note">Este enlace funciona dentro de tu red. Si cambia la IP, ejecuta <code>npm run qr</code>. Para encender el servidor: <code>npm run dev:mobile</code>.</p></main></html>`);
await writeFile('output/acceso-movil.txt', `${url}\nMisma red local. PC encendida. Ejecutar npm run dev:mobile.\n`);
console.log(`Enlace móvil: ${url}\nQR: output/helio-qr.png\nPágina del QR: http://localhost:5174/acceso-movil.html`);
