'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const PUBLIC = path.join(__dirname, 'public');
const TYPES = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.ico':'image/x-icon' };

function assess(readings) {
  const machines = readings.map(m => {
    const temperature = Number(m.temperature);
    const vibration = Number(m.vibration);
    const critical = temperature >= 90 || vibration >= 9;
    const warning = !critical && (temperature >= 80 || vibration >= 7);
    return { id: m.id, temperature, vibration, status: critical?'CRITICA':warning?'AVISO':'NORMAL' };
  });
  return {
    source: 'servidor-cloud',
    receivedAt: new Date().toISOString(),
    total: machines.length,
    criticalCount: machines.filter(m=>m.status==='CRITICA').length,
    warningCount: machines.filter(m=>m.status==='AVISO').length,
    averageTemperature: Number((machines.reduce((a,m)=>a+m.temperature,0)/machines.length).toFixed(1)),
    machines
  };
}
function validReadings(data) {
  return data && Array.isArray(data.readings) && data.readings.length===3 && data.readings.every(m =>
    typeof m.id === 'string' && /^M[123]$/.test(m.id) && Number.isFinite(m.temperature) && m.temperature>=0 && m.temperature<=150 && Number.isFinite(m.vibration) && m.vibration>=0 && m.vibration<=20
  ) && (new Set(data.readings.map(m=>m.id))).size===3;
}
function sendJson(res, status, obj){ const s=JSON.stringify(obj);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Content-Length':Buffer.byteLength(s)});res.end(s); }
function makeServer(){
  return http.createServer((req,res)=>{
    let url; try {url=new URL(req.url,'http://localhost');} catch {return sendJson(res,400,{error:'URL inválida'});}
    if(url.pathname==='/api/salud' && req.method==='GET') return sendJson(res,200,{estado:'ok',servicio:'simulador-fabrica',version:'1.0'});
    if(url.pathname==='/api/cloud' && req.method==='POST') {
      let body='';
      req.on('data',chunk=>{ body+=chunk; if(body.length>12000) req.destroy(); });
      req.on('end',()=>{
        let data;try{data=JSON.parse(body);}catch{return sendJson(res,400,{error:'JSON inválido'});}
        if(!validReadings(data)) return sendJson(res,400,{error:'Se esperan 3 máquinas con mediciones válidas'});
        const delay = Math.min(3000,Math.max(0,Number.isFinite(data.delayMs)?data.delayMs:0));
        setTimeout(()=>sendJson(res,200,assess(data.readings)),delay);
      });
      return;
    }
    if(req.method!=='GET' && req.method!=='HEAD') return sendJson(res,405,{error:'Método no permitido'});
    const staticFile = url.pathname==='/' ? '/index.html' : url.pathname;
    if(!['/index.html','/styles.css','/app.js'].includes(staticFile))return sendJson(res,404,{error:'No encontrado'});
    const file=path.join(PUBLIC,staticFile);
    fs.readFile(file,(err,content)=>{
      if(err) return sendJson(res,500,{error:'No se pudo cargar el archivo'});
      res.writeHead(200,{'Content-Type':TYPES[path.extname(file)],'Content-Length':content.length,'Cache-Control':'no-store'});
      res.end(req.method==='HEAD'?undefined:content);
    });
  });
}
if(require.main===module){ const port=Number(process.env.PORT)||3000; makeServer().listen(port,'0.0.0.0',()=>console.log(`Simulador listo en puerto ${port}`)); }
module.exports={makeServer,assess,validReadings};
