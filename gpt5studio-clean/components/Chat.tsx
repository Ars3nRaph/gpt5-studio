'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import FilePill from './FilePill';
type Role = 'user'|'assistant'|'system';
type Msg = { role: Role; content: string };
type Conversation = { id: string; title: string; messages: Msg[]; files: {file_id:string; filename:string}[] };
function uid(){ return Math.random().toString(36).slice(2); }
function useLocalStorage<T>(key:string, initial:T){
  const [state,setState] = useState<T>(()=>{ try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw) as T:initial;}catch{return initial;} });
  useEffect(()=>{ localStorage.setItem(key, JSON.stringify(state)); }, [key,state]);
  return [state,setState] as const;
}
export default function Chat(){
  const [convos,setConvos] = useLocalStorage<Conversation[]>('gpt5-convos',[{id:uid(),title:'Nouvelle discussion',messages:[],files:[]}] );
  const [activeId,setActiveId] = useLocalStorage<string>('gpt5-active',convos[0].id);
  const active = useMemo(()=>convos.find(c=>c.id===activeId)!,[convos,activeId]);
  const [input,setInput] = useState('');
  const [devMode,setDevMode] = useLocalStorage<boolean>('gpt5-dev',true);
  const [useCI,setUseCI] = useLocalStorage<boolean>('gpt5-ci',false);
  const [isStreaming,setStreaming] = useState(false);
  const [lastUser,setLastUser] = useState('');
  const [controller,setController] = useState<AbortController|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollDown = () => scrollRef.current?.scrollTo({top:scrollRef.current.scrollHeight,behavior:'smooth'});
  useEffect(()=>{ setTimeout(scrollDown, 50); }, [active?.messages.length]);
  function updateActive(upd:(c:Conversation)=>Conversation){ setConvos(list=>list.map(c=>c.id===active.id?upd(c):c)); }
  function newChat(){ const c:Conversation={id:uid(),title:'Nouvelle discussion',messages:[],files:[]}; setConvos(l=>[c,...l]); setActiveId(c.id); }
  function renameActive(){ const t=prompt('Nouveau titre ?',active.title); if(!t) return; updateActive(c=>({...c,title:t})); }
  function deleteActive(){ if(!confirm('Supprimer cette conversation ?')) return; setConvos(list=>{ const f=list.filter(c=>c.id!==active.id); const next=f[0]??{id:uid(),title:'Nouvelle discussion',messages:[],files:[]}; setActiveId(next.id); return f.length?f:[next]; }); }
  async function handleUpload(fileList: FileList | null){
    if(!fileList?.length) return;
    const f = fileList[0];
    const fd = new FormData(); fd.append('file', f);
    const res = await fetch('/api/upload',{method:'POST',body:fd});
    const j = await res.json();
    updateActive(c=>({...c,files:[...c.files,{file_id:j.file_id, filename:j.filename}]}));
  }
  const send = useCallback(async (override?:string)=>{
    const text = (override ?? input).trim(); if(!text) return;
    setInput(''); setLastUser(text);
    updateActive(c=>({...c,messages:[...c.messages,{role:'user',content:text}]}));
    const ctrl = new AbortController(); setController(ctrl);
    const res = await fetch('/api/chat', {
      method:'POST', signal: ctrl.signal, headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        messages: [...active.messages, { role:'user', content:text }],
        attachments: active.files.map(f=>({file_id:f.file_id})),
        devMode, useCodeInterpreter: useCI
      })
    });
    if(!res.body) return; setStreaming(true);
    updateActive(c=>({...c,messages:[...c.messages,{role:'assistant',content:''}]}));
    const reader = res.body.getReader(); const decoder = new TextDecoder();
    while(true){
      const {done,value} = await reader.read(); if(done) break;
      const chunk = decoder.decode(value,{stream:true});
      const events = chunk.split('\n\n').filter(Boolean).map(l=>l.startsWith('data: ')?l.slice(6):null).filter(Boolean) as string[];
      for(const e of events){
        try{
          const json = JSON.parse(e);
          if(json.type==='response.output_text.delta'){
            const delta = json.delta as string;
            updateActive(c=>{
              const copy = {...c, messages:[...c.messages]};
              const last = copy.messages[copy.messages.length-1];
              copy.messages[copy.messages.length-1] = {...last, content: (last.content||'') + delta};
              return copy;
            });
          }
        }catch{}
      }
      scrollDown();
    }
    setStreaming(false); setController(null);
    if(active.messages.length<=1){ const title = text.length>32?text.slice(0,32)+'…':text; updateActive(c=>({...c,title})); }
  },[input,active,devMode,useCI]);
  function stop(){ controller?.abort(); setStreaming(false); setController(null); }
  function regenerate(){ if(!lastUser) return; updateActive(c=>({...c,messages:c.messages.slice(0,-1)})); send(lastUser); }
  function downloadCode(){
    const last = [...active.messages].reverse().find(m=>m.role==='assistant'); if(!last) return alert('Aucun message assistant trouvé.');
    const m = last.content.match(/```(\w+)?\s*([\s\S]*?)```/); if(!m) return alert('Aucun bloc de code ``` trouvé.');
    const lang = m[1]; const code = m[2].trim();
    const map:Record<string,string>={python:'py',py:'py',bash:'sh',sh:'sh',zsh:'sh',javascript:'js',js:'js',typescript:'ts',ts:'ts',json:'json',yaml:'yml',yml:'yml',powershell:'ps1',ps1:'ps1',java:'java',c:'c',cpp:'cpp',cs:'cs',go:'go',php:'php',rb:'rb',rust:'rs'};
    const ext = (lang && map[lang.toLowerCase()]) ? map[lang.toLowerCase()] : 'txt';
    const blob = new Blob([code], {type:'text/plain;charset=utf-8'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `script.${ext}`; a.click(); URL.revokeObjectURL(a.href);
  }
  return (
    <div className="grid grid-cols-[280px_1fr] h-dvh">
      <aside className="flex flex-col gap-2 p-3 border-r bg-white">
        <div className="flex items-center gap-2"><div className="text-lg font-semibold">GPT‑5 Studio</div></div>
        <button onClick={newChat} className="text-sm rounded-lg px-3 py-2 bg-neutral-900 text-white">+ Nouveau chat</button>
        <div className="text-xs text-neutral-500 mt-2">Conversations</div>
        <div className="flex-1 overflow-auto">
          {convos.map(c=>(
            <button key={c.id} onClick={()=>setActiveId(c.id)} className={`w-full text-left px-2 py-2 rounded-md text-sm ${c.id===activeId?'bg-neutral-200':'hover:bg-neutral-100'}`}>
              {c.title}
            </button>
          ))}
        </div>
        <div className="mt-auto flex gap-2">
          <button onClick={renameActive} className="text-xs px-2 py-1 border rounded-md">Renommer</button>
          <button onClick={deleteActive} className="text-xs px-2 py-1 border rounded-md">Supprimer</button>
        </div>
      </aside>
      <main className="flex flex-col min-h-0">
        <header className="p-3 border-b bg-white flex gap-3 items-center">
          <label className="text-sm flex items-center gap-2 ml-auto">
            <input type="checkbox" checked={devMode} onChange={e=>setDevMode(e.target.checked)} /> Mode Dev (code)
          </label>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={useCI} onChange={e=>setUseCI(e.target.checked)} /> Code Interpreter
          </label>
          <input type="file" onChange={e=>handleUpload(e.target.files)} className="text-sm" />
        </header>
        <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3 bg-neutral-50">
          {active.files.length>0 && (
            <div className="text-xs text-neutral-600 flex gap-2 flex-wrap">
              {active.files.map(f=><FilePill key={f.file_id} name={f.filename}/>)}
            </div>
          )}
          {active.messages.map((m,i)=>(<MessageBubble key={i} role={m.role} content={m.content}/>))}
        </div>
        <form onSubmit={(e)=>{e.preventDefault(); send();}} className="p-3 bg-white border-t">
          <div className="flex gap-2">
            <input className="flex-1 border rounded-xl px-3 py-2 focus:outline-none" placeholder="Écrivez un message..." value={input} onChange={e=>setInput(e.target.value)} />
            {!isStreaming ? <button className="px-4 py-2 rounded-xl bg-blue-600 text-white">Envoyer</button>
                           : <button type="button" onClick={stop} className="px-4 py-2 rounded-xl border">Stop</button>}
            <button type="button" onClick={regenerate} className="px-4 py-2 rounded-xl border">Régénérer</button>
            <button type="button" onClick={downloadCode} className="px-4 py-2 rounded-xl border">Télécharger le code</button>
          </div>
          {isStreaming && <div className="text-xs text-neutral-500 mt-1">Réponse en cours…</div>}
        </form>
      </main>
    </div>
  );
}
