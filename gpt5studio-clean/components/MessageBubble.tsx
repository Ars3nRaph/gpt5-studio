import React from 'react';
import Markdown from './Markdown';
export default function MessageBubble({role,content}:{role:'user'|'assistant'|'system';content:string}){
  const me = role==='user';
  return (<div className={`w-full flex ${me?'justify-end':'justify-start'}`}>
    <div className={`max-w-[900px] rounded-2xl px-4 py-3 shadow-sm whitespace-pre-wrap leading-relaxed ${me?'bg-blue-600 text-white':'bg-white border'}`}>
      {me ? <pre className="whitespace-pre-wrap">{content}</pre> : <Markdown content={content}/>}
    </div>
  </div>);
}
