export interface ScormShellOptions {
  sessionId: string;
  launchPath: string;
  standard: string;
  initialState: Record<string, string>;
  initialSequence: number;
}

export function renderScormPlayerShell(options: ScormShellOptions): string {
  const config = safeJson({
    sessionId: options.sessionId,
    launchUrl: `/api/v1/player/scorm/sessions/${options.sessionId}/content/${options.launchPath.split("/").map(encodeURIComponent).join("/")}`,
    eventUrl: `/api/v1/player/scorm/sessions/${options.sessionId}/events`,
    standard: options.standard,
    initialState: options.initialState,
    initialSequence: options.initialSequence,
  });
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Respongo SCORM Player</title><style>html,body,#course{width:100%;height:100%;margin:0;border:0;background:#fff}body{overflow:hidden}#status{position:fixed;inset:0;display:grid;place-items:center;font:500 14px system-ui;color:#334155;background:#f8fafc}#course{display:none}</style></head><body><div id="status" role="status">Eğitim hazırlanıyor…</div><iframe id="course" title="SCORM eğitimi" referrerpolicy="no-referrer" allow="fullscreen" sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads"></iframe><script>(()=>{const cfg=${config};const values={...cfg.initialState};let sequence=Number(cfg.initialSequence)||0;let initialized=false;let terminated=false;let lastError='0';let queue=Promise.resolve();const status=document.getElementById('status');const frame=document.getElementById('course');
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};const duration=v=>{if(!v)return 0;if(/^PT/.test(v)){const m=v.match(/^PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/);return m?(Number(m[1]||0)*3600+Number(m[2]||0)*60+Number(m[3]||0)):0}const p=String(v).split(':').map(Number);return p.length===3&&p.every(Number.isFinite)?p[0]*3600+p[1]*60+p[2]:0};
const normalized=()=>{let completion=null,success=null,progress=null,scoreRaw=null,scoreScaled=null,seconds=0;if(cfg.standard==='scorm_1_2'){const s=values['cmi.core.lesson_status'];if(s==='completed')completion='complete';if(s==='incomplete'||s==='browsed')completion='incomplete';if(s==='passed'){completion='complete';success='passed'}if(s==='failed'){completion='complete';success='failed'}scoreRaw=n(values['cmi.core.score.raw']);seconds=duration(values['cmi.core.session_time'])}else{completion=values['cmi.completion_status']==='completed'?'complete':values['cmi.completion_status']==='incomplete'?'incomplete':null;success=['passed','failed'].includes(values['cmi.success_status'])?values['cmi.success_status']:null;progress=n(values['cmi.progress_measure']);scoreRaw=n(values['cmi.score.raw']);scoreScaled=n(values['cmi.score.scaled']);seconds=duration(values['cmi.session_time'])}return{completionStatus:completion,successStatus:success,progress,scoreRaw,scoreScaled,sessionDurationSeconds:seconds}};
const send=kind=>{sequence+=1;const event={idempotencyKey:(crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+sequence),sequence,kind,occurredAt:new Date().toISOString(),...normalized(),stateSnapshot:{...values}};queue=queue.then(()=>fetch(cfg.eventUrl,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(event),keepalive:true}).then(r=>{if(!r.ok)throw new Error('runtime '+r.status)})).catch(()=>{lastError='391'});return 'true'};
const initialize=()=>{if(initialized||terminated){lastError='101';return 'false'}initialized=true;lastError='0';send('initialized');return 'true'};const getValue=k=>{if(!initialized||terminated){lastError='301';return ''}lastError='0';return String(values[k]??'')};const setValue=(k,v)=>{if(!initialized||terminated){lastError='351';return 'false'}values[k]=String(v);lastError='0';return 'true'};const commit=()=>{if(!initialized||terminated){lastError='301';return 'false'}return send('progressed')};const finish=()=>{if(!initialized||terminated){lastError='301';return 'false'}terminated=true;const exit=values[cfg.standard==='scorm_1_2'?'cmi.core.exit':'cmi.exit'];const completion=normalized().completionStatus;send(exit==='suspend'||completion!=='complete'?'suspended':'terminated');return 'true'};const errorString=code=>code==='0'?'No error':'SCORM runtime error';
window.API={LMSInitialize:initialize,LMSFinish:finish,LMSGetValue:getValue,LMSSetValue:setValue,LMSCommit:commit,LMSGetLastError:()=>lastError,LMSGetErrorString:errorString,LMSGetDiagnostic:errorString};window.API_1484_11={Initialize:initialize,Terminate:finish,GetValue:getValue,SetValue:setValue,Commit:commit,GetLastError:()=>lastError,GetErrorString:errorString,GetDiagnostic:errorString};
frame.addEventListener('load',()=>{status.remove();frame.style.display='block'});frame.src=cfg.launchUrl;window.addEventListener('pagehide',()=>{if(initialized&&!terminated)finish()})})();</script></body></html>`;
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
