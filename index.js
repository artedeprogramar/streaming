const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');
const path = require('path');

app.use(cors());

const port = 3000;

app.get('/', (req, res) => {
  res.send('HTTP Streaming -- Episodio 01 / Temporada 06');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

app.get('/video', (req, res) => {
  // Asumiendo que video_example.mp4 está en el mismo directorio que tu script del servidor
  // Define la ruta al archivo de video
  const pathToVideo = path.join(__dirname, 'video_example.mp4');

  // Obtén las estadísticas del archivo de manera sincrónica
  const stat = fs.statSync(pathToVideo);

  // Obtén el tamaño del archivo
  const fileSize = stat.size;

  // Obtén el encabezado de rango de la solicitud
  const range = req.headers.range;

  // Si un encabezado de rango está presente en la solicitud
  if (range) {
    console.log(`Encabezado de rango presente ${range}`);
    // Elimina la parte "bytes=" del encabezado de rango y divídelo en inicio y fin
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    // Calcula el tamaño del fragmento a enviar
    const chunksize = (end - start) + 1;

    // Crea un flujo de lectura para el archivo desde el inicio hasta el fin
    const file = fs.createReadStream(pathToVideo, {start, end});

    // Define los encabezados para la respuesta
    const head = {
      // El rango de bytes que se están enviando
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      // La unidad en la que se especifica el rango
      'Accept-Ranges': 'bytes',
      // La longitud del contenido que se está enviando
      'Content-Length': chunksize,
      // El tipo de contenido que se está enviando
      'Content-Type': 'video/mp4',
    };

    // Escribe los encabezados en la respuesta con un código de estado 206 Contenido Parcial
    res.writeHead(206, head);

    // Conduce el flujo de lectura del archivo a la respuesta
    file.pipe(res);
  } else {
    console.log('Encabezado de rango no presente');
    // Si no hay un encabezado de rango presente en la solicitud

    // Define los encabezados para la respuesta
    const head = {
      'Content-Length': fileSize, // La longitud del contenido que se está enviando
      'Content-Type': 'video/mp4', // El tipo de contenido que se está enviando
    };

    // Escribe los encabezados en la respuesta con un código de estado 200 OK
    res.writeHead(200, head);

    // Crea un flujo de lectura para el archivo completo y conduce al a la respuesta
    fs.createReadStream(pathToVideo).pipe(res);
  }
});
