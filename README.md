# Fábrica Conectada: simulador Cloud / Edge / Fog / Mist

Simulador didáctico para **Digitalización Aplicada al Sector Productivo (2.º DAM)**.

## Cómo ejecutarlo en local

Se necesita Node.js 18 o superior. No requiere instalar bibliotecas externas.

```bash
npm start
```

Abrir `http://localhost:3000`.

## Cómo publicarlo en Render (plan gratuito)

1. Crear un repositorio nuevo en GitHub y subir los archivos conservando `public/` y `server.js` en la raíz.
2. En Render: **New → Web Service → conectar repositorio GitHub**.
3. Language: **Node**. Root Directory: vacío. Build Command: `npm install`. Start Command: `npm start`. Instance Type: **Free**.
4. Abrir la URL pública cuando el estado sea `Live`.

**No hace falta base de datos ni `DATABASE_URL`.** No publicar claves o contraseñas. Este simulador es independiente de AulaSoporte; aconsejamos crear **otro repositorio y otro Web Service**, sin modificar AulaSoporte.

## Qué es real y qué está simulado

- **Sensores:** valores ficticios movidos por el alumnado, no sensores físicos.
- **Mist:** una comparación de umbral para M1, simulada en el navegador.
- **Edge:** procesamiento inmediato de las mediciones de cada máquina, simulado en el navegador.
- **Fog:** agregación de datos de las tres máquinas, simulada en el navegador para representar una pasarela de fábrica. No hay un equipo Fog real.
- **Cloud:** el navegador envía lecturas por HTTP POST a `/api/cloud`, que las procesa en el backend Node.js. Si se publica en Render, el backend sí se ejecuta en infraestructura remota.
- **Latencia:** la interfaz permite añadir retrasos artificiales de 0 a 3000 ms a la respuesta del backend; no es una medida de latencia real ni una comparación de rendimiento científico.
- **Fallo de Internet:** el interruptor bloquea las solicitudes Cloud dentro del simulador. No desactiva la conexión real del dispositivo.

Este material sirve para comparar dependencia de la red y lugares del procesamiento; no representa un controlador industrial real. La seguridad y parada de emergencia requieren sistemas específicos.

## Propuesta de 50 minutos

- 5 min: introducción y prueba normal.
- 10 min: cambiar sensores y entender Mist/Edge/Fog.
- 10 min: solicitud a Cloud con retrasos variables.
- 10 min: simular el fallo de conexión.
- 10 min: capturas y tabla de resultados.
- 5 min: conclusión de qué procesar dónde.

## Pruebas automáticas

```bash
npm test
```
