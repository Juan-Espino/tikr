import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allocation, basisPoints, equalWeights, metrics, ranges, series, validAmount, storageSchema } from '../src/lib/demo.ts';

test('equal weights exactly allocate integer hundredths, with remainder at the end', () => {
 assert.deepEqual(equalWeights(['SPY','MSFT','NVDA']).map(h=>h.weight), ['33.33','33.33','33.34']);
 for (let count=1;count<=6;count++) assert.equal(allocation(equalWeights(['SPY','MSFT','NVDA','AAPL','AMZN','SCHD'].slice(0,count))).valid,true);
 assert.deepEqual(equalWeights([]),[]);
});
test('rejects incomplete, excessive, zero, negative, malformed and duplicate allocations',()=>{
 for(const weight of ['99.99','100.01','0','-1','NaN','1e2','100.000','']) assert.equal(allocation([{ticker:'SPY',weight}]).valid,false);
 assert.equal(allocation([{ticker:'SPY',weight:'50'},{ticker:'SPY',weight:'50'}]).valid,false);
 assert.equal(basisPoints('33.34'),3334);
 assert.equal(validAmount('0'),false); assert.equal(validAmount('100,000'),false); assert.equal(validAmount('100000001'),false); assert.equal(validAmount('0.01'),true);
});
test('common dates and starting amount across every range; no missing holding silently dropped',()=>{
 for(const range of ranges){const a=series(equalWeights(['SPY','MSFT']),range,10000);const b=series(equalWeights(['NVDA']),range,10000);assert.deepEqual(a.map(p=>p.date),b.map(p=>p.date));assert.equal(a[0].value,10000);assert.equal(b[0].value,10000);assert.equal(a.at(-1).date,'2026-10-22');assert.deepEqual(a,series(equalWeights(['SPY','MSFT']),range,10000));}
 assert.throws(()=>series([{ticker:'UNKNOWN',weight:'100'}],'1Y',10000),/No sample history/);
});
test('buy-and-hold values are weighted asset indices and scale with starting amount',()=>{
 const holdings=[{ticker:'SPY',weight:'25'},{ticker:'MSFT',weight:'75'}];const combined=series(holdings,'1M',10000);const spy=series(equalWeights(['SPY']),'1M',10000);const msft=series(equalWeights(['MSFT']),'1M',10000);const double=series(holdings,'1M',20000);
 combined.forEach((p,i)=>{assert.ok(Math.abs(p.value-(spy[i].value*.25+msft[i].value*.75))<1e-8);assert.ok(Math.abs(double[i].value-p.value*2)<1e-8);});
});
test('return, ending value and peak-to-trough drawdown derive from the displayed series',()=>{
 const values=[100,120,90,110].map((value,i)=>({date:String(i),value}));const m=metrics(values);assert.equal(m.ending,110);assert.ok(Math.abs(m.return-10)<1e-10);assert.equal(m.drawdown,-25);
 assert.equal(storageSchema.safeParse({version:2,portfolios:[],draft:null}).success,false);
});

test('legacy sample holdings migrate to SPY without losing saved portfolios or drafts',()=>{
 const portfolio={id:'saved',name:'My sample',holdings:[{ticker:'VOO',weight:'100'}],manual:true,pinned:true,updated:123,amount:'2500',range:'5Y'};
 const restored=storageSchema.parse({version:1,portfolios:[portfolio],draft:{...portfolio,id:'draft',holdings:[{ticker:'VOO',weight:'25'},{ticker:'MSFT',weight:'75'}]}});
 assert.deepEqual(restored.portfolios[0],{...portfolio,holdings:[{ticker:'SPY',weight:'100'}]});
 assert.deepEqual(restored.draft.holdings,[{ticker:'SPY',weight:'25'},{ticker:'MSFT',weight:'75'}]);
 assert.doesNotThrow(()=>series(restored.portfolios[0].holdings,'5Y',2500));
 assert.equal(storageSchema.safeParse({version:1,portfolios:[{...portfolio,holdings:[{ticker:'../UNKNOWN',weight:'100'}]}],draft:null}).success,false);
});
