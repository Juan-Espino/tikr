// Isolated, credential-cleared browser fixture. Copies explicit source paths only;
// never reads .env files or owner browser/admission data. Artifacts stay in TEMP.
import { mkdtemp, cp, writeFile, mkdir, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
const root = resolve(import.meta.dirname, "..");
const target = await mkdtemp(join(tmpdir(), "tikr-redesign-qa-"));
for (const path of [
  "src",
  "public",
  "convex",
  "tests/support",
  "package.json",
  "tsconfig.json",
  "next.config.js",
  "postcss.config.js",
]) {
  try {
    await cp(join(root, path), join(target, path), { recursive: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
await symlink(
  join(root, "node_modules"),
  join(target, "node_modules"),
  "junction",
);
if (!process.argv.includes("--unconfigured")) {
  await cp(
    join(target, "src/lib/market-runtime.ts"),
    join(target, "src/lib/market-live-runtime.ts"),
  );
  await writeFile(
    join(target, "src/lib/qa-fixture.ts"),
    `
import {createFixture,portfolios,symbols} from '../../tests/support/market-fixture.ts';
const state = globalThis as typeof globalThis & { qaFixture?: ReturnType<typeof createFixture> };
export const fixture=()=>state.qaFixture??=(createFixture('after','isolated-browser-qa'));
export {portfolios,symbols};
export function reset(){state.qaFixture=createFixture('after','isolated-browser-qa-reset-'+Date.now());}
`,
  );
  await writeFile(
    join(target, "src/lib/market-runtime.ts"),
    `
import {fixture} from './qa-fixture';
import {publicView} from './market-live-runtime';
import type {MarketRequest,MarketResponse} from './market-contract';
export async function openMarket(request:MarketRequest):Promise<{initial:MarketResponse;settled:Promise<MarketResponse>}> {
 return {initial:{status:'refreshing'},settled:fixture().run({portfolios:request.portfolios,amount:request.amount},request.range,request.retry,request.history).then(({final,history})=>({...publicView(final,request.amount),history:final.result?history:undefined,dataQuality:'synthetic',evidenceExpiresAt:new Date(fixture().expires()).toISOString()}))};
}
`,
  );
  await writeFile(
    join(target, "src/app/api/assets/route.ts"),
    `
import {symbols} from '~/lib/qa-fixture';
export async function GET(){return Response.json({mode:'sample'});}
export async function POST(request:Request){const q=new URL(request.url).searchParams.get('q')?.toUpperCase()??'';return Response.json(symbols.filter(ticker=>ticker.includes(q)).map(ticker=>({ticker,name:'Synthetic '+ticker,exchange:'SYNTHETIC'})));}
`,
  );
  await mkdir(join(target, "src/app/qa-fixture/control"), { recursive: true });
  await writeFile(
    join(target, "src/app/qa-fixture/control/route.ts"),
    `
import {fixture,reset} from '~/lib/qa-fixture';
export async function GET(){const f=fixture();return Response.json({synthetic:true,provider:f.provider,database:f.database});}
export async function POST(request:Request){const body=await request.json();const f=fixture();if(body.action==='reset')reset();if(body.action==='restart')f.restart();if(body.action==='revoke')f.revoke();if(body.action==='correct')f.correct();if(body.action==='failure')f.setFailure(body.value);if(body.action==='date')f.setNow(body.value);if(body.action==='expiry')f.setEvidenceUntil(body.value);return Response.json({synthetic:true});}
`,
  );
  await mkdir(join(target, "src/app/qa-fixture/seed"), { recursive: true });
  await writeFile(
    join(target, "src/app/qa-fixture/seed/route.ts"),
    `
import {portfolios} from '~/lib/qa-fixture';
export async function GET(){
 const values=portfolios.map((p,i)=>({...p,name:'Synthetic experiment '+(i+1),holdings:p.holdings.map(h=>({ticker:h.symbol,weight:h.weight})),manual:false,pinned:i===0,updated:i,amount:String(10000+i*5000),range:'1W',rangeChoice:'explicit'}));
 const stored=JSON.stringify({version:1,portfolios:values,draft:null});
 const html="<html><body><h1>Isolated synthetic QA only</h1><button id='seed'>Seed isolated portfolios</button><script>document.getElementById('seed').onclick=()=>{localStorage.setItem('tikr-demo-v1',"+JSON.stringify(stored)+");location.href='/dashboard';};</script></body></html>";
 return new Response(html,{headers:{'Content-Type':'text/html'}});
}

`,
  );
}
// Optional narrow calendar regression uses the actual personal loader + durable coordinator.
if (process.argv.includes("--calendar")) {
  await writeFile(
    join(target, "src/lib/qa-fixture.ts"),
    `
import {calendarFixture} from '../../tests/support/calendar-fixture.mjs';
export const symbols=['AAA','BBB','SPY'];
export const portfolios=[{id:'calendar-a',holdings:[{symbol:'AAA',weight:'100'}]},{id:'calendar-b',holdings:[{symbol:'BBB',weight:'100'}]}];
const state=globalThis as typeof globalThis & {calendarScenario?:string; calendarQA?:any};
export function reset(scenario='sunday'){state.calendarScenario=scenario;state.calendarQA=undefined;}
export function fixture(){
 if(!state.calendarQA){
  const holiday=state.calendarScenario==='holiday';
  const f=calendarFixture(holiday?['2026-04-01','2026-04-02']:['2026-11-09','2026-11-12','2026-11-13'],holiday?'2026-04-05T14:00Z':'2026-11-15T15:00Z',holiday?'2026-03-01':'2026-11-01');
  state.calendarQA={expires:()=>Date.parse('2027-01-01'),run:async(request,range)=>{await f.calendar();const job=await f.run(request,range);return {final:await job.settled,history:[]};}};
 }
 return state.calendarQA;
}
`,
  );
  await writeFile(
    join(target, "src/app/qa-fixture/control/route.ts"),
    `
import {reset} from '~/lib/qa-fixture';
export async function POST(request:Request){const body=await request.json();reset(body.scenario==='holiday'?'holiday':'sunday');return Response.json({synthetic:true});}
`,
  );
}
const allow = [
  "SystemRoot",
  "WINDIR",
  "PATH",
  "PATHEXT",
  "TEMP",
  "TMP",
  "COMSPEC",
  "USERPROFILE",
  "ProgramFiles",
  "ProgramFiles(x86)",
  "PROCESSOR_ARCHITECTURE",
  "NUMBER_OF_PROCESSORS",
];
const env = Object.fromEntries(
  allow
    .filter((key) => process.env[key] !== undefined)
    .map((key) => [key, process.env[key]]),
);
env.NEXT_TELEMETRY_DISABLED = "1";
env.SKIP_ENV_VALIDATION = "1";
const port = process.env.TIKR_QA_PORT ?? "43139";
console.log(
  JSON.stringify({
    target,
    url: `http://127.0.0.1:${port}/qa-fixture/seed`,
    scope: "isolated synthetic; no credentials or owner storage",
  }),
);
const child = spawn(
  process.execPath,
  [
    join(root, "node_modules/next/dist/bin/next"),
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    port,
  ],
  { cwd: target, env, stdio: "inherit", windowsHide: true },
);
process.on("SIGINT", () => child.kill());
process.on("SIGTERM", () => child.kill());
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
