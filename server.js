const express = require('express');
const cors = require('cors');
const axios = require('axios');
const ftp = require('basic-ftp');
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();

const app = express();

const PORT = process.env.BACKEND_PORT || 4000;
const JSON_SERVER_URL = process.env.JSON_SERVER_URL || 'http://localhost:5000/incidents';
const LOCAL_LOG_DIR = path.join(__dirname, 'logs');

app.use(cors());
app.use(express.json());

function safe(value) {
  return String(value ?? '').replace(/[\r\n]/g, ' ').trim();
}

function createLogText(incident) {
  return [
    'Создан новый инцидент',
    `Время создания лога: ${new Date().toISOString()}`,
    `ID инцидента: ${safe(incident.id)}`,
    `Название: ${safe(incident.title)}`,
    `Описание: ${safe(incident.description)}`,
    `Место: ${safe(incident.location)}`,
    `Дата инцидента: ${safe(incident.date)}`,
    `Статус: ${safe(incident.status)}`,
    `Ответственный: ${safe(incident.responsible)}`,
    ''
  ].join('\n');
}

async function uploadLogToFtps(localFilePath, remoteFileName) {
    const client = new ftp.Client(30000);
    client.ftp.verbose = true;
  
    try {
      await client.access({
        host: process.env.FTPS_HOST,
        port: Number(process.env.FTPS_PORT || 21),
        user: process.env.FTPS_USER,
        password: process.env.FTPS_PASSWORD,
        secure: true,
        secureOptions: {
          rejectUnauthorized: process.env.FTPS_REJECT_UNAUTHORIZED === 'true'
        }
      });
  
      const remoteDir = process.env.FTPS_REMOTE_DIR || '/logs';
  
      await client.cd(remoteDir);
      await client.uploadFrom(localFilePath, remoteFileName);
    } finally {
      client.close();
    }
  }

app.post('/api/incidents', async (req, res) => {
  try {
    const { title, description, location, date, status, responsible } = req.body;

    if (!title || !description || !location || !date || !status || !responsible) {
      return res.status(400).json({
        message: 'Заполнены не все поля инцидента.'
      });
    }

    const createdResponse = await axios.post(JSON_SERVER_URL, {
      title,
      description,
      location,
      date,
      status,
      responsible
    });

    const createdIncident = createdResponse.data;

    await fs.mkdir(LOCAL_LOG_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const remoteFileName = `incident-${createdIncident.id}-${timestamp}.log`;
    const localFilePath = path.join(LOCAL_LOG_DIR, remoteFileName);

    await fs.writeFile(localFilePath, createLogText(createdIncident), 'utf8');

    await uploadLogToFtps(localFilePath, remoteFileName);

    return res.status(201).json({
      message: 'Инцидент создан, лог-файл отправлен на FTPS-сервер.',
      incident: createdIncident,
      logFile: remoteFileName
    });
  } catch (error) {
    console.error('Ошибка создания инцидента или отправки лога:', error.message);

    return res.status(500).json({
      message: 'Инцидент не создан или лог не отправлен. Проверьте json-server и FTPS-настройки.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend запущен: http://localhost:${PORT}`);
});