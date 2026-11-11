'use strict';
const machineEls=[...document.querySelectorAll('.machine')];
const latency=document.getElementById('latency');
const latencyValue=document.getElementById('latency-value');
const disconnect=document.getElementById('disconnect');
const sendButton=document.getElementById('cloud-action');
const resetButton=document.getElementById('reset');
const cloudResult=document.getElementById('cloud-result');
const cloudElapsed=document.getElementById('cloud-elapsed');
const networkIndicator=document.getElementById('network-indicator');
let requestNumber=0;
let activeController=null;
function readings(){return machineEls.map(el=>({id:el.dataset.id,temperature:Number(el.querySelector('[data-temp]').value),vibration:Number(el.querySelector('[data-vib]').value)}));}
function assessLocal(m){const critical=m.temperature>=90||m.vibration>=9;const warning=!critical&&(m.temperature>=80||m.vibration>=7);return critical?'CRITICA':warning?'AVISO':'NORMAL';}
function updateLocal(){
  const data=readings();let warnings=0,criticals=0;
  machineEls.forEach((el,i)=>{
    const m=data[i],status=assessLocal(m),badge=el.querySelector('[data-status]'),note=el.querySelector('[data-edge]');
    el.querySelector('[data-temp-label]').textContent=m.temperature;
    el.querySelector('[data-vib-label]').textContent=m.vibration;
    badge.textContent=status==='CRITICA'?'Crítica':status==='AVISO'?'Aviso':'Normal';
    badge.className='status '+(status==='CRITICA'?'critical':status==='AVISO'?'warning':'normal');
    note.textContent=status==='CRITICA'?'EDGE: anomalía crítica detectada':status==='AVISO'?'EDGE: anomalía detectada':'EDGE: sin anomalías';
    note.className='edge-line '+(status==='CRITICA'?'crit':status==='AVISO'?'warn':'');
    if(status==='CRITICA')criticals++;if(status==='AVISO')warnings++;
  });
  const mist=document.getElementById('mist-result');
  const alarm=data[0].temperature>80;
  mist.textContent=alarm?'MIST: temperatura de M1 superior a 80 °C. Alerta sencilla.':'MIST: M1 no supera los 80 °C.';
  mist.className='result'+(alarm?' attention':'');
  const edge=document.getElementById('edge-result');
  edge.textContent=`EDGE: ${criticals} anomalía(s) crítica(s), ${warnings} aviso(s). Evaluación local inmediata.`;
  edge.className='result'+(criticals?' failure':warnings?' attention':'');
  const avg=data.reduce((a,m)=>a+m.temperature,0)/data.length;
  const fog=document.getElementById('fog-result');
  fog.textContent=`FOG: temperatura media ${avg.toFixed(1).replace('.',',')} °C; ${criticals+warnings} máquina(s) con anomalías.`;
  fog.className='result'+(criticals?' attention':'');
  invalidateCloud();
}
function invalidateCloud(){
  requestNumber++;
  if(activeController){activeController.abort();activeController=null;}
  sendButton.disabled=false;
  cloudResult.textContent='Las mediciones han cambiado. Pulsa «Analizar en Cloud» para enviar los datos actuales.';
  cloudResult.className='result cloud-result';
  cloudElapsed.textContent='';
}
async function queryCloud(){
  if(disconnect.checked){cloudResult.textContent='Sin respuesta: la conexión Cloud está interrumpida en el simulador.';cloudResult.className='result failure';cloudElapsed.textContent='Mist, Edge y Fog simulados siguen procesando localmente.';return;}
  if(activeController)activeController.abort();
  const controller=new AbortController();activeController=controller;const current=++requestNumber;const t0=performance.now();
  cloudResult.textContent='Enviando lecturas al servidor remoto…';cloudResult.className='result';cloudElapsed.textContent='';sendButton.disabled=true;
  try {
    const response=await fetch('/api/cloud',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({readings:readings(),delayMs:Number(latency.value)}),signal:controller.signal});
    if(!response.ok)throw new Error('Respuesta HTTP '+response.status);
    const result=await response.json();
    if(current!==requestNumber)return;
    cloudResult.textContent=`CLOUD: ${result.total} máquinas analizadas; ${result.criticalCount} críticas, ${result.warningCount} avisos. Media: ${result.averageTemperature.toFixed(1).replace('.',',')} °C.`;
    cloudResult.className='result'+(result.criticalCount?' attention':'');
    cloudElapsed.textContent=`Respuesta recibida en ${Math.round(performance.now()-t0)} ms (incluye el retraso simulado).`;
  } catch(err){if(err.name==='AbortError')return;if(current!==requestNumber)return;cloudResult.textContent='No se pudo contactar con el servicio Cloud. Comprueba la conexión y vuelve a intentarlo.';cloudResult.className='result failure';cloudElapsed.textContent=err.message;}
  finally{if(current===requestNumber){sendButton.disabled=false;activeController=null;}}
}
machineEls.forEach(el=>{el.querySelectorAll('input').forEach(input=>input.addEventListener('input',updateLocal));});
latency.addEventListener('input',()=>{latencyValue.textContent=latency.value+' ms';invalidateCloud();});
disconnect.addEventListener('change',()=>{networkIndicator.textContent=disconnect.checked?'● Conexión Cloud interrumpida (simulación)':'● Simulación de red activa';networkIndicator.className='network-indicator '+(disconnect.checked?'offline':'online');invalidateCloud();});
sendButton.addEventListener('click',queryCloud);
resetButton.addEventListener('click',()=>{const defaults=[[65,3],[73,4],[68,2]];machineEls.forEach((el,i)=>{el.querySelector('[data-temp]').value=defaults[i][0];el.querySelector('[data-vib]').value=defaults[i][1];});latency.value=800;latencyValue.textContent='800 ms';disconnect.checked=false;networkIndicator.textContent='● Simulación de red activa';networkIndicator.className='network-indicator online';updateLocal();});
updateLocal();
