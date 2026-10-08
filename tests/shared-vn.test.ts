import { it, expect } from 'vitest';
import { scenes } from '../src/story';
import { validateGraph } from '../scripts/vn-contract.mjs';
it('adapts native chapter and state resolvers to the shared contract',()=>{
 const result=validateGraph({entry:'arrival',scenes},{requireLineIds:false,targets:scene=>scene.resolve?['end-together','end-letter','end-quiet']:scene.bridge?['c2-from-together','c2-from-letter','c2-from-quiet']:[...[scene.next,scene.continuation].filter((id):id is string=>typeof id==='string'),...(scene.choices??[]).map((choice:{next:string})=>choice.next)]});
 expect(result.scenes).toBe(scenes.length);expect(result.choices).toBe(7);
});
