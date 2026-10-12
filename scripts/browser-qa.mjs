import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
// Isolated headless web test, never attaches to a user's browser profile/window.
const require=createRequire(path.resolve('.tmp/browser-qa/package.json'));
const {chromium}=require('playwright');
const origin=process.argv[2]??'http://127.0.0.1:4321';
const browser=await chromium.launch({channel:'msedge',headless:true});
const checks=[],errors=[];
await mkdir('output/browser-qa',{recursive:true});
try{
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
    const context=await browser.newContext({viewport,reducedMotion:'reduce'});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/skills/',{waitUntil:'networkidle'});
    await page.locator('[data-search]').fill('Fireball');
    await page.locator('[data-filter="class"]').selectOption('sorcerer');
    await page.locator('[data-filter="type"]').selectOption('active');
    assert.equal(await page.locator('[data-entry]:visible').count(),1);
    assert((await page.locator('[data-entry]:visible').textContent()).includes('Fireball'));
    assert(await page.locator('[data-entry]:visible img').evaluate(img=>img.complete&&img.naturalWidth>0));
    await page.screenshot({path:`output/browser-qa/skills-${viewport.width}.png`,fullPage:true});
    checks.push(`skills search/class/type and original icon ${viewport.width}`);
    await page.goto(origin+'/skill-tree/#sorcerer',{waitUntil:'networkidle'});
    await page.locator('[data-node-id]').first().waitFor();
    assert.equal(await page.locator('[data-node-id]').count(),282);
    const search=page.locator('[data-tree-search]');await search.fill('Fireball');
    await page.locator('[data-results] button').filter({hasText:/^Fireball$/}).click();
    assert.equal(await page.locator('[data-detail-name]').textContent(),'Fireball');
    assert((await page.locator('[data-detail-link]').getAttribute('href')).includes('fireball-165023'));
    assert(await page.locator('[data-detail-emblem] img').evaluate(img=>img.complete&&img.naturalWidth>0));
    await page.locator('[data-tree-search]').fill('');
    await page.locator('[data-tree-tab="druid"]').click();
    assert.equal(await page.locator('[data-node-id]').count(),337);
    await page.locator('[data-tree-tab="sorcerer"]').click();
    await page.locator('[data-tree-fit]').click();
    await page.locator('.tree-viewport').screenshot({path:`output/browser-qa/tree-full-${viewport.width}.png`});
    await page.locator('[data-tree-start]').click();
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({path:`output/browser-qa/tree-${viewport.width}.png`,fullPage:true});
    const tabOrder=await page.locator('[data-tree-tab]').evaluateAll(tabs=>tabs.map(tab=>tab.dataset.treeTab));
    await page.locator('[data-tree-tab="sorcerer"]').focus();await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('[role="tab"][aria-selected="true"]').getAttribute('data-tree-tab'),tabOrder[(tabOrder.indexOf('sorcerer')+1)%tabOrder.length]);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    assert.equal(overflow,false,`Horizontal page overflow ${viewport.width}`);
    checks.push(`tree count/search/detail/tab/keyboard/width ${viewport.width}`);
    await context.close();
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({browser:browser.version(),checks,errors},null,2));
  await writeFile('output/browser-qa/report.json',JSON.stringify({origin,browser:browser.version(),playwright:require('playwright/package.json').version,at:new Date().toISOString(),checks,errors},null,2)+'\n');
}finally{await browser.close();}
