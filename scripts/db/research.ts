import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { databasePool } from './config.js';
const domains=z.enum(['damage','defense','resources','timing','procs','loot','crafting','seasonal']);
const manifestSchema=z.object({
  build:z.string().min(1),season:z.number().int().positive(),patch:z.string(),channel:z.enum(['live','ptr']),
  sources:z.array(z.object({locator:z.string().min(1),kind:z.enum(['official','datamine','normalized_export','local_manifest','measurement']),sha256:z.string().regex(/^[a-f0-9]{64}$/).nullable().default(null)})).min(1),
  mechanics:z.array(z.object({slug:z.string().regex(/^[a-z0-9-]+$/),domain:domains,title:z.string().min(1),status:z.enum(['unknown','hypothesis','datamined']).default('unknown'),assumptions:z.array(z.string()).default([])})),
  formulas:z.array(z.object({key:z.string(),mechanic:z.string(),source:z.string(),rawExpression:z.string().min(1),interpretation:z.string().optional(),unit:z.string().optional(),status:z.enum(['unresolved','interpreted','tested']).default('unresolved'),dependencies:z.array(z.object({symbol:z.string(),resolution:z.enum(['unknown','input','constant','formula']),constant:z.number().finite().optional(),formula:z.string().optional(),unit:z.string().optional()})).default([])})).default([]),
  rng:z.array(z.object({mechanic:z.string(),source:z.string(),distribution:z.enum(['unknown','bernoulli','binomial','geometric','weighted_choice','empirical']),probability:z.number().min(0).max(1).nullable(),independence:z.enum(['unknown','assumed','tested','rejected']),parameters:z.record(z.string(),z.unknown()).default({}),notes:z.string().optional()})).default([]),
});
const file=process.argv[2] ?? 'data/research/season15-plan.json';
const rawManifest=await readFile(file,'utf8');
const manifest=manifestSchema.parse(JSON.parse(rawManifest));
const inputSha256=createHash('sha256').update(rawManifest).digest('hex');
if(!manifest.mechanics.length) throw new Error('En az bir mekanik kaydı gerekli.');
const unique=(values:string[])=>new Set(values).size===values.length;
if(!unique(manifest.sources.map(source=>source.locator))||!unique(manifest.mechanics.map(mechanic=>mechanic.slug))||!unique(manifest.formulas.map(formula=>formula.key))) throw new Error('Kaynak, mekanik veya formül kimliği tekrar ediyor.');
const pool=databasePool(),client=await pool.connect();
try{
  await client.query('begin');
  await client.query('insert into builds(id,season_id,patch,channel) values($1,$2,$3,$4) on conflict(id) do nothing',[manifest.build,manifest.season,manifest.patch,manifest.channel]);
  const build=await client.query('select season_id,channel,patch from builds where id=$1',[manifest.build]);
  if(build.rows[0].season_id!==manifest.season||build.rows[0].channel!==manifest.channel||build.rows[0].patch!==manifest.patch) throw new Error('Build bağlamı uyuşmuyor.');
  const result=await client.query('insert into snapshots(build_id,manifest) values($1,$2) returning id',[manifest.build,JSON.stringify({kind:'research',schemaVersion:1,inputSha256,mechanics:manifest.mechanics.length,formulas:manifest.formulas.length,rng:manifest.rng.length})]);
  const snapshot=result.rows[0].id;
  const sources=new Map<string,string>(),mechanics=new Map<string,string>(),formulas=new Map<string,string>();
  for(const source of manifest.sources){const result=await client.query('insert into sources(snapshot_id,kind,locator,sha256) values($1,$2,$3,$4) returning id',[snapshot,source.kind,source.locator,source.sha256]);sources.set(source.locator,result.rows[0].id);}
  for(const mechanic of manifest.mechanics){const result=await client.query('insert into mechanics(snapshot_id,slug,domain,title,status,assumptions) values($1,$2,$3,$4,$5,$6) returning id',[snapshot,mechanic.slug,mechanic.domain,mechanic.title,mechanic.status,JSON.stringify(mechanic.assumptions)]);mechanics.set(mechanic.slug,result.rows[0].id);}
  for(const formula of manifest.formulas){
    if(!mechanics.has(formula.mechanic)||!sources.has(formula.source))throw new Error('Formül referansı çözülemedi.');
    const result=await client.query('insert into formulas(snapshot_id,mechanic_id,source_id,raw_expression,interpretation,unit,validation_status) values($1,$2,$3,$4,$5,$6,$7) returning id',[snapshot,mechanics.get(formula.mechanic),sources.get(formula.source),formula.rawExpression,formula.interpretation ?? null,formula.unit ?? null,formula.status]);formulas.set(formula.key,result.rows[0].id);
  }
  for(const formula of manifest.formulas)for(const dependency of formula.dependencies){
    if(dependency.resolution==='formula'&&!formulas.has(dependency.formula ?? ''))throw new Error('Bağımlı formül çözülemedi.');
    await client.query('insert into formula_dependencies(formula_id,snapshot_id,symbol,resolution,constant_value,dependency_formula_id,unit) values($1,$2,$3,$4,$5,$6,$7)',[formulas.get(formula.key),snapshot,dependency.symbol,dependency.resolution,dependency.constant ?? null,formulas.get(dependency.formula ?? '') ?? null,dependency.unit ?? null]);
  }
  for(const rng of manifest.rng){
    if(!mechanics.has(rng.mechanic)||!sources.has(rng.source))throw new Error('RNG referansı çözülemedi.');
    await client.query('insert into rng_models(snapshot_id,mechanic_id,source_id,distribution,probability,independence_status,parameters,notes) values($1,$2,$3,$4,$5,$6,$7,$8)',[snapshot,mechanics.get(rng.mechanic),sources.get(rng.source),rng.distribution,rng.probability,rng.independence,JSON.stringify(rng.parameters),rng.notes ?? null]);
  }
  await client.query("update snapshots set state='published' where id=$1",[snapshot]);await client.query('commit');console.log(`Published research snapshot ${snapshot}; verification status was preserved.`);
}catch{await client.query('rollback');throw new Error('Araştırma içe aktarımı başarısız; işlem geri alındı. Manifest, referanslar ve DB bağlantısını kontrol et.');}
finally{client.release();await pool.end();}
