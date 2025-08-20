export function sseHeaders(){return {"Content-Type":"text/event-stream","Cache-Control":"no-cache, no-transform","Connection":"keep-alive","X-Accel-Buffering":"no"} as const}
export function writeEvent(data:unknown){return `data: ${JSON.stringify(data)}\n\n`}
